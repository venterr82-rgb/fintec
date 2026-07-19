import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CompanyForm from '@/components/companies/CompanyForm'

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: company } = await supabase.from('companies').select('*').eq('id', params.id).single()
  if (!company) notFound()

  return (
    <div className="max-w-2xl">
      <Link href={`/companies/${params.id}`} className="text-sm text-slate-500 hover:text-navy-700 flex items-center gap-1 mb-3">
        <ArrowLeft className="w-3 h-3" /> {company.name}
      </Link>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Company</h2>
      <CompanyForm company={company} redirectTo={`/companies/${params.id}`} />
    </div>
  )
}
