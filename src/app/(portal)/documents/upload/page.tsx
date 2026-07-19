import { createServerSupabaseClient } from '@/lib/supabase/server'
import DocumentUploader from '@/components/documents/DocumentUploader'

export default async function UploadDocumentPage({ searchParams }: { searchParams: { company?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: companies } = await supabase.from('companies').select('id, name').order('name')
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Upload Document</h2>
      <DocumentUploader companies={companies ?? []} defaultCompanyId={searchParams.company} />
    </div>
  )
}
