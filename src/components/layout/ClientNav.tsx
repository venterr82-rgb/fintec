'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, FolderOpen, Calendar, Upload, LogOut, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

const navItems = [
  { href: '/my-company', label: 'My Company', icon: Building2 },
  { href: '/my-documents', label: 'My Documents', icon: FolderOpen },
  { href: '/my-compliance', label: 'Compliance', icon: Calendar },
  { href: '/upload', label: 'Upload File', icon: Upload },
]

export default function ClientNav({ tenantName = 'Compliance Hub', primaryColor = '#1e3a5f', userName }: { tenantName?: string; primaryColor?: string; userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  async function logout() {
    const supabase = createClient(); await supabase.auth.signOut(); router.push('/login')
  }
  return (
    <aside className="w-56 flex flex-col h-screen border-r border-slate-200 bg-white shrink-0">
      <div className="px-4 py-5 border-b border-slate-100" style={{ background: primaryColor }}>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">{tenantName}</span>
        </div>
        {userName && <p className="text-white/60 text-xs mt-1 truncate">{userName}</p>}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active ? 'bg-navy-50 text-navy-700' : 'text-slate-600 hover:bg-slate-50')}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-slate-100">
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-slate-50">
          <LogOut className="w-4 h-4" />Sign out
        </button>
      </div>
    </aside>
  )
}
