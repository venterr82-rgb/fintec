import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { siteConfig } from '@/lib/config/site'

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

  const { data: me } = await supabase.from('users').select('tenant_id, role').eq('id', session.user.id).single()
  if (!me || !['admin', 'staff'].includes(me.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { email } = await request.json().catch(() => ({ email: undefined }))

  const admin = adminClient()
  const { data: letter } = await admin.from('engagement_letters')
    .select('*').eq('id', params.id).eq('tenant_id', me.tenant_id).single()
  if (!letter) return NextResponse.json({ error: 'Engagement letter not found' }, { status: 404 })
  if (!letter.file_path) return NextResponse.json({ error: 'No PDF generated for this letter yet' }, { status: 400 })

  const targetEmail = email || letter.fields?.EmailAddress
  if (!targetEmail) return NextResponse.json({ error: 'No recipient email address' }, { status: 400 })

  const { data: fileData, error: downloadErr } = await admin.storage.from('Documents').download(letter.file_path)
  if (downloadErr || !fileData) return NextResponse.json({ error: 'Could not retrieve the PDF' }, { status: 500 })
  const pdfBuffer = Buffer.from(await fileData.arrayBuffer())

  const resend = new Resend(process.env.RESEND_API_KEY)
  const clientName = letter.fields?.ClientLegalName ?? 'Client'
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: targetEmail,
      subject: `${siteConfig.companyName} — Your Engagement Letter (${letter.reference_no})`,
      html: `
        <p>Dear ${clientName},</p>
        <p>Please find attached your engagement letter with ${siteConfig.companyName}. Kindly review, sign, and
        upload the signed copy back through your client portal.</p>
        <p>If you have any questions, don't hesitate to reach out.</p>
        <p>Kind regards,<br/>${siteConfig.companyName}</p>
      `,
      attachments: [{ filename: letter.file_name ?? 'Engagement Letter.pdf', content: pdfBuffer }],
    })
  } catch (err: any) {
    console.error('Failed to send engagement letter email:', err)
    return NextResponse.json({ error: 'Could not send the email.' }, { status: 500 })
  }

  const { data: updated, error: updateErr } = await admin.from('engagement_letters').update({
    status: 'sent', sent_at: new Date().toISOString(), sent_to_email: targetEmail,
  }).eq('id', params.id).select().single()
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 })

  return NextResponse.json({ data: updated })
}
