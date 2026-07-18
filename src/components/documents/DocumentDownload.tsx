'use client'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function DocumentDownload({ filePath, fileName }: { filePath: string; fileName: string }) {
  const [loading, setLoading] = useState(false)
  async function handleDownload() {
    setLoading(true)
    const res = await fetch('/api/documents/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    })
    const json = await res.json()
    if (res.ok && json.signedUrl) window.open(json.signedUrl, '_blank')
    setLoading(false)
  }
  return (
    <button onClick={handleDownload} disabled={loading}
      className="flex items-center gap-1 text-xs text-navy-600 hover:text-navy-800 font-medium">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
      Download
    </button>
  )
}
