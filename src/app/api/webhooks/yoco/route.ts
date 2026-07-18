// src/app/api/webhooks/yoco/route.ts
// Receives payment.created events from Yoco and provisions a registration token.
//
// Yoco's webhook payload is thin — { business_id, event_type, order_id, payment_id } —
// with no email or amount. We recover the payer's email from `pending_checkouts`,
// which /api/checkout populated at checkout-creation time, keyed by checkout id.
// Assumption (unverified against a live Yoco payment): the webhook's `order_id`
// matches the `id` returned when the checkout was created. If it doesn't, the
// lookup below simply misses and the payment is recorded with no email for
// manual reconciliation, rather than failing the webhook.

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { Resend } from 'resend'

const REPLAY_THRESHOLD_SECONDS = 3 * 60

// Service role client — this route has no user session, only a verified webhook signature.
const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Yoco webhooks follow the Standard Webhooks scheme: HMAC-SHA256 over
// "{webhook-id}.{webhook-timestamp}.{raw-body}", secret is a base64 string
// prefixed with "whsec_".
function verifySignature(rawBody: string, headers: Headers, secret: string): boolean {
  const id = headers.get('webhook-id')
  const timestamp = headers.get('webhook-timestamp')
  const signatureHeader = headers.get('webhook-signature')
  if (!id || !timestamp || !signatureHeader) return false

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(ageSeconds) || ageSeconds > REPLAY_THRESHOLD_SECONDS) return false

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const signedContent = `${id}.${timestamp}.${rawBody}`
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64')

  // webhook-signature can contain multiple space-separated "v1,<sig>" entries
  const candidates = signatureHeader.split(' ').map(part => part.split(',')[1]).filter(Boolean)

  return candidates.some(candidate => {
    try {
      const a = Buffer.from(candidate, 'base64')
      const b = Buffer.from(expected, 'base64')
      return a.length === b.length && timingSafeEqual(a, b)
    } catch {
      return false
    }
  })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const secret = process.env.YOCO_WEBHOOK_SECRET

  if (!secret || !verifySignature(rawBody, request.headers, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)

  if (event.event_type !== 'payment.created') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const yocoPaymentId = event.payment_id
  const orderId = event.order_id

  if (!yocoPaymentId) {
    return NextResponse.json({ error: 'Missing payment_id in payload' }, { status: 400 })
  }

  const supabase = adminClient()

  let email: string | null = null
  let amount: number | null = null

  if (orderId) {
    const { data: pending } = await supabase
      .from('pending_checkouts')
      .select('email, amount')
      .eq('checkout_id', orderId)
      .maybeSingle()

    if (pending) {
      email = pending.email
      amount = pending.amount
    } else {
      console.warn(`No pending_checkouts match for order_id ${orderId} — payment ${yocoPaymentId} recorded without email`)
    }
  }

  const { error: insertError } = await supabase.from('verified_payments').insert({
    email,
    amount,
    yoco_payment_id: yocoPaymentId,
  })

  // Ignore unique-violation (webhook retried for an already-recorded payment); surface other errors.
  if (insertError && insertError.code !== '23505') {
    return NextResponse.json({ error: 'Could not store payment' }, { status: 500 })
  }

  if (email) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const registerUrl = `https://portal.fintecgroup.co.za/register?token=${yocoPaymentId}`

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Your Fintec Group portal access is ready',
      html: `
        <p>Payment confirmed — thank you.</p>
        <p>Click the link below to create your Fintec Group client portal account:</p>
        <p><a href="${registerUrl}">${registerUrl}</a></p>
      `,
    })
  }

  return NextResponse.json({ ok: true })
}
