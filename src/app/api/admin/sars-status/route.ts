import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function PUT(request: NextRequest) {
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

  const { data: me } = await supabase.from('users').select('role').eq('id', session.user.id).single()
  if (me?.role !== 'admin' && me?.role !== 'staff') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { personId, action } = await request.json()
  if (!personId || !['added', 'authorised'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const update: Record<string, any> = action === 'added'
    ? { sars_added_at: new Date().toISOString() }
    : { sars_poa_status: 'authorised', sars_authorised_at: new Date().toISOString(), onboarding_step: 2 }

  const { error } = await supabase.from('people').update(update).eq('id', personId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
