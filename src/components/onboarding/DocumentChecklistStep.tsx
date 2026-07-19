'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle, Lock, Loader2 } from 'lucide-react'
import ClientUploadDoc from '@/components/tax/ClientUploadDoc'
import DocumentDownload from '@/components/documents/DocumentDownload'
import { isDocumentTypeUnlocked, nextTierFor, TIER_LABELS } from '@/lib/tax/tierDocumentAccess'
import { siteConfig } from '@/lib/config/site'

export default function DocumentChecklistStep({ taxCaseId, documents, tier }: {
  taxCaseId: string | null
  documents: any[]
  tier: string | null
}) {
  const router = useRouter()
  const [upgrading, setUpgrading] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const next = nextTierFor(tier)
  // siteConfig.pricingTiers names are capitalized ('Standard') for display;
  // people.tier/next are lowercase ('standard') — compare case-insensitively.
  const nextTierConfig = siteConfig.pricingTiers.find(t => t.name.toLowerCase() === next)
  const currentTierConfig = siteConfig.pricingTiers.find(t => t.name.toLowerCase() === (tier ?? 'basic').toLowerCase())
  const upgradeCost = nextTierConfig ? nextTierConfig.amount - (currentTierConfig?.amount ?? 0) : 0

  async function handleUpgrade() {
    if (!next) return
    setUpgrading(true)
    const res = await fetch('/api/tier-upgrade/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetTier: next }),
    })
    const json = await res.json()
    if (res.ok && json.redirectUrl) {
      window.location.href = json.redirectUrl
    } else {
      setUpgrading(false)
    }
  }

  async function handleFinish() {
    setFinishing(true)
    await fetch('/api/onboarding/complete', { method: 'POST' })
    router.push('/my-company')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="section-title">Document Checklist</h3>
          <p className="text-xs text-slate-500 mt-0.5">You're on the <strong>{TIER_LABELS[(tier ?? 'basic').toLowerCase()] ?? 'Basic'}</strong> package.</p>
        </div>
        <div className="divide-y divide-slate-50">
          {documents.filter(d => d.status !== 'not_applicable').map(doc => {
            const unlocked = isDocumentTypeUnlocked(tier, doc.document_type)
            return (
              <div key={doc.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {!unlocked ? <Lock className="w-4 h-4 text-slate-300 shrink-0" />
                      : doc.status === 'outstanding' ? <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      : doc.status === 'rejected' ? <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      : <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                    <div>
                      <p className={`text-sm font-medium ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>{doc.label}</p>
                      {unlocked && doc.status === 'outstanding' && doc.description && (
                        <p className="text-xs text-slate-400">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {unlocked && doc.status === 'outstanding' && taxCaseId && (
                      <ClientUploadDoc docId={doc.id} taxCaseId={taxCaseId} />
                    )}
                    {unlocked && doc.file_path && (
                      <DocumentDownload filePath={doc.file_path} fileName={doc.file_name ?? doc.label} />
                    )}
                  </div>
                </div>
                {doc.status === 'rejected' && (
                  <div className="mt-2 ml-7 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-red-700">This document was rejected</p>
                    {doc.reviewed_by && <p className="text-xs text-red-600 mt-0.5">Please upload the correct document.</p>}
                  </div>
                )}
                {!unlocked && next && (
                  <div className="mt-2 ml-7 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-800">
                      This document type requires the {TIER_LABELS[next] ?? next} package. You are currently on {TIER_LABELS[(tier ?? 'basic').toLowerCase()] ?? 'Basic'}.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
          {documents.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Your document checklist will appear here once your tax case is set up.</p>
          )}
        </div>
      </div>

      {next && (
        <div className="card p-5 bg-navy-50 border border-navy-100">
          <p className="text-sm text-slate-700 mb-3">
            To unlock {TIER_LABELS[next] ?? next}-tier documents, upgrade for an additional
            {' '}R{(upgradeCost / 100).toLocaleString()}.
          </p>
          <button onClick={handleUpgrade} disabled={upgrading} className="btn-primary text-sm">
            {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Upgrade now — pay R${(upgradeCost / 100).toLocaleString()}`}
          </button>
        </div>
      )}

      <button onClick={handleFinish} disabled={finishing} className="btn-primary w-full justify-center py-3">
        {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue to Portal'}
      </button>
    </div>
  )
}
