'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsForm({ tenant }: { tenant: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: tenant?.name ?? '', primary_color: tenant?.primary_color ?? '#1e3a5f', accent_color: tenant?.accent_color ?? '#2e86ab',
  })
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const supabase = createClient()
    await supabase.from('tenants').update(form).eq('id', tenant.id)
    setSaved(true); setLoading(false); router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="card p-6">
      <h3 className="section-title mb-4">Firm Profile & Branding</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <div><label className="label">Firm Name</label><input className="input max-w-sm" value={form.name} onChange={set('name')} /></div>
        <div className="flex gap-6">
          <div><label className="label">Primary Colour</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color} onChange={set('primary_color')} className="w-10 h-9 rounded border border-slate-300 cursor-pointer" />
              <input className="input w-28 font-mono text-xs" value={form.primary_color} onChange={set('primary_color')} />
            </div>
          </div>
          <div><label className="label">Accent Colour</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.accent_color} onChange={set('accent_color')} className="w-10 h-9 rounded border border-slate-300 cursor-pointer" />
              <input className="input w-28 font-mono text-xs" value={form.accent_color} onChange={set('accent_color')} />
            </div>
          </div>
        </div>
        {/* Live preview */}
        <div className="mt-2">
          <label className="label">Sidebar Preview</label>
          <div className="w-48 rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ background: form.primary_color }}>
            <div className="px-4 py-3 border-b border-white/10">
              <span className="text-white text-xs font-semibold">{form.name}</span>
            </div>
            <div className="px-2 py-2 space-y-0.5">
              {['Dashboard','Companies','Compliance'].map(item => (
                <div key={item} className="px-3 py-2 rounded-lg text-xs text-white/70">{item}</div>
              ))}
              <div className="px-3 py-2 rounded-lg text-xs text-white" style={{ background: form.accent_color }}>Documents</div>
            </div>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
