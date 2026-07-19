import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

// Middleware only confirms a session exists — it doesn't check role. Without
// this check, any authenticated 'client'-role user could browse straight to
// /companies, /tasks, /tax/[id], /people, etc. by URL (RLS's tenant-wide
// SELECT policies would then hand back other clients' data). This is the
// admin/staff equivalent of the role gate already in (client)/layout.tsx.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userData?.role === 'client') redirect('/my-company')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
