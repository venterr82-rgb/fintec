'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Users, Calendar, FolderOpen, CheckSquare, Upload, Settings, LogOut, ChevronLeft, Menu, FileText } from 'lucide-react'
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
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={clsx('flex flex-col h-screen bg-navy-700 border-r border-navy-800 transition-all duration-200 shrink-0', collapsed ? 'w-16' : 'w-60')}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-navy-800">
        {!collapsed && (
          <div className="bg-white rounded-lg px-3 py-2 min-w-0">
            <img src="https://fintecgroup.co.za/wp-content/uploads/2026/05/FG_Logo_transparent.png"
              alt="Fintec Group" className="h-6 w-auto" />
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
        <form method="POST" action="/auth/logout-action">
          <button type="submit" className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-300 hover:bg-navy-600 hover:text-red-300 transition-colors', collapsed && 'justify-center')}>
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </form>
      </div>
    </aside>
  )
}
