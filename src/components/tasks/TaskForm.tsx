'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const TASK_TYPES = ['Follow-up', 'Document Request', 'SARS Submission', 'Internal Review', 'Client Call', 'Other']

export default function TaskForm({ companies, staff, task, defaultCompanyId }: {
  companies: any[]
  staff: any[]
  task?: any
  defaultCompanyId?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    company_id: task?.company_id ?? defaultCompanyId ?? '',
    task_type: task?.task_type ?? '',
    assigned_to: task?.assigned_to ?? '',
    due_date: task?.due_date ?? '',
    status: task?.status ?? 'pending',
  })
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', session!.user.id).single()
    const payload = {
      ...form,
      company_id: form.company_id || null,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      tenant_id: userData?.tenant_id,
      created_by: session!.user.id,
    }
    const { error: dbError } = task?.id
      ? await supabase.from('tasks').update(payload).eq('id', task.id)
      : await supabase.from('tasks').insert(payload)
    if (dbError) { setError(dbError.message); setLoading(false); return }
    router.push('/tasks')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <label className="label">Title *</label>
        <input className="input" required value={form.title} onChange={set('title')} placeholder="e.g. Follow up on outstanding VAT return" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={3} value={form.description} onChange={set('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Company</label>
          <select className="input" value={form.company_id} onChange={set('company_id')}>
            <option value="">No company</option>
            {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Task Type</label>
          <select className="input" value={form.task_type} onChange={set('task_type')}>
            <option value="">Select type…</option>
            {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Assigned To</label>
          <select className="input" value={form.assigned_to} onChange={set('assigned_to')}>
            <option value="">Unassigned</option>
            {staff.map((u: any) => <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" value={form.due_date} onChange={set('due_date')} />
        </div>
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={set('status')}>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : task?.id ? 'Save Task' : 'Create Task'}
        </button>
      </div>
    </form>
  )
}
