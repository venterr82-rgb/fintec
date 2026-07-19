'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const PROVINCES = ['Western Cape','Eastern Cape','Northern Cape','Gauteng','KwaZulu-Natal','Free State','North West','Limpopo','Mpumalanga']
const ENTERPRISE_TYPES = ['Private Company','Close Corporation','Sole Proprietor','Partnership','Trust','Non-Profit','Public Company']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>
}

export default function CompanyForm({ company, redirectTo }: { company?: any; redirectTo?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: company?.name ?? '', trade_name: company?.trade_name ?? '',
    registration_number: company?.registration_number ?? '',
    tax_number: company?.tax_number ?? '', vat_number: company?.vat_number ?? '',
    paye_number: company?.paye_number ?? '', uif_number: company?.uif_number ?? '',
    sdl_number: company?.sdl_number ?? '', compensation_fund_number: company?.compensation_fund_number ?? '',
    enterprise_type: company?.enterprise_type ?? '', industry: company?.industry ?? '',
    status: company?.status ?? 'In Business', bbbee_level: company?.bbbee_level ?? '',
    public_interest_score: company?.public_interest_score ?? '', vat_category: company?.vat_category ?? '',
    financial_year_end: company?.financial_year_end ?? '',
    incorporation_date: company?.incorporation_date ?? '', business_start_date: company?.business_start_date ?? '',
    phone: company?.phone ?? '', email: company?.email ?? '', website: company?.website ?? '',
    auditor: company?.auditor ?? '', bank_details: company?.bank_details ?? '',
    registered_address_line1: company?.registered_address_line1 ?? '',
    registered_city: company?.registered_city ?? '', registered_province: company?.registered_province ?? '',
    registered_postal_code: company?.registered_postal_code ?? '',
    notes: company?.notes ?? '',
  })
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const payload = { ...form, public_interest_score: form.public_interest_score ? Number(form.public_interest_score) : null }
    const res = await fetch('/api/companies', {
      method: company?.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company?.id ? { ...payload, id: company.id } : payload),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Failed to save company'); setLoading(false); return }
    router.push(redirectTo ?? '/companies')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6">
        <h3 className="section-title mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Field label="Company Name *"><input className="input" required value={form.name} onChange={set('name')} /></Field></div>
          <Field label="Trade Name"><input className="input" value={form.trade_name} onChange={set('trade_name')} /></Field>
          <Field label="Registration Number"><input className="input font-mono" value={form.registration_number} onChange={set('registration_number')} placeholder="2023/123456/07" /></Field>
          <Field label="Enterprise Type">
            <select className="input" value={form.enterprise_type} onChange={set('enterprise_type')}>
              <option value="">Select…</option>{ENTERPRISE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Industry"><input className="input" value={form.industry} onChange={set('industry')} /></Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={set('status')}>
              <option>In Business</option><option>Dormant</option><option>Deregistered</option>
            </select>
          </Field>
          <Field label="Financial Year End">
            <select className="input" value={form.financial_year_end} onChange={set('financial_year_end')}>
              <option value="">Select month…</option>{MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Incorporation Date"><input type="date" className="input" value={form.incorporation_date} onChange={set('incorporation_date')} /></Field>
          <Field label="Business Start Date"><input type="date" className="input" value={form.business_start_date} onChange={set('business_start_date')} /></Field>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-4">Tax & Statutory Numbers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[['Income Tax Number','tax_number','9948213187'],['VAT Number','vat_number',''],['PAYE Number','paye_number',''],
            ['UIF Number','uif_number',''],['SDL Number','sdl_number',''],['Compensation Fund No.','compensation_fund_number',''],
            ['B-BBEE Level','bbbee_level','Level 4'],['Public Interest Score','public_interest_score',''],['VAT Category','vat_category','']
          ].map(([lbl,key,ph]) => (
            <Field key={key} label={lbl}><input className="input font-mono" value={(form as any)[key]} onChange={set(key)} placeholder={ph} /></Field>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-4">Contact Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Phone"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><input type="email" className="input" value={form.email} onChange={set('email')} /></Field>
          <Field label="Website"><input className="input" value={form.website} onChange={set('website')} /></Field>
          <Field label="Auditor"><input className="input" value={form.auditor} onChange={set('auditor')} /></Field>
          <Field label="Bank Details"><input className="input" value={form.bank_details} onChange={set('bank_details')} /></Field>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-4">Registered Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Field label="Address Line 1"><input className="input" value={form.registered_address_line1} onChange={set('registered_address_line1')} /></Field></div>
          <Field label="City"><input className="input" value={form.registered_city} onChange={set('registered_city')} /></Field>
          <Field label="Province">
            <select className="input" value={form.registered_province} onChange={set('registered_province')}>
              <option value="">Select…</option>{PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Postal Code"><input className="input" value={form.registered_postal_code} onChange={set('registered_postal_code')} /></Field>
        </div>
      </div>

      <div className="card p-6">
        <Field label="Notes"><textarea className="input min-h-24" value={form.notes} onChange={set('notes')} placeholder="Internal notes…" /></Field>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      <div className="flex gap-3 justify-end pb-6">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : company?.id ? 'Save Changes' : 'Add Company'}
        </button>
      </div>
    </form>
  )
}
