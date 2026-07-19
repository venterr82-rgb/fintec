// src/app/api/auth/register/route.ts
// Creates a new client account after Yoco payment

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role to create auth users and insert public.users row
const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  const { full_name, email, phone, password, token } = await request.json()

  if (!full_name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }
  if (!token) {
    return NextResponse.json({ error: 'Valid payment required' }, { status: 401 })
  }

  const supabase = adminClient()

  const { data: payment } = await supabase
    .from('verified_payments')
    .select('id, tier_name')
    .eq('yoco_payment_id', token)
    .eq('used', false)
    .maybeSingle()

  if (!payment) {
    return NextResponse.json({ error: 'Valid payment required' }, { status: 401 })
  }

  // Check if email already registered
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 })
  }

  // Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true, // skip email verification for now — they just paid
  })

  if (authErr || !authData.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Could not create account.' }, { status: 400 })
  }

  // Get tenant ID (Fintec Group)
  const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()

  // Insert into public.users with role = client
  const { error: userErr } = await supabase.from('users').insert({
    id: authData.user.id,
    tenant_id: tenant?.id,
    email: email.toLowerCase().trim(),
    full_name: full_name.trim(),
    role: 'client',
    is_active: true,
  })

  if (userErr) {
    // Rollback: delete the auth user if public.users insert failed
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Account setup failed. Please contact support.' }, { status: 500 })
  }

  // Also create a people record so the tax dashboard can link to them
  const { data: personData } = await supabase.from('people').insert({
    tenant_id: tenant?.id,
    first_name: full_name.trim().split(' ')[0],
    last_name: full_name.trim().split(' ').slice(1).join(' ') || full_name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || null,
    has_portal_access: true,
    tier: payment.tier_name?.toLowerCase() ?? 'basic',
  }).select().single()

  // Link the person to the user
  if (personData) {
    await supabase.from('users')
      .update({ person_id: personData.id })
      .eq('id', authData.user.id)
  }

  // Mark the payment token as used so it can't be reused for another account
  await supabase.from('verified_payments').update({ used: true }).eq('id', payment.id)

  return NextResponse.json({ ok: true, userId: authData.user.id })
}
