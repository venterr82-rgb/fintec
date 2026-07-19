'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, File, Loader2, X } from 'lucide-react'

const FOLDERS = ['Statutory Docs','Tax','Financials','Client Uploads']
const DOC_TYPES = ['Registration Certificate','Tax Clearance','VAT Certificate','Financial Statements','Tax Return','CIPC Return','Letter','Other']

export default function DocumentUploader({ companies, defaultCompanyId }: { companies: any[]; defaultCompanyId?: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    company_id: defaultCompanyId ?? '', name: '', document_type: '', folder: 'Statutory Docs',
    visibility: 'internal', issue_date: '', tax_year: '', description: '',
  })
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) { setFile(f); if (!form.name) setForm(prev => ({ ...prev, name: f.name.replace(/\.[^/.]+$/, '') })) }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !form.company_id) { setError('Please select a file and company.'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', session!.user.id).single()
    const tenantId = userData?.tenant_id
    const ext = file.name.split('.').pop()
    const filePath = `${tenantId}/${form.company_id}/${form.folder}/${Date.now()}_${file.name}`

    const { error: storageErr } = await supabase.storage.from('Documents').upload(filePath, file)
    if (storageErr) { setError(storageErr.message); setLoading(false); return }

    await supabase.from('documents').insert({
      tenant_id: tenantId, company_id: form.company_id, name: form.name,
      document_type: form.document_type, folder: form.folder, description: form.description,
      file_path: filePath, file_name: file.name, file_size: file.size, file_type: ext,
      uploaded_by: session!.user.id, visibility: form.visibility,
      issue_date: form.issue_date || null, tax_year: form.tax_year || null,
    })
    router.push(defaultCompanyId ? `/companies/${form.company_id}/documents` : '/documents')
    router.refresh()
  }

  return (
    <form onSubmit={handleUpload} className="card p-6 space-y-4">
      {/* File drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-colors"
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <File className="w-8 h-8 text-navy-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size/1024).toFixed(1)} KB</p>
            </div>
            <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }} className="ml-2 text-slate-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Click to choose a file</p>
            <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel up to 50MB</p>
          </div>
        )}
        <input ref={fileRef} type="file" className="hidden" onChange={handleFilePick} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg" />
      </div>

      <div><label className="label">Company *</label>
        <select className="input" required value={form.company_id} onChange={set('company_id')}>
          <option value="">Select company…</option>
          {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Document Name *</label><input className="input" required value={form.name} onChange={set('name')} /></div>
        <div><label className="label">Document Type</label>
          <select className="input" value={form.document_type} onChange={set('document_type')}>
            <option value="">Select…</option>{DOC_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div><label className="label">Folder</label>
          <select className="input" value={form.folder} onChange={set('folder')}>
            {FOLDERS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div><label className="label">Visibility</label>
          <select className="input" value={form.visibility} onChange={set('visibility')}>
            <option value="internal">Internal only</option>
            <option value="client">Client can see</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div><label className="label">Issue Date</label><input type="date" className="input" value={form.issue_date} onChange={set('issue_date')} /></div>
        <div><label className="label">Tax Year</label><input className="input" placeholder="2025" value={form.tax_year} onChange={set('tax_year')} /></div>
      </div>
      <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={set('description')} /></div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading || !file} className="btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Upload className="w-4 h-4" />Upload</>}
        </button>
      </div>
    </form>
  )
}
