import { createServerSupabaseClient } from '@/lib/supabase/server'
import TaskForm from '@/components/tasks/TaskForm'

export default async function NewTaskPage({ searchParams }: { searchParams: { company?: string } }) {
  const supabase = await createServerSupabaseClient()
  const [{ data: companies }, { data: staff }] = await Promise.all([
    supabase.from('companies').select('id, name').order('name'),
    supabase.from('users').select('id, full_name, email').in('role', ['admin', 'staff']).order('full_name'),
  ])

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Create Task</h2>
      <TaskForm companies={companies ?? []} staff={staff ?? []} defaultCompanyId={searchParams.company} />
    </div>
  )
}
