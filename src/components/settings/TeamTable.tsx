'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TeamTable({ users }: { users: any[] }) {
  const router = useRouter()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('staff')
  const [loading, setLoading] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault(); if (!inviteEmail) return
    setLoading(true)
    const supabase = createClient()
    // In production: use Supabase admin.inviteUserByEmail
    // For now, just show the concept
    alert(`Invite sent to ${inviteEmail} as ${inviteRole}. In production, connect Supabase admin.inviteUserByEmail()`)
    setInviteEmail(''); setLoading(false); router.refresh()
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="section-title">Team Members</h3>
      </div>
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr><th className="th">Name</th><th className="th">Email</th><th className="th">Role</th><th className="th">Status</th></tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u.id} className="table-row">
              <td className="td font-medium">{u.full_name ?? '—'}</td>
              <td className="td text-sm text-slate-500">{u.email}</td>
              <td className="td"><span className="badge-blue">{u.role}</span></td>
              <td className="td"><span className={u.is_active ? 'badge-green' : 'badge-gray'}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={handleInvite} className="flex gap-3 p-4 border-t border-slate-100">
        <input className="input flex-1 max-w-xs" type="email" placeholder="Invite by email…" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
        <select className="input w-28" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
          <option value="staff">Staff</option><option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}Invite
        </button>
      </form>
    </div>
  )
}
