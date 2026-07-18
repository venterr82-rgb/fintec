import { createServerSupabaseClient } from '@/lib/supabase/server'
import DocumentUploader from '@/components/documents/DocumentUploader'

export default async function ClientUploadPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase.from('users').select('person_id').eq('id', user!.id).single()
  const { data: memberships } = await supabase.from('company_people').select('company_id, companies(id, name)').eq('person_id', userData?.person_id)
  const companies = memberships?.map((m: any) => m.companies) ?? []
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Document</h2>
      <p className="text-sm text-slate-500 mb-6">Upload documents requested by your accountant</p>
      <DocumentUploader companies={companies} />
    </div>
  )
}
