import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, Plus, Download, Upload } from 'lucide-react'

export default async function CompaniesPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const supabase = await createServerSupabaseClient()

  let query = supabase.from('companies')
    .select('id, name, registration_number, tax_number, vat_number, status, enterprise_type, email, phone')
    .order('name', { ascending: true })

  if (searchParams.q) query = query.ilike('name', `%${searchParams.q}%`)
  if (searchParams.status) query = query.eq('status', searchParams.status)

  const { data: companies } = await query

  return (
    <div className="max-w-7xl space-y-4">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Companies</h2>
          <p className="text-sm text-slate-500">{companies?.length ?? 0} companies</p>
        </div>
        <div className="flex gap-2">
          <Link href="/import" className="btn-secondary"><Upload className="w-4 h-4" />Import</Link>
          <Link href="/companies/new" className="btn-primary"><Plus className="w-4 h-4" />Add Company</Link>
        </div>
      </div>

      <div className="card">
        {/* Search / filter bar */}
        <div className="flex flex-wrap gap-3 p-4 border-b border-slate-100">
          <form className="flex gap-2 flex-1 min-w-0">
            <input name="q" defaultValue={searchParams.q} className="input max-w-xs" placeholder="Search by name…" />
            <select name="status" defaultValue={searchParams.status} className="input w-40">
              <option value="">All statuses</option>
              <option>In Business</option>
              <option>Dormant</option>
              <option>Deregistered</option>
            </select>
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="th">Company</th>
                <th className="th">Reg Number</th>
                <th className="th">Tax Number</th>
                <th className="th">VAT</th>
                <th className="th">Type</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {companies?.length === 0 && (
                <tr><td colSpan={7} className="td text-center py-12 text-slate-400">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No companies yet. <Link href="/companies/new" className="text-navy-600 underline">Add your first</Link>
                </td></tr>
              )}
              {companies?.map((c: any) => (
                <tr key={c.id} className="table-row">
                  <td className="td">
                    <Link href={`/companies/${c.id}`} className="font-medium text-navy-700 hover:underline">{c.name}</Link>
                    {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                  </td>
                  <td className="td font-mono text-xs">{c.registration_number ?? '—'}</td>
                  <td className="td font-mono text-xs">{c.tax_number ?? '—'}</td>
                  <td className="td font-mono text-xs">{c.vat_number ?? '—'}</td>
                  <td className="td text-xs">{c.enterprise_type ?? '—'}</td>
                  <td className="td">
                    <span className={c.status === 'In Business' ? 'badge-green' : 'badge-gray'}>{c.status ?? '—'}</span>
                  </td>
                  <td className="td">
                    <Link href={`/companies/${c.id}`} className="text-xs text-navy-600 hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
