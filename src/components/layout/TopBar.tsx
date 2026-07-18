'use client'
import { Bell, Search } from 'lucide-react'

export default function TopBar({ userName, pageTitle }: { userName?: string; pageTitle?: string }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-semibold text-slate-800">{pageTitle}</h1>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 w-56" placeholder="Search…" />
        </div>
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-bold">
          {userName?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  )
}
