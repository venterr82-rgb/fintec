'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'

export default function IncomeTaxHistoryChart({ data }: { data: { tax_year: number; taxable_income: number; tax_liability: number }[] }) {
  const chartData = [...data]
    .sort((a, b) => a.tax_year - b.tax_year)
    .map(d => ({
      year: String(d.tax_year),
      Income: Number(d.taxable_income),
      Tax: Number(d.tax_liability),
    }))

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }}
            tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: any) => `R ${Number(v).toLocaleString()}`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Income" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Tax" fill="#c89b4a" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
