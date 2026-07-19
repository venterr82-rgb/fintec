// src/app/api/tier-upgrade/checkout/route.ts
// Creates a Yoco checkout for the price difference between a client's
// current tier and a higher one, so they can unlock more document slots
// mid-onboarding (or later). Same product-discriminator pattern as the
// firm setup fee: pending_checkouts.product = 'tier_upgrade' tells the
// shared webhook handler to just bump people.tier, not register/gate
// anything, since this client already has an account.

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { siteConfig } from '@/lib/config/site'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { try { cookieStore.set(name, value, options) } catch {} },
        remove(name: string, options: any) { try { cookieStore.set(name, '', { ...options, maxAge: 0 }) } catch {} }
      } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase.from('users').select('email, person_id').eq('id', session.user.id).single()
  if (!me?.person_id) return NextResponse.json({ error: 'No linked client profile' }, { status: 400 })

  const { data: person } = await supabase.from('people').select('tier').eq('id', me.person_id).single()

  const { targetTier } = await request.json()
  const targetTierLower = String(targetTier ?? '').toLowerCase()
  // people.tier is lowercase (basic/standard/premium/custom); siteConfig's
  // pricingTiers names are capitalized for display — compare case-insensitively.
  const target = siteConfig.pricingTiers.find(t => t.name.toLowerCase() === targetTierLower)
  if (!target) return NextResponse.json({ error: 'Unknown tier' }, { status: 400 })

  const current = siteConfig.pricingTiers.find(t => t.name.toLowerCase() === (person?.tier ?? 'basic').toLowerCase())
  const currentAmount = current?.amount ?? 0
  const diff = target.amount - currentAmount
  if (diff <= 0) return NextResponse.json({ error: 'That is not an upgrade from your current tier.' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: diff,
      currency: 'ZAR',
      successUrl: `${appUrl}/onboarding?upgraded=true`,
      cancelUrl: `${appUrl}/onboarding`,
      failureUrl: `${appUrl}/onboarding`,
      metadata: { email: me.email, personId: me.person_id, product: 'tier_upgrade', tier: targetTierLower },
    }),
  })

  if (!yocoRes.ok) {
    const errBody = await yocoRes.text()
    console.error('Yoco tier-upgrade checkout creation failed:', yocoRes.status, errBody)
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 502 })
  }

  const checkout = await yocoRes.json()

  const admin = adminClient()
  const { error: insertError } = await admin.from('pending_checkouts').insert({
    checkout_id: checkout.id,
    email: me.email,
    amount: diff,
    product: 'tier_upgrade',
    tier_name: targetTierLower,
    person_id: me.person_id,
  })
  if (insertError) {
    console.error('Could not record pending tier-upgrade checkout:', insertError)
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ redirectUrl: checkout.redirectUrl })
}
