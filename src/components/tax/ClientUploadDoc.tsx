'use client'
import { useState } from 'react'
import { Upload, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ClientUploadDoc({ docId, taxCaseId, status }: { docId: string; taxCaseId: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('docId', docId)
    fd.append('taxCaseId', taxCaseId)
    const res = await fetch('/api/tax-docs/upload', { method: 'POST', body: fd })
    setLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => null)
      setError(json?.error ?? 'Upload failed. Please try again.')
      return
    }
    router.refresh()
  }

  async function handleRemove() {
    if (!confirm('Remove this upload? You\'ll need to upload the correct document afterwards.')) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/tax-docs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId }),
    })
    setLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => null)
      setError(json?.error ?? 'Could not remove this upload. Please try again.')
      return
    }
    router.refresh()
  }

  if (status === 'uploaded') {
    return (
      <div>
        <button onClick={handleRemove} disabled={loading} className="btn-secondary text-xs text-red-600 hover:bg-red-50">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          Remove
        </button>
        {error && <p className="text-xs text-red-600 mt-1 max-w-[160px]">{error}</p>}
      </div>
    )
  }

  if (status !== 'outstanding') return null

  return (
    <div>
      <label className="btn-secondary text-xs cursor-pointer">
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        Upload
        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" onChange={handleUpload} />
      </label>
      {error && <p className="text-xs text-red-600 mt-1 max-w-[160px]">{error}</p>}
    </div>
  )
}
