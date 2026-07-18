'use client'
import { createClient } from '@/lib/supabase/client'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function DocumentDownload({ filePath, fileName }: { filePath: string; fileName: string }) {
  const [loading, setLoading] = useState(false)
  async function handleDownload() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.storage.from('Documents').createSignedUrl(filePath, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
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
