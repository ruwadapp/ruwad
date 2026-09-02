'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Phone, MessageCircle, StickyNote, Trash2, BookOpen, Clock } from 'lucide-react'

/* ================================================================
   المهتمون (CRM): مسار المهتم من الاستفسار حتى التسجيل
   جديد ← تواصلنا ← حجز مقعد ← سجّل / مغلق
   ================================================================ */

interface Inquiry {
  id: string; full_name: string; phone: string; message: string | null
  stage: 'new' | 'contacted' | 'reserved' | 'enrolled' | 'closed'
  admin_notes: string | null; created_at: string
  course: { title: string } | null
}

const STAGES = [
  { key: 'new', label: 'جديد', color: '#3A4EFB' },
  { key: 'contacted', label: 'تواصلنا', color: '#d97706' },
  { key: 'reserved', label: 'حجز مقعد', color: '#7c3aed' },
  { key: 'enrolled', label: 'سجّل 🎉', color: '#16a34a' },
  { key: 'closed', label: 'مغلق', color: '#94a3b8' },
] as const

const timeAgo = (iso: string) => {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (h < 1) return 'قبل قليل'
  if (h < 24) return `قبل ${h} ساعة`
  const d = Math.floor(h / 24)
  return d === 1 ? 'أمس' : `قبل ${d} يوم`
}

export function InquiriesManager({ initial }: { initial: Inquiry[] }) {
  const supabase = createClient()
  const [items, setItems] = useState<Inquiry[]>(initial)
  const [filter, setFilter] = useState<string>('active') // active = كل غير المغلق
  const [noteEditing, setNoteEditing] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const i of items) c[i.stage] = (c[i.stage] ?? 0) + 1
    return c
  }, [items])

  const shown = useMemo(() => (
    filter === 'active' ? items.filter((i) => i.stage !== 'closed' && i.stage !== 'enrolled')
    : items.filter((i) => i.stage === filter)
  ), [items, filter])

  async function setStage(id: string, stage: Inquiry['stage']) {
    setItems((l) => l.map((i) => i.id === id ? { ...i, stage } : i))
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('institute_inquiries').update({ stage, handled_by: session!.user.id }).eq('id', id)
  }

  async function saveNote(id: string) {
    setItems((l) => l.map((i) => i.id === id ? { ...i, admin_notes: noteDraft.trim() || null } : i))
    setNoteEditing(null)
    await supabase.from('institute_inquiries').update({ admin_notes: noteDraft.trim() || null }).eq('id', id)
  }

  async function remove(i: Inquiry) {
    if (!confirm(`حذف استفسار "${i.full_name}" نهائياً؟`)) return
    setItems((l) => l.filter((x) => x.id !== i.id))
    await supabase.from('institute_inquiries').delete().eq('id', i.id)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* فلاتر المراحل */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilter('active')}
          className={`shrink-0 text-xs font-extrabold px-3.5 py-2 rounded-full border-2 transition ${filter === 'active' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
          قيد المتابعة ({items.filter((i) => i.stage !== 'closed' && i.stage !== 'enrolled').length})
        </button>
        {STAGES.map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`shrink-0 text-xs font-extrabold px-3.5 py-2 rounded-full border-2 transition ${filter === s.key ? 'text-white' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}
            style={filter === s.key ? { background: s.color, borderColor: s.color } : undefined}>
            {s.label} ({counts[s.key] ?? 0})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-sm text-ruwad-navy/50">
          لا استفسارات هنا. شارك رابط بوابتك ليصلك المهتمون مباشرة. 🎯
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((i) => {
            const stage = STAGES.find((s) => s.key === i.stage)!
            return (
              <div key={i.id} className="bg-white rounded-ruwad shadow-card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-ruwad-navy">{i.full_name}</p>
                      <span className="text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full" style={{ background: stage.color }}>{stage.label}</span>
                      <span className="text-[10px] font-bold text-ruwad-navy/40 flex items-center gap-1"><Clock size={10} /> {timeAgo(i.created_at)}</span>
                    </div>
                    {i.course?.title && (
                      <p className="text-[11px] font-bold text-ruwad-blue mt-1 flex items-center gap-1"><BookOpen size={11} /> {i.course.title}</p>
                    )}
                    {i.message && <p className="text-xs text-ruwad-navy/65 mt-1.5 leading-relaxed">{i.message}</p>}
                    {i.admin_notes && noteEditing !== i.id && (
                      <p className="text-[11px] font-bold text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-2 inline-block">📝 {i.admin_notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a href={`tel:${i.phone}`} title={i.phone}
                      className="w-9 h-9 rounded-full bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center hover:bg-ruwad-blue/20"><Phone size={15} /></a>
                    <a href={`https://wa.me/${i.phone.replace(/^0/, '963').replace(/\D/g, '')}`} target="_blank" title="واتساب"
                      className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100"><MessageCircle size={15} /></a>
                    <button onClick={() => { setNoteEditing(i.id); setNoteDraft(i.admin_notes ?? '') }} title="ملاحظة"
                      className="w-9 h-9 rounded-full bg-[#F5F6FA] text-ruwad-navy/50 flex items-center justify-center hover:bg-ruwad-gray/50"><StickyNote size={15} /></button>
                    <button onClick={() => remove(i)} title="حذف"
                      className="w-9 h-9 rounded-full text-ruwad-navy/25 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"><Trash2 size={15} /></button>
                  </div>
                </div>

                {noteEditing === i.id && (
                  <div className="flex gap-2">
                    <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} autoFocus
                      placeholder="ملاحظة داخلية (مثال: يفضّل الفترة المسائية)"
                      className="flex-1 border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3 py-2 text-xs font-semibold text-ruwad-navy outline-none" />
                    <button onClick={() => saveNote(i.id)} className="text-xs font-extrabold text-white bg-ruwad-blue rounded-ruwad-sm px-4">حفظ</button>
                  </div>
                )}

                {/* الانتقال بين المراحل */}
                <div className="flex gap-1.5 flex-wrap border-t border-ruwad-gray/40 pt-2.5">
                  {STAGES.filter((s) => s.key !== i.stage).map((s) => (
                    <button key={s.key} onClick={() => setStage(i.id, s.key)}
                      className="text-[11px] font-extrabold px-3 py-1.5 rounded-full border-2 transition hover:text-white"
                      style={{ borderColor: s.color, color: s.color }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = s.color; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = s.color }}>
                      → {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
