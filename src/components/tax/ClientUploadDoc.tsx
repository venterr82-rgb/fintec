'use client'
import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ClientUploadDoc({ docId, taxCaseId }: { docId: string; taxCaseId: string }) {
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
