import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Plus } from 'lucide-react'
import { format } from 'date-fns'
import DocumentDownload from '@/components/documents/DocumentDownload'

export default async function CompanyDocumentsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: company } = await supabase.from('companies').select('id, name').eq('id', params.id).single()
  if (!company) notFound()

  const { data: docs } = await supabase.from('documents')
    .select('*')
    .eq('company_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <Link href={`/companies/${params.id}`} className="text-sm text-slate-500 hover:text-navy-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3 h-3" /> {company.name}
        </Link>
        <div className="page-header">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Documents</h2>
            <p className="text-sm text-slate-500">{docs?.length ?? 0} documents · {company.name}</p>
          </div>
          <Link href={`/documents/upload?company=${params.id}`} className="btn-primary"><Plus className="w-4 h-4" />Upload Document</Link>
        </div>
      </div>

      <div className="card">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="th">Document</th><th className="th">Folder</th>
              <th className="th">Visibility</th><th className="th">Uploaded</th><th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {docs?.length === 0 && (
              <tr><td colSpan={5} className="td text-center py-12 text-slate-400">No documents for this company yet.</td></tr>
            )}
            {docs?.map((d: any) => (
              <tr key={d.id} className="table-row">
                <td className="td">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800">{d.name}</p>
                      {d.file_size && <p className="text-xs text-slate-400">{(d.file_size / 1024).toFixed(1)} KB</p>}
                    </div>
                  </div>
                </td>
                <td className="td"><span className="badge-gray text-xs">{d.folder ?? '—'}</span></td>
                <td className="td">
                  <span className={d.visibility === 'client' || d.visibility === 'both' ? 'badge-blue' : 'badge-gray'}>{d.visibility}</span>
                </td>
                <td className="td text-xs text-slate-500">{format(new Date(d.created_at), 'd MMM yyyy')}</td>
                <td className="td"><DocumentDownload filePath={d.file_path} fileName={d.file_name ?? d.name} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
