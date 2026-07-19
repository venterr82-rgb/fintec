'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type SarsCode = { code: string; description: string; category: string }

let cachedCodes: SarsCode[] | null = null

export default function SarsCodeCombobox({ value, onSelect }: {
  value: string | null | undefined
  onSelect: (code: string, description: string) => void
}) {
  const [codes, setCodes] = useState<SarsCode[]>(cachedCodes ?? [])
  const [query, setQuery] = useState(value ?? '')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value ?? '') }, [value])

  useEffect(() => {
    if (cachedCodes) return
    const supabase = createClient()
    supabase.from('sars_codes').select('code, description, category').order('sort_order')
      .then(({ data }) => { cachedCodes = data ?? []; setCodes(cachedCodes) })
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const q = query.trim().toLowerCase()
  const matches = q.length === 0 ? [] : codes.filter(c =>
    c.code.includes(q) || c.description.toLowerCase().includes(q)
  ).slice(0, 15)

  return (
    <div className="relative" ref={containerRef}>
      <input
        className="input py-1 text-xs w-24"
        value={query}
        placeholder="Code"
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-80 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {matches.map(c => (
            <button
              key={c.code}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0"
              onClick={() => {
                onSelect(c.code, c.description)
                setQuery(c.code)
                setOpen(false)
              }}
            >
              <p className="text-xs font-semibold text-navy-700">{c.code} <span className="text-slate-400 font-normal">· {c.category}</span></p>
              <p className="text-xs text-slate-600">{c.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
