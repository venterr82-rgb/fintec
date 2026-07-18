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
import { siteConfig } from '@/lib/config/site'
import { firmsConfig } from '@/lib/config/firms'

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
  let tierName: string | null = null
  let product = 'tax_service'
  let leadId: string | null = null

  if (orderId) {
    const { data: pending } = await supabase
      .from('pending_checkouts')
      .select('email, amount, tier_name, product, lead_id')
      .eq('checkout_id', orderId)
      .maybeSingle()

    if (pending) {
      email = pending.email
      amount = pending.amount
      tierName = pending.tier_name
      product = pending.product ?? 'tax_service'
      leadId = pending.lead_id
    } else {
      console.warn(`No pending_checkouts match for order_id ${orderId} — payment ${yocoPaymentId} recorded without email`)
    }
  }

  // Firm platform-setup-fee flow (B2B, sells the platform itself) — entirely
  // separate from the client tax-service flow below. No verified_payments
  // row (that table exists purely to gate client self-registration, which
  // doesn't apply here), no registration email — just mark the lead paid
  // and send the onboarding calendar link.
  if (product === 'firm_setup_fee') {
    if (leadId) {
      await supabase.from('leads').update({
        paid_setup_fee: true,
        paid_at: new Date().toISOString(),
      }).eq('id', leadId)
    }

    if (email) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: `Your ${siteConfig.companyName} platform setup is confirmed`,
        html: `
          <p>Payment received — thank you.</p>
          <p>Book your onboarding call here:</p>
          <p><a href="${firmsConfig.onboardingCalendarUrl}">${firmsConfig.onboardingCalendarUrl}</a></p>
        `,
      })
    }

    return NextResponse.json({ ok: true })
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const params = new URLSearchParams({ token: yocoPaymentId })
    if (tierName) params.set('tier', tierName)
    if (amount) params.set('amount', String(Math.round(amount / 100)))
    const registerUrl = `${appUrl}/register?${params.toString()}`

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `Your ${siteConfig.companyName} portal access is ready`,
      html: `
        <p>Payment confirmed — thank you.</p>
        <p>Click the link below to create your ${siteConfig.companyName} client portal account:</p>
        <p><a href="${registerUrl}">${registerUrl}</a></p>
      `,
    })
  }

  return NextResponse.json({ ok: true })
}
