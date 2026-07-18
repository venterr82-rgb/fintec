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
  const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', session.user.id).single()
  const body = await request.json()

  const { data, error } = await supabase.from('tax_cases')
    .insert({ ...body, tenant_id: userData?.tenant_id })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Generate document checklist
  await supabase.rpc('generate_tax_documents', { p_case_id: data.id })

  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest) {
  const supabase = await getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...body } = await request.json()

  // Convert empty strings to null for numeric fields
  const numericFields = ['taxable_income','tax_liability','paye_credits','prov_tax_p1','prov_tax_p2',
    'ra_deduction','result_amount','effective_rate','current_ra_monthly','suggested_ra_monthly','ra_max_deductible']
  const cleaned = { ...body }
  numericFields.forEach(f => { if (cleaned[f] === '' || cleaned[f] === undefined) cleaned[f] = null })

  const { data, error } = await supabase.from('tax_cases').update(cleaned).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
