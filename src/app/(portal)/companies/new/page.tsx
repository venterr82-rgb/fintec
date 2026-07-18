import CompanyForm from '@/components/companies/CompanyForm'

export default function NewCompanyPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Add Company</h2>
        <p className="text-sm text-slate-500">Enter the company details below</p>
      </div>
      <CompanyForm />
    </div>
  )
}
