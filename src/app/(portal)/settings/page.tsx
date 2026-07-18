import { createServerSupabaseClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/settings/SettingsForm'
import TeamTable from '@/components/settings/TeamTable'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: tenant } = await supabase.from('tenants').select('*').single()
  const { data: users } = await supabase.from('users').select('*').order('full_name')
  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
      <SettingsForm tenant={tenant} />
      <TeamTable users={users ?? []} />
    </div>
  )
}
