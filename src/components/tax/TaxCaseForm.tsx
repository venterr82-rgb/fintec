'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, X } from 'lucide-react'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={`w-9 h-5 rounded-full transition-colors ${checked ? 'bg-navy-600' : 'bg-slate-200'}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </label>
  )
}

function NameListEditor({ label, itemLabel, names, onChange }: {
  label: string
  itemLabel: string
  names: string[]
  onChange: (names: string[]) => void
}) {
  function updateName(i: number, value: string) {
    onChange(names.map((n, idx) => idx === i ? value : n))
  }
  function addName() {
    onChange([...names, ''])
  }
  function removeName(i: number) {
    onChange(names.filter((_, idx) => idx !== i))
  }

  return (
    <div className="md:col-span-2 pl-4 border-l-2 border-navy-100 space-y-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {names.map((name, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="input py-1.5 text-sm"
            value={name}
            onChange={e => updateName(i, e.target.value)}
            placeholder={`${itemLabel} ${i + 1}`}
          />
          <button type="button" onClick={() => removeName(i)} className="text-slate-400 hover:text-red-500 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addName} className="btn-secondary text-xs">
        <Plus className="w-3 h-3" /> Add {itemLabel.toLowerCase()}
      </button>
    </div>
  )
}

const CURRENT_YEAR = new Date().getMonth() >= 2 ? new Date().getFullYear() + 1 : new Date().getFullYear()

export default function TaxCaseForm({ people, taxCase }: { people: any[]; taxCase?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    person_id: taxCase?.person_id ?? '',
    tax_year: taxCase?.tax_year ?? CURRENT_YEAR,
    period_label: taxCase?.period_label ?? `Mar ${CURRENT_YEAR - 1} to Feb ${CURRENT_YEAR}`,
    has_employment: taxCase?.has_employment ?? false,
    has_rental: taxCase?.has_rental ?? false,
    has_sole_prop: taxCase?.has_sole_prop ?? false,
    has_partnership: taxCase?.has_partnership ?? false,
    has_airbnb: taxCase?.has_airbnb ?? false,
    has_investments: taxCase?.has_investments ?? false,
    has_medical: taxCase?.has_medical ?? false,
    has_ra: taxCase?.has_ra ?? false,
    has_pension: taxCase?.has_pension ?? false,
    status: taxCase?.status ?? 'awaiting_docs',
    accountant_note: taxCase?.accountant_note ?? '',
    rental_properties: (taxCase?.rental_properties as string[] | undefined) ?? [],
    sole_prop_businesses: (taxCase?.sole_prop_businesses as string[] | undefined) ?? [],
    airbnb_properties: (taxCase?.airbnb_properties as string[] | undefined) ?? [],
    partnership_names: (taxCase?.partnership_names as string[] | undefined) ?? [],
  })
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const tog = (k: string) => (v: boolean) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    // Drop blank entries so an empty "Add" click doesn't create a nameless slot.
    const payload = {
      ...form,
      rental_properties: form.rental_properties.map(n => n.trim()).filter(Boolean),
      sole_prop_businesses: form.sole_prop_businesses.map(n => n.trim()).filter(Boolean),
      airbnb_properties: form.airbnb_properties.map(n => n.trim()).filter(Boolean),
      partnership_names: form.partnership_names.map(n => n.trim()).filter(Boolean),
    }
    const res = await fetch('/api/tax-cases', {
      method: taxCase?.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taxCase?.id ? { ...payload, id: taxCase.id } : payload),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Failed to save'); setLoading(false); return }
    router.push(`/tax/${json.data?.id ?? taxCase?.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <h3 className="section-title">Client & Year</h3>
        <Field label="Client *">
          <select className="input" required value={form.person_id} onChange={set('person_id')}>
            <option value="">Select client…</option>
            {people.map((p: any) => (
              <option key={p.id} value={p.id}>{p.last_name}, {p.first_name} {p.email ? `(${p.email})` : ''}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tax Year *">
            <select className="input" value={form.tax_year} onChange={e => setForm(f => ({ ...f, tax_year: Number(e.target.value) }))}>
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </Field>
          <Field label="Period">
            <input className="input" value={form.period_label} onChange={set('period_label')} placeholder="Mar 2025 to Feb 2026" />
          </Field>
        </div>
        <Field label="Status">
          <select className="input" value={form.status} onChange={set('status')}>
            <option value="awaiting_docs">Awaiting documents</option>
            <option value="docs_received">Documents received</option>
            <option value="in_review">In review</option>
            <option value="calc_complete">Calculation complete</option>
            <option value="awaiting_approval">Awaiting client approval</option>
            <option value="filed">Filed with SARS</option>
            <option value="complete">Complete</option>
          </select>
        </Field>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-4">Income Profile</h3>
        <p className="text-xs text-slate-500 mb-5">Select all income types that apply — this auto-generates the required document checklist.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Toggle label="Employment income" hint="IRP5 / IT3(a) from employer" checked={form.has_employment} onChange={tog('has_employment')} />

          <Toggle label="Rental income" hint="Residential or commercial property" checked={form.has_rental} onChange={tog('has_rental')} />
          {form.has_rental && (
            <NameListEditor label="Rental properties" itemLabel="Rental property"
              names={form.rental_properties}
              onChange={names => setForm(f => ({ ...f, rental_properties: names }))} />
          )}

          <Toggle label="Sole proprietor / business" hint="Trading as, consulting, practice" checked={form.has_sole_prop} onChange={tog('has_sole_prop')} />
          {form.has_sole_prop && (
            <NameListEditor label="Businesses" itemLabel="Business"
              names={form.sole_prop_businesses}
              onChange={names => setForm(f => ({ ...f, sole_prop_businesses: names }))} />
          )}

          <Toggle label="Airbnb / short-term rental" hint="Platform income + property expenses" checked={form.has_airbnb} onChange={tog('has_airbnb')} />
          {form.has_airbnb && (
            <NameListEditor label="Airbnb properties" itemLabel="Airbnb property"
              names={form.airbnb_properties}
              onChange={names => setForm(f => ({ ...f, airbnb_properties: names }))} />
          )}

          <Toggle label="Partnership income" hint="Profit/loss allocation from partnership" checked={form.has_partnership} onChange={tog('has_partnership')} />
          {form.has_partnership && (
            <NameListEditor label="Partnerships" itemLabel="Partnership"
              names={form.partnership_names}
              onChange={names => setForm(f => ({ ...f, partnership_names: names }))} />
          )}

          <Toggle label="Investments" hint="Interest, dividends, capital gains" checked={form.has_investments} onChange={tog('has_investments')} />
          <Toggle label="Medical aid" hint="Medical scheme tax credit" checked={form.has_medical} onChange={tog('has_medical')} />
          <Toggle label="Retirement annuity" hint="RA contributions deduction" checked={form.has_ra} onChange={tog('has_ra')} />
          <Toggle label="Pension / provident fund" hint="Employer pension or provident" checked={form.has_pension} onChange={tog('has_pension')} />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title mb-3">Note to Client</h3>
        <textarea className="input min-h-24" value={form.accountant_note} onChange={set('accountant_note')}
          placeholder="e.g. Please upload your rental expense schedule and medical aid certificate before 28 July." />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      <div className="flex gap-3 justify-end pb-6">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : taxCase?.id ? 'Save Changes' : 'Create Case & Generate Checklist'}
        </button>
      </div>
    </form>
  )
}
