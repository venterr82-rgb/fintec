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

async function requireStaff(supabase: Awaited<ReturnType<typeof getSupabase>>, userId: string) {
  const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', userId).single()
  if (!userData || !['admin', 'staff'].includes(userData.role)) return null
  return userData
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userData = await requireStaff(supabase, session.user.id)
  if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json()

  const { data, error } = await supabase.from('tax_income_lines')
    .insert({ ...body, tenant_id: userData.tenant_id })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest) {
  const supabase = await getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await requireStaff(supabase, session.user.id))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id, ...body } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase.from('tax_income_lines').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await requireStaff(supabase, session.user.id))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.from('tax_income_lines').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
