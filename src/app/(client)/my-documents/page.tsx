import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import { format } from 'date-fns'
import DocumentDownload from '@/components/documents/DocumentDownload'

export default async function MyDocumentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase.from('users').select('person_id').eq('id', user!.id).single()
  const { data: memberships } = await supabase.from('company_people').select('company_id').eq('person_id', userData?.person_id)
  const companyIds = memberships?.map((m: any) => m.company_id) ?? []

  const { data: docs } = await supabase.from('documents')
    .select('*, companies(name)')
    .in('company_id', companyIds)
    .in('visibility', ['client','both'])
    .order('created_at', { ascending: false })

  const FOLDERS = ['Statutory Docs','Tax','Financials','Client Uploads']

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">My Documents</h2>
      {FOLDERS.map(folder => {
        const folderDocs = docs?.filter((d: any) => d.folder === folder)
        if (!folderDocs?.length) return null
        return (
          <div key={folder} className="card">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700">{folder}</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {folderDocs.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-300 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{d.name}</p>
                      <p className="text-xs text-slate-400">{format(new Date(d.created_at), 'd MMM yyyy')}</p>
                    </div>
                  </div>
                  <DocumentDownload filePath={d.file_path} fileName={d.file_name ?? d.name} />
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {(!docs || docs.length === 0) && (
        <div className="text-center py-16 card">
          <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No documents available yet.</p>
        </div>
      )}
    </div>
  )
}
