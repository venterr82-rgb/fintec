'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Loader2 } from 'lucide-react'

type PendingPerson = { id: string; first_name: string; last_name: string; tax_number: string | null; sars_added_at: string | null }

export default function SarsAuthorisationNotice({ people }: { people: PendingPerson[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function act(personId: string, action: 'added' | 'authorised') {
    setLoadingId(personId)
    await fetch('/api/admin/sars-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId, action }),
    })
    setLoadingId(null)
    router.refresh()
  }

  if (people.length === 0) return null

  return (
    <div className="card border-l-4 border-navy-400">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Bell className="w-4 h-4 text-navy-600" />
        <h3 className="section-title">New Client Registrations — SARS Authorisation Needed</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {people.map(p => (
          <div key={p.id} className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-medium text-slate-800">
                🔔 New client: {p.first_name} {p.last_name} has completed registration.
              </p>
              <p className="text-xs text-slate-500">
                Add to SARS practitioner profile. Tax number: {p.tax_number ?? '—'}
                {p.sars_added_at && <span className="text-emerald-600"> · Added {new Date(p.sars_added_at).toLocaleDateString()}</span>}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => act(p.id, 'added')} disabled={loadingId === p.id} className="btn-secondary text-xs">
                {loadingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark as added to SARS'}
              </button>
              <button onClick={() => act(p.id, 'authorised')} disabled={loadingId === p.id} className="btn-primary text-xs">
                {loadingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark as authorised'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
