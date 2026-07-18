import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

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

  const formData = await request.formData()
  const file = formData.get('file') as File
  const docId = formData.get('docId') as string

  if (!file || !docId) return NextResponse.json({ error: 'Missing file or docId' }, { status: 400 })

  // Own tenant/person/role, via the session-scoped (RLS-enforced) client —
  // this can only ever return the caller's own row.
  const { data: me } = await supabase.from('users').select('tenant_id, role, person_id').eq('id', session.user.id).single()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = adminClient()

  // The target document, fetched via service role since storage/tax_documents
  // writes below also go through service role (see comment further down).
  const { data: docRow } = await admin.from('tax_documents').select('tenant_id, person_id, tax_year').eq('id', docId).single()
  if (!docRow) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  // Manual authorization check — replaces what RLS would enforce, since the
  // actual write below deliberately bypasses RLS (see below).
  const isStaff = me.role === 'admin' || me.role === 'staff'
  const ownsDoc = me.person_id && me.person_id === docRow.person_id
  const sameTenant = me.tenant_id === docRow.tenant_id
  if (!sameTenant || !(isStaff || ownsDoc)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const filePath = `tax/${docRow.tenant_id}/${docRow.person_id}/${docRow.tax_year}/${Date.now()}_${file.name}`

  // Storage's own RLS on storage.objects isn't set up for this app's
  // tax/{tenant}/{person}/{year}/... path convention, so this deliberately
  // uses the service-role client — authorization is enforced explicitly
  // above instead.
  const { error: storageErr } = await admin.storage.from('Documents').upload(filePath, file)
  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 400 })

  const { error: updateErr } = await admin.from('tax_documents').update({
    file_path: filePath, file_name: file.name, file_size: file.size,
    status: 'uploaded', uploaded_by: session.user.id, uploaded_at: new Date().toISOString(),
  }).eq('id', docId)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
