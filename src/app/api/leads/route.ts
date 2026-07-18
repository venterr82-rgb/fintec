// src/app/api/leads/route.ts
// Captures a firm's interest BEFORE payment, so an abandoned/partial
// checkout is still visible — separate from the client tax-payment flow
// entirely (see /api/checkout for that).

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  const { firmName, contactName, email, phone, approxClientCount } = await request.json()

  if (!firmName?.trim() || !contactName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Firm name, contact name, and email are required.' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data, error } = await supabase.from('leads').insert({
    firm_name: firmName.trim(),
    contact_name: contactName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || null,
    approx_client_count: approxClientCount ? Number(approxClientCount) : null,
  }).select('id').single()

  if (error || !data) {
    console.error('Could not create lead:', error)
    return NextResponse.json({ error: 'Could not save your details. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ leadId: data.id })
}
