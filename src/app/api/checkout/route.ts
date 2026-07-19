// src/app/api/checkout/route.ts
// Creates a Yoco Checkout session and records the payer's email against the
// checkout id, since Yoco's payment.created webhook carries no email or
// metadata of its own — only order_id/payment_id.

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { siteConfig } from '@/lib/config/site'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  const { email, amount, tierName } = await request.json()

  if (!email?.trim() || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Email and amount are required.' }, { status: 400 })
  }

  // Never trust a client-supplied amount for a known tier — recompute it
  // server-side from siteConfig so a forged request can't buy a paid tier
  // for an arbitrary (e.g. R1) amount. Unrecognized tierName (or none) is
  // rejected outright rather than allowed through at whatever amount was sent.
  const matchedTier = siteConfig.pricingTiers.find(t => t.name === tierName)
  if (!matchedTier || matchedTier.amount !== Math.round(amount)) {
    return NextResponse.json({ error: 'Invalid tier or amount.' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: Math.round(amount),
      currency: 'ZAR',
      successUrl: `${appUrl}/register?tier=${encodeURIComponent(tierName ?? '')}&amount=${Math.round(amount / 100)}`,
      cancelUrl: `${appUrl}/`,
      failureUrl: `${appUrl}/`,
      metadata: { email: email.toLowerCase().trim() },
    }),
  })

  if (!yocoRes.ok) {
    const errBody = await yocoRes.text()
    console.error('Yoco checkout creation failed:', yocoRes.status, errBody)
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 502 })
  }

  const checkout = await yocoRes.json()

  const supabase = adminClient()
  const { error: insertError } = await supabase.from('pending_checkouts').insert({
    checkout_id: checkout.id,
    email: email.toLowerCase().trim(),
    amount: Math.round(amount),
    tier_name: tierName ?? null,
  })

  if (insertError) {
    console.error('Could not record pending checkout:', insertError)
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ redirectUrl: checkout.redirectUrl })
}
