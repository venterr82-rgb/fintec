import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { try { cookieStore.set(name, value, options) } catch {} },
        remove(name: string, options: any) { try { cookieStore.set(name, '', { ...options, maxAge: 0 }) } catch {} }
      } }
  )
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase.from('users').select('tenant_id, person_id').eq('id', session.user.id).single()
  if (!me?.person_id) return NextResponse.json({ error: 'No linked client profile' }, { status: 400 })

  const { bank_name, account_holder, account_number, account_type, branch_code } = await request.json()
  if (!bank_name || !account_holder?.trim() || !account_number?.trim() || !account_type) {
    return NextResponse.json({ error: 'Bank, account holder, account number, and account type are required.' }, { status: 400 })
  }

  // Supersede any previous banking record for this person rather than
  // accumulating duplicates.
  await supabase.from('client_banking_details').update({ is_current: false }).eq('person_id', me.person_id)

  const { error } = await supabase.from('client_banking_details').insert({
    tenant_id: me.tenant_id,
    person_id: me.person_id,
    bank_name, account_holder: account_holder.trim(), account_number: account_number.trim(),
    account_type, branch_code: branch_code || null,
    is_current: true,
    confirmed_date: new Date().toISOString().split('T')[0],
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { error: stepErr } = await supabase.from('people').update({ onboarding_step: 3 }).eq('id', me.person_id)
  if (stepErr) return NextResponse.json({ error: stepErr.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
