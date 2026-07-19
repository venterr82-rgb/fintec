'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const TIERS = [
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'custom', label: 'Custom' },
]

export default function TierSelector({ personId, initialTier, initialEngagementDescription }: {
  personId: string
  initialTier: string | null
  initialEngagementDescription: string | null
}) {
  const router = useRouter()
  const [tier, setTier] = useState((initialTier ?? 'basic').toLowerCase())
  const [engagementDescription, setEngagementDescription] = useState(initialEngagementDescription ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true)
    setError('')
    setSaved(false)
    const res = await fetch('/api/people/tier', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId, tier, engagementDescription }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setError(json.error ?? 'Could not save.'); return }
    setSaved(true)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Tier</label>
        <select className="input" value={tier} onChange={e => { setTier(e.target.value); setSaved(false) }}>
          {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      {tier === 'custom' && (
        <div>
          <label className="label">Engagement description</label>
          <textarea
            className="input min-h-20"
            value={engagementDescription}
            onChange={e => { setEngagementDescription(e.target.value); setSaved(false) }}
            placeholder="e.g. Monthly retainer — R1,200/mo includes bookkeeping + tax"
          />
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={loading} className="btn-secondary text-xs">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Tier'}
        </button>
        {saved && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </div>
  )
}
