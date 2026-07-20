// src/app/api/documents/signed-url/route.ts
// Generates a signed download URL server-side via the service-role client.
// Storage's own RLS on storage.objects isn't set up for this app's path
// conventions (tax/{tenant}/{person}/{year}/... and {tenant}/{company}/...),
// so createSignedUrl always failed when called from the browser client —
// this replaces that call with an explicitly-authorized server-side one.

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

  const { filePath } = await request.json()
  if (!filePath) return NextResponse.json({ error: 'Missing filePath' }, { status: 400 })

  const { data: me } = await supabase.from('users').select('tenant_id, role, person_id').eq('id', session.user.id).single()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isStaff = me.role === 'admin' || me.role === 'staff'
  const admin = adminClient()

  // Try the general company/tenant `documents` table first.
  const { data: doc } = await admin.from('documents')
    .select('tenant_id, company_id, visibility')
    .eq('file_path', filePath)
    .maybeSingle()

  if (doc) {
    if (doc.tenant_id !== me.tenant_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    let authorized = isStaff
    if (!authorized && ['client', 'both'].includes(doc.visibility) && me.person_id) {
      const { data: link } = await admin.from('company_people')
        .select('id').eq('company_id', doc.company_id).eq('person_id', me.person_id).maybeSingle()
      authorized = !!link
    }
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  } else {
    // Fall back to the per-tax-case `tax_documents` table.
    const { data: taxDoc } = await admin.from('tax_documents')
      .select('tenant_id, person_id')
      .eq('file_path', filePath)
      .maybeSingle()

    if (taxDoc) {
      if (taxDoc.tenant_id !== me.tenant_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (!isStaff && taxDoc.person_id !== me.person_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else {
      // Fall back to engagement_letters — matches either the generated
      // letter itself or the client's uploaded signed copy. Two separate
      // queries rather than .or() since filePath (containing slashes and
      // arbitrary filename characters) isn't safe to interpolate into a
      // PostgREST .or() filter string.
      const [{ data: letterByFile }, { data: letterBySigned }] = await Promise.all([
        admin.from('engagement_letters').select('tenant_id, person_id').eq('file_path', filePath).maybeSingle(),
        admin.from('engagement_letters').select('tenant_id, person_id').eq('signed_file_path', filePath).maybeSingle(),
      ])
      const letter = letterByFile ?? letterBySigned

      if (!letter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (letter.tenant_id !== me.tenant_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (!isStaff && letter.person_id !== me.person_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }
  }

  const { data, error } = await admin.storage.from('Documents').createSignedUrl(filePath, 3600)
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not create signed URL' }, { status: 400 })

  return NextResponse.json({ signedUrl: data.signedUrl })
}
