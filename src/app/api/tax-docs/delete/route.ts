import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Lets a client remove their own uploaded-but-not-yet-approved document
// (wrong file selected) and re-opens the checklist slot for a re-upload.
// Staff can remove any upload, including an already-approved one, as a
// correction path.
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

  const { docId } = await request.json()
  if (!docId) return NextResponse.json({ error: 'Missing docId' }, { status: 400 })

  const { data: me } = await supabase.from('users').select('tenant_id, role, person_id').eq('id', session.user.id).single()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = adminClient()

  const { data: docRow } = await admin.from('tax_documents')
    .select('tenant_id, person_id, status, file_path')
    .eq('id', docId).single()
  if (!docRow) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  const isStaff = me.role === 'admin' || me.role === 'staff'
  const ownsDoc = me.person_id && me.person_id === docRow.person_id
  const sameTenant = me.tenant_id === docRow.tenant_id
  if (!sameTenant || !(isStaff || ownsDoc)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (docRow.status === 'outstanding') {
    return NextResponse.json({ error: 'Nothing to remove.' }, { status: 400 })
  }
  // A client can only pull back their own upload before staff has approved
  // it — once approved, only staff can undo that (a deliberate review step).
  if (!isStaff && docRow.status === 'approved') {
    return NextResponse.json({ error: 'This document has already been approved — contact your accountant to change it.' }, { status: 403 })
  }

  if (docRow.file_path) {
    const { error: storageErr } = await admin.storage.from('Documents').remove([docRow.file_path])
    if (storageErr) console.error('Failed to remove storage object on doc delete:', storageErr)
  }

  const { error: updateErr } = await admin.from('tax_documents').update({
    status: 'outstanding',
    file_path: null, file_name: null, file_size: null,
    uploaded_by: null, uploaded_at: null,
    reviewed_by: null, reviewed_at: null,
  }).eq('id', docId)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
