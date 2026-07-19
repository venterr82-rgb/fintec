'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert } from 'lucide-react'
import { siteConfig } from '@/lib/config/site'

export default function PersonalDetailsStep({ initial }: {
  initial: { full_name: string; id_number: string; tax_number: string; phone: string; residential_address_line1: string; residential_city: string; residential_province: string; residential_postal_code: string; email: string }
}) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [acknowledged, setAcknowledged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/onboarding/step1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Something went wrong.'); setLoading(false); return }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <h3 className="section-title">Your Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full name *</label>
            <input className="input" required value={form.full_name} onChange={set('full_name')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-slate-50" value={form.email} disabled readOnly />
          </div>
          <div>
            <label className="label">ID number *</label>
            <input className="input" required value={form.id_number} onChange={set('id_number')} />
          </div>
          <div>
            <label className="label">Tax reference number *</label>
            <input className="input" required value={form.tax_number} onChange={set('tax_number')} />
          </div>
          <div>
            <label className="label">Phone number</label>
            <input className="input" value={form.phone} onChange={set('phone')} placeholder="071 234 5678" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Physical address</label>
            <input className="input" value={form.residential_address_line1} onChange={set('residential_address_line1')} placeholder="Street address" />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" value={form.residential_city} onChange={set('residential_city')} />
          </div>
          <div>
            <label className="label">Province</label>
            <input className="input" value={form.residential_province} onChange={set('residential_province')} />
          </div>
          <div>
            <label className="label">Postal code</label>
            <input className="input" value={form.residential_postal_code} onChange={set('residential_postal_code')} />
          </div>
        </div>
      </div>

      <div className="card p-6 border-l-4 border-amber-400 bg-amber-50/50">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-slate-800 mb-2">IMPORTANT — SARS Practitioner Authorisation</h3>
            <p className="text-sm text-slate-600 mb-3">
              Before we can access your tax profile or file your return, you need to authorise
              {' '}{siteConfig.companyName} as your registered tax practitioner on SARS eFiling.
            </p>
            <p className="text-sm font-medium text-slate-700 mb-1">What happens next:</p>
            <ol className="text-sm text-slate-600 list-decimal list-inside space-y-1 mb-4">
              <li>We submit a Power of Attorney request linking your tax number to our practitioner number {siteConfig.credentials.find(c => c.val === 'SARS')?.label}</li>
              <li>SARS will SMS or email you to authorise this</li>
              <li>You approve it on SARS eFiling or via SMS</li>
              <li>This takes up to 24 hours</li>
              <li>We cannot begin your return until approved</li>
            </ol>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="mt-1" required checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />
              <span className="text-sm text-slate-700">I understand the SARS practitioner authorisation process described above.</span>
            </label>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <button type="submit" disabled={loading || !acknowledged} className="btn-primary w-full justify-center py-3">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'I understand — continue to next step'}
      </button>
    </form>
  )
}
