import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { generateEngagementLetterPdf } from '@/lib/documents/generateEngagementLetterPdf'
import { generateReferenceNo, formatLetterDate } from '@/lib/documents/engagementLetterHelpers'

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

  const { data: me } = await supabase.from('users').select('tenant_id, role').eq('id', session.user.id).single()
  if (!me || !['admin', 'staff'].includes(me.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { letterType, personId, companyId, fields } = body as {
    letterType: 'individual' | 'company'
    personId?: string
    companyId?: string
    fields: Record<string, string>
  }

  if (letterType !== 'individual' && letterType !== 'company') {
    return NextResponse.json({ error: 'Invalid letterType' }, { status: 400 })
  }
  if (letterType === 'individual' && !personId) {
    return NextResponse.json({ error: 'personId is required for an individual letter' }, { status: 400 })
  }
  if (letterType === 'company' && !companyId) {
    return NextResponse.json({ error: 'companyId is required for a company letter' }, { status: 400 })
  }

  const admin = adminClient()
  const engagementDate = formatLetterDate()
  const referenceNo = generateReferenceNo(letterType === 'individual' ? 'IND' : 'CO')
  const fullFields: Record<string, string> = { ...fields, EngagementDate: engagementDate, ReferenceNo: referenceNo }

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateEngagementLetterPdf(letterType, fullFields as any)
  } catch (err: any) {
    console.error('Engagement letter PDF generation failed:', err)
    return NextResponse.json({ error: 'Could not generate the PDF.' }, { status: 500 })
  }

  const ownerId = personId ?? companyId
  const fileName = `Engagement Letter - ${fullFields.ClientLegalName ?? 'Client'} - ${referenceNo}.pdf`
  const filePath = `engagement-letters/${me.tenant_id}/${ownerId}/${Date.now()}_${referenceNo}.pdf`

  const { error: storageErr } = await admin.storage.from('Documents').upload(filePath, pdfBuffer, {
    contentType: 'application/pdf',
  })
  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 400 })

  const { data: letterRow, error: insertErr } = await admin.from('engagement_letters').insert({
    tenant_id: me.tenant_id,
    letter_type: letterType,
    person_id: personId ?? null,
    company_id: companyId ?? null,
    reference_no: referenceNo,
    engagement_date: new Date().toISOString().split('T')[0],
    fields: fullFields,
    status: 'draft',
    file_path: filePath,
    file_name: fileName,
    created_by: session.user.id,
  }).select().single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 400 })

  return NextResponse.json({ data: letterRow })
}
