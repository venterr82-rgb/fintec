import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

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

  const { data: docRow } = await supabase.from('tax_documents').select('tenant_id, person_id, tax_year').eq('id', docId).single()
  const filePath = `tax/${docRow?.tenant_id}/${docRow?.person_id}/${docRow?.tax_year}/${Date.now()}_${file.name}`

  const { error: storageErr } = await supabase.storage.from('documents').upload(filePath, file)
  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 400 })

  await supabase.from('tax_documents').update({
    file_path: filePath, file_name: file.name, file_size: file.size,
    status: 'uploaded', uploaded_by: session.user.id, uploaded_at: new Date().toISOString(),
  }).eq('id', docId)

  return NextResponse.json({ ok: true })
}
