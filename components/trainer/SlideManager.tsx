'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PresentationSlide, SlideType } from '@/lib/types'
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, FileText, BarChart3, Vote, MessageCircle } from 'lucide-react'

const TYPE_LABELS: Record<SlideType, string> = {
  text: 'نص',
  stat: 'إحصائية',
  poll: 'تصويت (اختيار)',
  open_text: 'سؤال مفتوح',
}
const TYPE_ICONS: Record<SlideType, typeof FileText> = {
  text: FileText,
  stat: BarChart3,
  poll: Vote,
  open_text: MessageCircle,
}

export function SlideManager({ presentationId, slides }: { presentationId: string; slides: PresentationSlide[] }) {
  const [items, setItems] = useState(slides)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [slideType, setSlideType] = useState<SlideType>('text')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pollOptions, setPollOptions] = useState(['', '', '', ''])
  const [statRows, setStatRows] = useState([{ label: '', value: '' }, { label: '', value: '' }])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function resetForm() {
    setTitle(''); setBody(''); setPollOptions(['', '', '', ''])
    setStatRows([{ label: '', value: '' }, { label: '', value: '' }])
    setSlideType('text'); setFormOpen(false); setEditingId(null)
  }

  function startEdit(s: PresentationSlide) {
    setEditingId(s.id)
    setSlideType(s.slide_type)
    setTitle(s.title)
    setBody(s.body ?? '')
    if (s.slide_type === 'poll') {
      const texts = s.options.map((o) => o.text ?? '')
      setPollOptions([...texts, '', '', '', ''].slice(0, Math.max(4, texts.length)))
    } else if (s.slide_type === 'stat') {
      setStatRows(s.options.length ? s.options.map((o) => ({ label: o.label ?? '', value: String(o.value ?? '') })) : [{ label: '', value: '' }])
    }
    setFormOpen(true)
  }

  async function saveSlide(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('عنوان/نص الشريحة مطلوب'); return }

    let options: { id?: string; text?: string; label?: string; value?: number }[] = []
    if (slideType === 'poll') {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F']
      options = pollOptions.map((t, i) => ({ id: letters[i], text: t })).filter((o) => o.text!.trim() !== '')
      if (options.length < 2) { setError('أضف خيارين على الأقل'); return }
    } else if (slideType === 'stat') {
      options = statRows
        .filter((r) => r.label.trim() !== '')
        .map((r) => ({ label: r.label, value: Number(r.value) || 0 }))
      if (options.length === 0) { setError('أضف عنصراً واحداً على الأقل'); return }
    }

    setLoading(true)
    setError(null)

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from('presentation_slides')
        .update({ slide_type: slideType, title, body: body || null, options })
        .eq('id', editingId)
        .select()
        .single()
      if (updateError || !data) { setError('حدث خطأ أثناء الحفظ'); setLoading(false); return }
      setItems((prev) => prev.map((s) => (s.id === editingId ? data : s)))
      resetForm(); setLoading(false); router.refresh()
      return
    }

    const { data, error: insertError } = await supabase
      .from('presentation_slides')
      .insert({ presentation_id: presentationId, slide_type: slideType, title, body: body || null, options, order_index: items.length })
      .select()
      .single()
    if (insertError || !data) { setError('حدث خطأ أثناء الحفظ'); setLoading(false); return }
    setItems((prev) => [...prev, data])
    resetForm(); setLoading(false); router.refresh()
  }

  async function deleteSlide(id: string) {
    if (!confirm('حذف هذه الشريحة نهائياً؟')) return
    const { error: delError } = await supabase.from('presentation_slides').delete().eq('id', id)
    if (!delError) {
      setItems((prev) => prev.filter((s) => s.id !== id))
      router.refresh()
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    await Promise.all(next.map((s, i) => supabase.from('presentation_slides').update({ order_index: i }).eq('id', s.id)))
    router.refresh()
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ruwad-navy">الشرائح ({items.length})</h2>
        {!formOpen && (
          <button onClick={() => setFormOpen(true)} className="bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition flex items-center gap-1.5">
            <Plus size={16} /> شريحة جديدة
          </button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={saveSlide} className="flex flex-col gap-3 border border-ruwad-gray/60 rounded-ruwad-sm p-4 mb-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-3 py-2">{error}</div>}

          <select value={slideType} onChange={(e) => setSlideType(e.target.value as SlideType)}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue">
            {Object.entries(TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>

          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={slideType === 'text' ? 'عنوان الشريحة' : slideType === 'stat' ? 'عنوان الإحصائية' : 'نص السؤال'}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue"
          />

          {slideType === 'text' && (
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="محتوى الشريحة"
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue resize-none" />
          )}

          {slideType === 'poll' && (
            <div className="flex flex-col gap-2">
              {pollOptions.map((opt, idx) => (
                <input key={idx} value={opt} onChange={(e) => { const n = [...pollOptions]; n[idx] = e.target.value; setPollOptions(n) }}
                  placeholder={`خيار ${idx + 1}`} className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue text-sm" />
              ))}
              <button type="button" onClick={() => setPollOptions((p) => [...p, ''])} className="text-xs text-ruwad-blue font-semibold w-fit">+ خيار آخر</button>
            </div>
          )}

          {slideType === 'stat' && (
            <div className="flex flex-col gap-2">
              {statRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2">
                  <input value={row.label} onChange={(e) => { const n = [...statRows]; n[idx] = { ...n[idx], label: e.target.value }; setStatRows(n) }}
                    placeholder="التسمية (مثال: نسبة الحضور)" className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue text-sm" />
                  <input type="number" value={row.value} onChange={(e) => { const n = [...statRows]; n[idx] = { ...n[idx], value: e.target.value }; setStatRows(n) }}
                    placeholder="القيمة" className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue text-sm" />
                </div>
              ))}
              <button type="button" onClick={() => setStatRows((p) => [...p, { label: '', value: '' }])} className="text-xs text-ruwad-blue font-semibold w-fit">+ عنصر آخر</button>
            </div>
          )}

          {slideType === 'open_text' && (
            <p className="text-xs text-ruwad-navy/50">سيكتب الطلاب إجاباتهم النصية بحرية، وستظهر إجاباتهم لحظياً وهي تُكتب.</p>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-ruwad-blue text-white px-5 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
              {loading ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة الشريحة'}
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2 rounded-ruwad-sm text-sm font-semibold text-ruwad-navy/60 hover:bg-ruwad-gray/30 transition">إلغاء</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد شرائح بعد.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((s, idx) => {
            const Icon = TYPE_ICONS[s.slide_type]
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60">
                <div className="flex flex-col">
                  <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="text-ruwad-navy/40 disabled:opacity-20"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="text-ruwad-navy/40 disabled:opacity-20"><ArrowDown size={14} /></button>
                </div>
                <span className="w-7 h-7 rounded-full bg-ruwad-gray/40 text-ruwad-navy text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                <Icon size={18} className="text-ruwad-blue shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ruwad-navy truncate">{s.title}</p>
                  <p className="text-xs text-ruwad-navy/50">{TYPE_LABELS[s.slide_type]}</p>
                </div>
                <button onClick={() => startEdit(s)} aria-label="تعديل" className="text-ruwad-blue hover:bg-ruwad-blue/10 p-2 rounded-ruwad-sm transition shrink-0"><Pencil size={16} /></button>
                <button onClick={() => deleteSlide(s.id)} aria-label="حذف" className="text-red-500 hover:bg-red-50 p-2 rounded-ruwad-sm transition shrink-0"><Trash2 size={16} /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
