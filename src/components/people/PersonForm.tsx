'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const PROVINCES = ['Western Cape','Eastern Cape','Northern Cape','Gauteng','KwaZulu-Natal','Free State','North West','Limpopo','Mpumalanga']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>
}

export default function PersonForm({ person, companies, defaultCompanyId }: { person?: any; companies: any[]; defaultCompanyId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    first_name: person?.first_name ?? '', second_name: person?.second_name ?? '',
    last_name: person?.last_name ?? '', id_number: person?.id_number ?? '',
    passport_number: person?.passport_number ?? '', tax_number: person?.tax_number ?? '',
    date_of_birth: person?.date_of_birth ?? '', race_gender: person?.race_gender ?? '',
    nationality: person?.nationality ?? 'South African', country_of_origin: person?.country_of_origin ?? 'South Africa',
    email: person?.email ?? '', phone: person?.phone ?? '',
    residential_address_line1: person?.residential_address_line1 ?? '',
    residential_city: person?.residential_city ?? '', residential_province: person?.residential_province ?? '',
    residential_postal_code: person?.residential_postal_code ?? '', residential_country: person?.residential_country ?? 'South Africa',
    has_portal_access: person?.has_portal_access ?? false,
  })
  const [role, setRole] = useState({ company_id: defaultCompanyId ?? '', role: 'director', appointment_date: '', director_status: 'Active', shareholding_percentage: '', equity_percentage: '', date_became_shareholder: '' })
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setR = (k: string) => (e: React.ChangeEvent<any>) => setRole(r => ({ ...r, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', session!.user.id).single()
    const tenantId = userData?.tenant_id

    const { data: personData, error: personErr } = person?.id
      ? await supabase.from('people').update({ ...form, tenant_id: tenantId }).eq('id', person.id).select().single()
      : await supabase.from('people').insert({ ...form, tenant_id: tenantId }).select().single()

    if (personErr) { setError(personErr.message); setLoading(false); return }

    if (role.company_id && personData) {
      await supabase.from('company_people').insert({
        tenant_id: tenantId, company_id: role.company_id, person_id: personData.id,
        role: role.role, appointment_date: role.appointment_date || null,
        director_status: role.director_status,
        shareholding_percentage: role.shareholding_percentage ? Number(role.shareholding_percentage) : null,
        equity_percentage: role.equity_percentage ? Number(role.equity_percentage) : null,
        date_became_shareholder: role.date_became_shareholder || null,
      })
    }
    router.push('/people'); router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6">
        <h3 className="section-title mb-4">Personal Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="First Name *"><input className="input" required value={form.first_name} onChange={set('first_name')} /></Field>
          <Field label="Second Name"><input className="input" value={form.second_name} onChange={set('second_name')} /></Field>
          <Field label="Last Name *"><input className="input" required value={form.last_name} onChange={set('last_name')} /></Field>
          <Field label="ID Number"><input className="input font-mono" value={form.id_number} onChange={set('id_number')} placeholder="13 digits" /></Field>
          <Field label="Passport Number"><input className="input font-mono" value={form.passport_number} onChange={set('passport_number')} /></Field>
          <Field label="Tax Number"><input className="input font-mono" value={form.tax_number} onChange={set('tax_number')} /></Field>
          <Field label="Date of Birth"><input type="date" className="input" value={form.date_of_birth} onChange={set('date_of_birth')} /></Field>
          <Field label="Race & Gender"><input className="input" value={form.race_gender} onChange={set('race_gender')} placeholder="White Male" /></Field>
          <Field label="Country of Origin"><input className="input" value={form.country_of_origin} onChange={set('country_of_origin')} /></Field>
          <Field label="Email"><input type="email" className="input" value={form.email} onChange={set('email')} /></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-4">Residential Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Field label="Address"><input className="input" value={form.residential_address_line1} onChange={set('residential_address_line1')} /></Field></div>
          <Field label="City"><input className="input" value={form.residential_city} onChange={set('residential_city')} /></Field>
          <Field label="Province">
            <select className="input" value={form.residential_province} onChange={set('residential_province')}>
              <option value="">Select…</option>{PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Postal Code"><input className="input" value={form.residential_postal_code} onChange={set('residential_postal_code')} /></Field>
          <Field label="Country"><input className="input" value={form.residential_country} onChange={set('residential_country')} /></Field>
        </div>
      </div>

      {!person?.id && companies.length > 0 && (
        <div className="card p-6">
          <h3 className="section-title mb-1">Link to Company</h3>
          <p className="text-xs text-slate-500 mb-4">Optionally link this person to a company as director/shareholder</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Company">
              <select className="input" value={role.company_id} onChange={setR('company_id')}>
                <option value="">None</option>{companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Role">
              <select className="input" value={role.role} onChange={setR('role')}>
                <option value="director">Director</option><option value="shareholder">Shareholder</option><option value="both">Both</option>
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={role.director_status} onChange={setR('director_status')}>
                <option value="Active">Active</option><option value="Resigned">Resigned</option>
              </select>
            </Field>
            <Field label="Appointment Date"><input type="date" className="input" value={role.appointment_date} onChange={setR('appointment_date')} /></Field>
            <Field label="Shareholding %"><input type="number" className="input" value={role.shareholding_percentage} onChange={setR('shareholding_percentage')} /></Field>
            <Field label="Equity %"><input type="number" className="input" value={role.equity_percentage} onChange={setR('equity_percentage')} /></Field>
          </div>
        </div>
      )}

      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">Portal Access</p>
          <p className="text-xs text-slate-400">Enable director to log in and view documents</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={form.has_portal_access}
            onChange={e => setForm(f => ({ ...f, has_portal_access: e.target.checked }))} />
          <div className="w-10 h-6 bg-slate-200 peer-checked:bg-navy-600 rounded-full peer-checked:after:translate-x-4 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
        </label>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      <div className="flex gap-3 justify-end pb-6">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : person?.id ? 'Save Changes' : 'Add Person'}
        </button>
      </div>
    </form>
  )
}
