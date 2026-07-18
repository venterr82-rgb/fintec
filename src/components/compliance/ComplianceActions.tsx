'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ComplianceActions({ item }: { item: any }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function markSubmitted() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('compliance_items').update({
      status: 'submitted',
      submitted_date: new Date().toISOString().split('T')[0]
    }).eq('id', item.id)
    setLoading(false)
    router.refresh()
  }

  if (item.status === 'submitted') return <span className="text-xs text-slate-400">Done</span>
  return (
    <button onClick={markSubmitted} disabled={loading}
      className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
      Mark submitted
    </button>
  )
}
