'use client'

import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { FolderOpen, Download, FileText, File } from 'lucide-react'

function FileIcon({ type }: { type?: string }) {
  if (type?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
  return <File className="w-5 h-5 text-slate-400" />
}

const FOLDERS = ['Statutory Docs', 'Tax', 'Financials', 'Client Uploads']

export default function ClientDocumentsView({ documents }: { documents: any[] }) {
  const supabase = createClient()

  async function download(doc: any) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const byFolder = FOLDERS.reduce((acc, folder) => {
    acc[folder] = documents.filter(d => d.folder === folder)
    return acc
  }, {} as Record<string, any[]>)

  const uncategorised = documents.filter(d => !FOLDERS.includes(d.folder))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-slate-500 text-sm mt-0.5">{documents.length} documents available to download</p>
      </div>

      {!documents.length && (
        <div className="card p-16 text-center text-slate-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm mt-1">Your accountant will share documents here when available.</p>
        </div>
      )}

      {FOLDERS.map(folder => {
        const docs = byFolder[folder]
        if (!docs?.length) return null
        return (
          <div key={folder} className="card overflow-hidden mb-4">
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900 text-sm">{folder}</h2>
              <span className="badge-slate ml-1">{docs.length}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {docs.map((doc: any) => (
                <div key={doc.id} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <FileIcon type={doc.file_type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400">
                      {doc.document_type} · {format(new Date(doc.created_at), 'dd MMM yyyy')}
                      {doc.tax_year && ` · ${doc.tax_year}`}
                    </p>
                  </div>
                  <button onClick={() => download(doc)}
                    className="btn-secondary py-1 px-3 text-xs shrink-0">
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
