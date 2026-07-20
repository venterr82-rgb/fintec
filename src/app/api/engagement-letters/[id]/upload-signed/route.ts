import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

  const { data: me } = await supabase.from('users').select('tenant_id, role, person_id').eq('id', session.user.id).single()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

  const admin = adminClient()
  const { data: letter } = await admin.from('engagement_letters')
    .select('tenant_id, person_id, status').eq('id', params.id).single()
  if (!letter) return NextResponse.json({ error: 'Engagement letter not found' }, { status: 404 })

  const isStaff = me.role === 'admin' || me.role === 'staff'
  const ownsLetter = me.person_id && me.person_id === letter.person_id
  const sameTenant = me.tenant_id === letter.tenant_id
  if (!sameTenant || !(isStaff || ownsLetter)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  // A client can only upload a signed copy once the letter's actually been
  // sent to them; staff can (re-)upload at any point as a correction path.
  if (!isStaff && letter.status !== 'sent') {
    return NextResponse.json({ error: 'This engagement letter is not awaiting a signature yet.' }, { status: 400 })
  }

  const filePath = `engagement-letters/${letter.tenant_id}/${letter.person_id}/signed_${Date.now()}_${file.name}`
  const { error: storageErr } = await admin.storage.from('Documents').upload(filePath, file)
  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 400 })

  const { data: updated, error: updateErr } = await admin.from('engagement_letters').update({
    signed_file_path: filePath, signed_file_name: file.name, signed_at: new Date().toISOString(), status: 'signed',
  }).eq('id', params.id).select().single()
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 })

  return NextResponse.json({ data: updated })
}
