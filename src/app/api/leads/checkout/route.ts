// src/app/api/leads/checkout/route.ts
// Creates a Yoco Checkout session for the R1,500 platform setup fee — a
// one-off B2B charge to Fintec Group's own Yoco account (this is Fintec's
// own revenue, not a client-of-a-firm payment). Kept entirely separate
// from /api/checkout (the client tax-payment flow): distinct pending_checkouts
// `product` value ('firm_setup_fee') is how the shared webhook handler
// tells the two apart, since Yoco's webhook payload carries no metadata
// of its own.
//
// The amount is fixed server-side from firmsConfig — never accepted from
// the client — since this is a flat fee, not a client-chosen amount.

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { firmsConfig } from '@/lib/config/firms'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  const { leadId } = await request.json()

  if (!leadId) {
    return NextResponse.json({ error: 'Missing lead id.' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: lead } = await supabase.from('leads').select('id, email').eq('id', leadId).maybeSingle()

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: firmsConfig.setupFeeAmount,
      currency: 'ZAR',
      successUrl: `${appUrl}/for-firms?paid=true`,
      cancelUrl: `${appUrl}/for-firms`,
      failureUrl: `${appUrl}/for-firms`,
      metadata: { email: lead.email, leadId: lead.id, product: 'firm_setup_fee' },
    }),
  })

  if (!yocoRes.ok) {
    const errBody = await yocoRes.text()
    console.error('Yoco firm-setup-fee checkout creation failed:', yocoRes.status, errBody)
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 502 })
  }

  const checkout = await yocoRes.json()

  const { error: insertError } = await supabase.from('pending_checkouts').insert({
    checkout_id: checkout.id,
    email: lead.email,
    amount: firmsConfig.setupFeeAmount,
    product: 'firm_setup_fee',
    lead_id: lead.id,
  })

  if (insertError) {
    console.error('Could not record pending firm checkout:', insertError)
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 500 })
  }

  await supabase.from('leads').update({ checkout_id: checkout.id }).eq('id', lead.id)

  return NextResponse.json({ redirectUrl: checkout.redirectUrl })
}
