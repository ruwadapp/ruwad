'use client'
import { useState } from 'react'
import { Link2, Plus, X, ExternalLink } from 'lucide-react'

// بديل المرفقات بلا تخزين: روابط خارجية (Google Drive، YouTube، Figma، GitHub...)
export function LinksInput({
  links,
  onChange,
  max = 5,
  placeholder = 'الصق رابطاً (Google Drive، YouTube، ...)',
}: {
  links: string[]
  onChange: (v: string[]) => void
  max?: number
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')
  const [err, setErr] = useState<string | null>(null)

  function add() {
    let v = draft.trim()
    if (!v) return
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v
    try { new URL(v) } catch { setErr('الرابط غير صالح'); return }
    if (links.includes(v)) { setErr('الرابط مضاف مسبقاً'); return }
    if (links.length >= max) { setErr(`الحد الأقصى ${max} روابط`); return }
    onChange([...links, v])
    setDraft('')
    setErr(null)
  }

  const host = (u: string) => { try { return new URL(u).hostname.replace('www.', '') } catch { return u } }

  return (
    <div className="flex flex-col gap-2">
      {links.map((l) => (
        <div key={l} className="flex items-center gap-2 bg-ruwad-blue/5 border border-ruwad-blue/20 rounded-ruwad-sm px-3 py-2">
          <Link2 size={14} className="text-ruwad-blue shrink-0" />
          <a href={l} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-sm text-ruwad-navy truncate hover:text-ruwad-blue" dir="ltr">
            {host(l)} <span className="text-ruwad-navy/40">— {l}</span>
          </a>
          <ExternalLink size={12} className="text-ruwad-navy/30 shrink-0" />
          <button type="button" onClick={() => onChange(links.filter((x) => x !== l))} aria-label="حذف" className="text-ruwad-navy/40 hover:text-red-500 shrink-0"><X size={14} /></button>
        </div>
      ))}
      {links.length < max && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setErr(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            placeholder={placeholder}
            dir="ltr"
            className="flex-1 border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue transition"
          />
          <button type="button" onClick={add} className="bg-ruwad-blue/10 text-ruwad-blue rounded-ruwad-sm px-3 hover:bg-ruwad-blue/20 transition shrink-0"><Plus size={16} /></button>
        </div>
      )}
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  )
}
