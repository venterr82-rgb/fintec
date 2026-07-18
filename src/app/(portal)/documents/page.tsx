import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Download, Plus } from 'lucide-react'
import { format } from 'date-fns'
import DocumentDownload from '@/components/documents/DocumentDownload'

function FileIcon({ type }: { type?: string }) {
  return <FileText className="w-4 h-4 text-slate-400 shrink-0" />
}

export default async function DocumentsPage({ searchParams }: { searchParams: { company?: string; folder?: string } }) {
  const supabase = await createServerSupabaseClient()
  let q = supabase.from('documents').select('*, companies(name)').order('created_at', { ascending: false })
  if (searchParams.company) q = q.eq('company_id', searchParams.company)
  if (searchParams.folder) q = q.eq('folder', searchParams.folder)

  const { data: docs } = await q
  const { data: companies } = await supabase.from('companies').select('id, name').order('name')

  const FOLDERS = ['Statutory Docs','Tax','Financials','Client Uploads']

  return (
    <div className="max-w-7xl space-y-4">
      <div className="page-header">
        <h2 className="text-2xl font-bold text-slate-800">Documents</h2>
        <Link href="/documents/upload" className="btn-primary"><Plus className="w-4 h-4" />Upload Document</Link>
      </div>
      <div className="card">
        <form className="flex flex-wrap gap-3 p-4 border-b border-slate-100">
          <select name="company" defaultValue={searchParams.company} className="input w-52">
            <option value="">All companies</option>
            {companies?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="folder" defaultValue={searchParams.folder} className="input w-44">
            <option value="">All folders</option>
            {FOLDERS.map(f => <option key={f}>{f}</option>)}
          </select>
          <button type="submit" className="btn-primary">Filter</button>
        </form>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="th">Document</th><th className="th">Company</th><th className="th">Folder</th>
              <th className="th">Visibility</th><th className="th">Uploaded</th><th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {docs?.length === 0 && (
              <tr><td colSpan={6} className="td text-center py-12 text-slate-400">No documents found.</td></tr>
            )}
            {docs?.map((d: any) => (
              <tr key={d.id} className="table-row">
                <td className="td">
                  <div className="flex items-center gap-2">
                    <FileIcon type={d.file_type} />
                    <div>
                      <p className="font-medium text-slate-800">{d.name}</p>
                      {d.file_size && <p className="text-xs text-slate-400">{(d.file_size/1024).toFixed(1)} KB</p>}
                    </div>
                  </div>
                </td>
                <td className="td text-sm">{d.companies?.name ?? '—'}</td>
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
