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

  const { data: me } = await supabase.from('users').select('person_id').eq('id', session.user.id).single()
  if (!me?.person_id) return NextResponse.json({ error: 'No linked client profile' }, { status: 400 })

  const body = await request.json()
  const {
    full_name, id_number, tax_number, phone,
    residential_address_line1, residential_city, residential_province, residential_postal_code,
  } = body

  if (!full_name?.trim() || !id_number?.trim() || !tax_number?.trim()) {
    return NextResponse.json({ error: 'Full name, ID number, and tax number are required.' }, { status: 400 })
  }

  const first_name = full_name.trim().split(' ')[0]
  const last_name = full_name.trim().split(' ').slice(1).join(' ') || full_name.trim()

  const { error } = await supabase.from('people').update({
    first_name, last_name,
    id_number: id_number.trim(),
    tax_number: tax_number.trim(),
    phone: phone?.trim() || null,
    residential_address_line1: residential_address_line1?.trim() || null,
    residential_city: residential_city?.trim() || null,
    residential_province: residential_province?.trim() || null,
    residential_postal_code: residential_postal_code?.trim() || null,
    sars_poa_status: 'awaiting_authorisation',
    sars_poa_acknowledged_at: new Date().toISOString(),
  }).eq('id', me.person_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabase.from('users').update({ full_name: full_name.trim() }).eq('id', session.user.id)

  return NextResponse.json({ ok: true })
}
