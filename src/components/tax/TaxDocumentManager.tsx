'use client'
import { useState, useRef } from 'react'
import { CheckCircle, Clock, Upload, X, Loader2, FileText, MinusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STATUS_ICON: Record<string, React.ReactNode> = {
  outstanding: <Clock className="w-4 h-4 text-amber-500" />,
  uploaded:    <CheckCircle className="w-4 h-4 text-emerald-500" />,
  approved:    <CheckCircle className="w-4 h-4 text-emerald-600" />,
  not_applicable: <MinusCircle className="w-4 h-4 text-slate-300" />,
}

export default function TaxDocumentManager({ taxCaseId, documents }: { taxCaseId: string; documents: any[] }) {
  const router = useRouter()
  const [uploading, setUploading] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [activeDoc, setActiveDoc] = useState<string | null>(null)

  async function handleUpload(docId: string, file: File) {
    setUploading(docId)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('docId', docId)
    fd.append('taxCaseId', taxCaseId)
    await fetch('/api/tax-docs/upload', { method: 'POST', body: fd })
    setUploading(null)
    router.refresh()
  }

  async function markNA(docId: string) {
    await fetch('/api/tax-docs/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId, status: 'not_applicable' }),
    })
    router.refresh()
  }

  async function markApproved(docId: string) {
    await fetch('/api/tax-docs/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId, status: 'approved' }),
    })
    router.refresh()
  }

  const outstanding = documents.filter(d => d.status === 'outstanding')
  const received = documents.filter(d => d.status === 'uploaded' || d.status === 'approved')
  const na = documents.filter(d => d.status === 'not_applicable')

  return (
    <div>
      {documents.length === 0 && (
        <div className="px-5 py-8 text-center text-slate-400 text-sm">
          No documents generated yet. Create/edit the tax case to generate the checklist.
        </div>
      )}

      {outstanding.length > 0 && (
        <div>
          <p className="px-5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border-b border-amber-100">
            OUTSTANDING — {outstanding.length} document{outstanding.length !== 1 ? 's' : ''}
          </p>
          {outstanding.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
              <div className="flex items-center gap-3">
                {STATUS_ICON[doc.status]}
                <div>
                  <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                    {doc.label}
                    {doc.uploaded_by_role === 'accountant' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-navy-100 text-navy-700">Accountant</span>
                    )}
                  </p>
                  {doc.description && <p className="text-xs text-slate-400">{doc.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="btn-secondary text-xs cursor-pointer">
                  {uploading === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Upload
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.id, f) }} />
                </label>
                <button onClick={() => markNA(doc.id)} className="text-xs text-slate-400 hover:text-slate-600">N/A</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {received.length > 0 && (
        <div>
          <p className="px-5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border-b border-emerald-100 border-t border-slate-100">
            RECEIVED — {received.length}
          </p>
          {received.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
              <div className="flex items-center gap-3">
                {STATUS_ICON[doc.status]}
                <div>
                  <p className="text-sm font-medium text-slate-700">{doc.label}</p>
                  {doc.file_name && <p className="text-xs text-slate-400">{doc.file_name}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.status === 'uploaded' && (
                  <button onClick={() => markApproved(doc.id)} className="text-xs text-emerald-600 hover:underline">Approve</button>
                )}
                {doc.status === 'approved' && <span className="text-xs text-emerald-600 font-medium">✓ Approved</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {na.length > 0 && (
        <div>
          <p className="px-5 py-2 text-xs font-semibold text-slate-400 bg-slate-50 border-b border-slate-100 border-t border-slate-100">
            NOT APPLICABLE
          </p>
          {na.map((doc: any) => (
            <div key={doc.id} className="flex items-center px-5 py-3 border-b border-slate-50">
              {STATUS_ICON[doc.status]}
              <p className="text-sm text-slate-400 ml-3">{doc.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
