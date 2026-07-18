import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Plus, UserCircle } from 'lucide-react'
import AddPersonModal from '@/components/people/AddPersonModal'

export default async function DirectorsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: company } = await supabase.from('companies').select('name').eq('id', params.id).single()
  const { data: members } = await supabase.from('company_people')
    .select('*, people(*)')
    .eq('company_id', params.id)
    .order('appointment_date', { ascending: true })

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <Link href={`/companies/${params.id}`} className="text-sm text-slate-500 hover:text-navy-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3 h-3" /> {company?.name}
        </Link>
        <div className="page-header">
          <h2 className="text-2xl font-bold text-slate-800">Directors & Shareholders</h2>
          <Link href={`/people/new?company=${params.id}`} className="btn-primary"><Plus className="w-4 h-4" />Add Person</Link>
        </div>
      </div>

      <div className="card">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="th">Name</th>
              <th className="th">ID Number</th>
              <th className="th">Role</th>
              <th className="th">Shareholding</th>
              <th className="th">Appointment</th>
              <th className="th">Status</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {members?.length === 0 && (
              <tr><td colSpan={7} className="td text-center py-12 text-slate-400">
                <UserCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No directors or shareholders yet.
              </td></tr>
            )}
            {members?.map((m: any) => (
              <tr key={m.id} className="table-row">
                <td className="td">
                  <Link href={`/people/${m.person_id}`} className="font-medium text-navy-700 hover:underline">
                    {m.people?.first_name} {m.people?.last_name}
                  </Link>
                  {m.people?.email && <p className="text-xs text-slate-400">{m.people.email}</p>}
                </td>
                <td className="td font-mono text-xs">{m.people?.id_number ?? '—'}</td>
                <td className="td">
                  <span className={m.role === 'both' ? 'badge-blue' : m.role === 'director' ? 'badge-gray' : 'badge-green'}>
                    {m.role}
                  </span>
                </td>
                <td className="td text-xs">
                  {m.shareholding_percentage ? `${m.shareholding_percentage}%` : '—'}
                  {m.shareholding_shares && <span className="text-slate-400 ml-1">({m.shareholding_shares} shares)</span>}
                </td>
                <td className="td text-xs">{m.appointment_date ?? '—'}</td>
                <td className="td">
                  <span className={m.director_status === 'Active' ? 'badge-green' : 'badge-gray'}>{m.director_status}</span>
                </td>
                <td className="td">
                  <Link href={`/people/${m.person_id}`} className="text-xs text-navy-600 hover:underline">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
