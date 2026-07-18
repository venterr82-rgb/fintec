import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

// No auth check here — middleware handles protection.
// Removing the Supabase session check prevents a second redirect loop.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
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
