'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Users, Calendar, FolderOpen, CheckSquare, Upload, Settings, LogOut, ChevronLeft, Menu, Shield, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/tax',        label: 'Tax Cases',      icon: FileText },
  { href: '/companies',  label: 'Companies',      icon: Building2 },
  { href: '/people',     label: 'People',         icon: Users },
  { href: '/compliance', label: 'Compliance',     icon: Calendar },
  { href: '/documents',  label: 'Documents',      icon: FolderOpen },
  { href: '/tasks',      label: 'Tasks',          icon: CheckSquare },
  { href: '/import',     label: 'Import/Export',  icon: Upload },
  { href: '/settings',   label: 'Settings',       icon: Settings },
]

export default function Sidebar({ tenantName = 'Compliance Hub' }: { tenantName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className={clsx('flex flex-col h-screen bg-navy-700 border-r border-navy-800 transition-all duration-200 shrink-0', collapsed ? 'w-16' : 'w-60')}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-navy-800">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm truncate">{tenantName}</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg text-navy-300 hover:bg-navy-600 hover:text-white transition-colors ml-auto">
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined}
              className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                active ? 'bg-navy-600 text-white' : 'text-navy-200 hover:bg-navy-600 hover:text-white',
                collapsed && 'justify-center')}>
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="px-2 py-3 border-t border-navy-800">
        <button onClick={handleLogout} className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-300 hover:bg-navy-600 hover:text-red-300 transition-colors', collapsed && 'justify-center')}>
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
