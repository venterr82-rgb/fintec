'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Loader2, Send, Upload } from 'lucide-react'
import DocumentDownload from './DocumentDownload'

type FieldDef = { key: string; label: string; placeholder?: string }

const INDIVIDUAL_FIELDS: FieldDef[] = [
  { key: 'ClientLegalName', label: 'Name and Surname' },
  { key: 'RegistrationNumber', label: 'Identity Number' },
  { key: 'TaxReferenceNumber', label: 'Tax Reference Number' },
  { key: 'RegisteredAddress', label: 'Residential Address' },
  { key: 'ContactPerson', label: 'Contact' },
  { key: 'EmailAddress', label: 'Email Address' },
  { key: 'MobileNumber', label: 'Mobile / Tel' },
  { key: 'FeeCompliance', label: 'Statutory Compliance Fee (R/mo)', placeholder: '850.00' },
  { key: 'FeeTotal', label: 'TOTAL Monthly Fee (R)', placeholder: '850.00' },
]

const COMPANY_FIELDS: FieldDef[] = [
  { key: 'ClientLegalName', label: 'Full Legal Name / Entity' },
  { key: 'TradingName', label: 'Trading Name (if any)' },
  { key: 'RegistrationNumber', label: 'Registration Number' },
  { key: 'TaxReferenceNumber', label: 'Tax Reference Number' },
  { key: 'VATNumber', label: 'VAT Registration No.' },
  { key: 'PAYEReferenceNumber', label: 'PAYE Reference No.' },
  { key: 'RegisteredAddress', label: 'Registered Address' },
  { key: 'ContactPerson', label: 'Contact Person' },
  { key: 'EmailAddress', label: 'Email Address' },
  { key: 'MobileNumber', label: 'Mobile / Tel' },
  { key: 'FeeCompliance', label: 'Statutory Compliance (R/mo)', placeholder: '0.00' },
  { key: 'FeeAccounting', label: 'Accounting (R/mo)', placeholder: '0.00' },
  { key: 'FeePayroll', label: 'Payroll Administration (R/mo)', placeholder: '0.00' },
  { key: 'FeeTotal', label: 'TOTAL Monthly Fee (R)', placeholder: '0.00' },
  { key: 'TurnoverTier', label: 'Pricing Tier Applicable' },
  { key: 'OnboardingFee', label: 'Onboarding / Setup Fee (once-off, R)', placeholder: '0.00' },
]

export default function EngagementLetterGenerator({ letterType, personId, companyId, initialFields, existingLetter }: {
  letterType: 'individual' | 'company'
  personId?: string
  companyId?: string
  initialFields: Record<string, string>
  existingLetter?: any
}) {
  const router = useRouter()
  const fieldDefs = letterType === 'individual' ? INDIVIDUAL_FIELDS : COMPANY_FIELDS
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    fieldDefs.forEach(f => { init[f.key] = initialFields[f.key] ?? '' })
    return init
  })
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [letter, setLetter] = useState<any>(existingLetter ?? null)
  const [showForm, setShowForm] = useState(!existingLetter)
  const [uploading, setUploading] = useState(false)

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields(f => ({ ...f, [key]: e.target.value }))

  async function handleUploadSigned(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/engagement-letters/${letter.id}/upload-signed`, { method: 'POST', body: fd })
    const json = await res.json()
    setUploading(false)
    if (!res.ok) { setError(json.error ?? 'Failed to upload signed copy'); return }
    setLetter(json.data)
    router.refresh()
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const res = await fetch('/api/engagement-letters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letterType, personId, companyId, fields }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setError(json.error ?? 'Failed to generate letter'); return }
    setLetter(json.data)
    setShowForm(false)
    router.refresh()
  }

  async function handleSend() {
    setSending(true); setError('')
    const res = await fetch(`/api/engagement-letters/${letter.id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fields.EmailAddress }),
    })
    const json = await res.json()
    setSending(false)
    if (!res.ok) { setError(json.error ?? 'Failed to send letter'); return }
    setLetter(json.data)
    router.refresh()
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Engagement Letter</h3>
        {letter && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs text-navy-600 hover:underline">
            Generate new version
          </button>
        )}
      </div>

      {letter && !showForm && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-navy-600 shrink-0" />
            <p className="text-sm font-medium text-slate-800">{letter.file_name}</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={
              letter.status === 'signed' ? 'badge-green' : letter.status === 'sent' ? 'badge-blue' : 'badge-gray'
            }>{letter.status}</span>
            <span className="text-slate-400">Ref: {letter.reference_no}</span>
            {letter.sent_to_email && <span className="text-slate-400">· sent to {letter.sent_to_email}</span>}
          </div>
          {letter.signed_file_name && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-emerald-600">Signed copy received: {letter.signed_file_name}</p>
              <DocumentDownload filePath={letter.signed_file_path} fileName={letter.signed_file_name} />
            </div>
          )}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <DocumentDownload filePath={letter.file_path} fileName={letter.file_name} />
            {letter.status === 'draft' && (
              <button onClick={handleSend} disabled={sending} className="btn-primary text-xs">
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Send via Email
              </button>
            )}
            {letter.status === 'sent' && (
              <button onClick={handleSend} disabled={sending} className="btn-secondary text-xs">
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Resend
              </button>
            )}
            {letter.status !== 'draft' && (
              <label className="btn-secondary text-xs cursor-pointer">
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {letter.signed_file_name ? 'Replace signed copy' : 'Upload signed copy'}
                <input type="file" className="hidden" accept=".pdf,.jpg,.png,.doc,.docx" onChange={handleUploadSigned} />
              </label>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fieldDefs.map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input className="input py-1.5 text-sm" value={fields[f.key]} placeholder={f.placeholder}
                  onChange={set(f.key)} />
              </div>
            ))}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button type="submit" disabled={loading} className="btn-primary text-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Generate PDF
            </button>
            {letter && (
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
