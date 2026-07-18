import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, CheckSquare } from 'lucide-react'
import { format } from 'date-fns'

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient()
  const { data: tasks } = await supabase.from('tasks')
    .select('*, companies(name), users!tasks_assigned_to_fkey(full_name, email)')
    .order('due_date', { ascending: true })

  return (
    <div className="max-w-7xl space-y-4">
      <div className="page-header">
        <h2 className="text-2xl font-bold text-slate-800">Tasks</h2>
        <Link href="/tasks/new" className="btn-primary"><Plus className="w-4 h-4" />Create Task</Link>
      </div>
      <div className="card">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="th">Task</th><th className="th">Company</th><th className="th">Assigned To</th>
              <th className="th">Due</th><th className="th">Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks?.length === 0 && (
              <tr><td colSpan={5} className="td text-center py-12 text-slate-400">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />No tasks yet.
              </td></tr>
            )}
            {tasks?.map((t: any) => (
              <tr key={t.id} className="table-row">
                <td className="td">
                  <p className="font-medium text-slate-800">{t.title}</p>
                  {t.description && <p className="text-xs text-slate-400 truncate max-w-xs">{t.description}</p>}
                </td>
                <td className="td text-sm">{t.companies?.name ?? '—'}</td>
                <td className="td text-sm">{t.users?.full_name ?? t.users?.email ?? '—'}</td>
                <td className="td text-xs">{t.due_date ? format(new Date(t.due_date), 'd MMM yyyy') : '—'}</td>
                <td className="td">
                  <span className={t.status === 'completed' ? 'badge-green' : t.status === 'in_progress' ? 'badge-blue' : 'badge-yellow'}>
                    {t.status?.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
