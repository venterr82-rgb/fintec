import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientNav from '@/components/layout/ClientNav'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: userData } = await supabase.from('users').select('full_name, role, person_id').eq('id', user.id).single()
  if (userData?.role !== 'client') redirect('/dashboard')

  if (userData.person_id) {
    const { data: person } = await supabase.from('people').select('onboarding_complete').eq('id', userData.person_id).single()
    if (person && person.onboarding_complete === false) redirect('/onboarding')
  }

  const { data: tenant } = await supabase.from('tenants').select('name, primary_color').single()
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <ClientNav tenantName={tenant?.name} primaryColor={tenant?.primary_color} userName={userData?.full_name ?? user.email} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
