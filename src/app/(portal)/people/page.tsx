import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

export default async function PeoplePage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = await createServerSupabaseClient()
  let q = supabase.from('people').select('*, company_people(role, companies(name))').order('last_name')
  if (searchParams.q) q = q.or(`first_name.ilike.%${searchParams.q}%,last_name.ilike.%${searchParams.q}%,id_number.ilike.%${searchParams.q}%`)
  const { data: people } = await q

  return (
    <div className="max-w-7xl space-y-4">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">People</h2>
          <p className="text-sm text-slate-500">Directors & shareholders</p>
        </div>
        <Link href="/people/new" className="btn-primary"><Plus className="w-4 h-4" />Add Person</Link>
      </div>
      <div className="card">
        <form className="flex gap-3 p-4 border-b border-slate-100">
          <input name="q" defaultValue={searchParams.q} className="input max-w-xs" placeholder="Search by name or ID…" />
          <button type="submit" className="btn-primary">Search</button>
        </form>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="th">Name</th><th className="th">ID Number</th><th className="th">Tax Number</th>
              <th className="th">Email</th><th className="th">Companies</th><th className="th">Portal</th><th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {people?.length === 0 && (
              <tr><td colSpan={7} className="td text-center py-12 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />No people found.
              </td></tr>
            )}
            {people?.map((p: any) => (
              <tr key={p.id} className="table-row">
                <td className="td">
                  <Link href={`/people/${p.id}`} className="font-medium text-navy-700 hover:underline">
                    {p.first_name} {p.second_name ? p.second_name + ' ' : ''}{p.last_name}
                  </Link>
                </td>
                <td className="td font-mono text-xs">{p.id_number ?? '—'}</td>
                <td className="td font-mono text-xs">{p.tax_number ?? '—'}</td>
                <td className="td text-xs">{p.email ?? '—'}</td>
                <td className="td">
                  <div className="flex flex-wrap gap-1">
                    {p.company_people?.slice(0,2).map((cp: any, i: number) => (
                      <span key={i} className="badge-gray text-xs">{cp.companies?.name}</span>
                    ))}
                    {p.company_people?.length > 2 && <span className="badge-gray">+{p.company_people.length - 2}</span>}
                  </div>
                </td>
                <td className="td"><span className={p.has_portal_access ? 'badge-green' : 'badge-gray'}>{p.has_portal_access ? 'Active' : 'None'}</span></td>
                <td className="td"><Link href={`/people/${p.id}`} className="text-xs text-navy-600 hover:underline">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
