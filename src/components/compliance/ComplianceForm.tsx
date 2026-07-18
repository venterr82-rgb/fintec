'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const TYPES = ['VAT','PAYE','UIF','SDL','Provisional Tax','Income Tax (ITR14)','CIPC Annual Return','Workmen Compensation']

export default function ComplianceForm({ companies, item }: { companies: any[]; item?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    company_id: item?.company_id ?? '',
    type: item?.type ?? '',
    period: item?.period ?? '',
    due_date: item?.due_date ?? '',
    status: item?.status ?? 'pending',
    amount_due: item?.amount_due ?? '',
    notes: item?.notes ?? '',
  })
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', session!.user.id).single()
    const payload = { ...form, tenant_id: userData?.tenant_id, amount_due: form.amount_due ? Number(form.amount_due) : null }
    if (item?.id) await supabase.from('compliance_items').update(payload).eq('id', item.id)
    else await supabase.from('compliance_items').insert(payload)
    router.push('/compliance'); router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div><label className="label">Company *</label>
        <select className="input" required value={form.company_id} onChange={set('company_id')}>
          <option value="">Select company…</option>
          {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div><label className="label">Type *</label>
        <select className="input" required value={form.type} onChange={set('type')}>
          <option value="">Select type…</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Period</label><input className="input" placeholder="Feb 2026" value={form.period} onChange={set('period')} /></div>
        <div><label className="label">Due Date *</label><input type="date" className="input" required value={form.due_date} onChange={set('due_date')} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div><label className="label">Amount Due (R)</label><input type="number" className="input" value={form.amount_due} onChange={set('amount_due')} /></div>
      </div>
      <div><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes} onChange={set('notes')} /></div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Item'}
        </button>
      </div>
    </form>
  )
}
