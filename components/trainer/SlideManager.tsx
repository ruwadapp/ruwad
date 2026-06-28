'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PresentationSlide, SlideType } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import {
  Plus, Trash2, Pencil, Copy, GripVertical, X as XIcon, Check, Sparkles,
  FileText, BarChart3, Vote, MessageCircle, Layers, Eye, ArrowRight,
} from 'lucide-react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type SlideOption = { id?: string; text?: string; label?: string; value?: number }

const TYPE_META: Record<SlideType, {
  label: string
  short: string
  hint: string
  icon: typeof FileText
  solid: string   // خلفية أيقونة صلبة
  text: string    // لون النص على الخلفية الصلبة
  soft: string    // خلفية + نص فاتحان (للقوائم)
  ring: string
}> = {
  text: {
    label: 'شريحة نصية', short: 'نص',
    hint: 'فكرة أو عنوان تعرضه على الشاشة بدون تفاعل من الطلاب',
    icon: FileText,
    solid: 'bg-ruwad-blue', text: 'text-white',
    soft: 'bg-ruwad-blue/10 text-ruwad-blue', ring: 'ring-ruwad-blue',
  },
  stat: {
    label: 'إحصائية', short: 'إحصائية',
    hint: 'رقم كبير أو مخطط أعمدة تعرضه مباشرة',
    icon: BarChart3,
    solid: 'bg-ruwad-navy', text: 'text-white',
    soft: 'bg-ruwad-navy/10 text-ruwad-navy', ring: 'ring-ruwad-navy',
  },
  poll: {
    label: 'تصويت', short: 'تصويت',
    hint: 'يختار الطلاب إجابة واحدة وتظهر النتائج كنسب لحظياً',
    icon: Vote,
    solid: 'bg-ruwad-blue-light', text: 'text-white',
    soft: 'bg-ruwad-blue-light/10 text-ruwad-blue-light', ring: 'ring-ruwad-blue-light',
  },
  open_text: {
    label: 'سؤال مفتوح', short: 'سؤال مفتوح',
    hint: 'يكتب الطلاب إجاباتهم بحرية وتظهر على الشاشة وهي تُكتب',
    icon: MessageCircle,
    solid: 'bg-ruwad-lime', text: 'text-ruwad-navy',
    soft: 'bg-ruwad-lime/20 text-ruwad-navy', ring: 'ring-ruwad-lime',
  },
}

const TYPE_ORDER: SlideType[] = ['text', 'stat', 'poll', 'open_text']

function emptyDraft(type: SlideType) {
  return {
    slideType: type,
    title: '',
    body: '',
    pollOptions: ['', '', '', ''],
    statRows: [{ label: '', value: '' }, { label: '', value: '' }],
  }
}

export function SlideManager({ presentationId, slides }: { presentationId: string; slides: PresentationSlide[] }) {
  const [items, setItems] = useState(slides)
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState(emptyDraft('text'))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const editorRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const counts = useMemo(() => {
    const c: Record<SlideType, number> = { text: 0, stat: 0, poll: 0, open_text: 0 }
    items.forEach((s) => { c[s.slide_type]++ })
    return c
  }, [items])

  function scrollToEditorOnMobile() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }

  function openNew(type: SlideType = 'text') {
    setDraft(emptyDraft(type))
    setError(null)
    setSelectedId('new')
    scrollToEditorOnMobile()
  }

  function openEdit(s: PresentationSlide) {
    setDraft({
      slideType: s.slide_type,
      title: s.title,
      body: s.body ?? '',
      pollOptions: s.slide_type === 'poll'
        ? [...s.options.map((o) => o.text ?? ''), '', '', '', ''].slice(0, Math.max(4, s.options.length))
        : ['', '', '', ''],
      statRows: s.slide_type === 'stat'
        ? (s.options.length ? s.options.map((o) => ({ label: o.label ?? '', value: String(o.value ?? '') })) : [{ label: '', value: '' }])
        : [{ label: '', value: '' }, { label: '', value: '' }],
    })
    setError(null)
    setSelectedId(s.id)
    scrollToEditorOnMobile()
  }

  function closeEditor() {
    setSelectedId(null)
    setError(null)
  }

  function setType(type: SlideType) {
    setDraft((d) => ({ ...d, slideType: type }))
  }

  async function saveSlide(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.title.trim()) { setError('عنوان/نص الشريحة مطلوب'); return }

    let options: SlideOption[] = []
    if (draft.slideType === 'poll') {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
      options = draft.pollOptions.map((t, i) => ({ id: letters[i], text: t })).filter((o) => (o.text ?? '').trim() !== '')
      if (options.length < 2) { setError('أضف خيارين على الأقل'); return }
    } else if (draft.slideType === 'stat') {
      options = draft.statRows
        .filter((r) => r.label.trim() !== '')
        .map((r) => ({ label: r.label, value: Number(r.value) || 0 }))
      if (options.length === 0) { setError('أضف عنصراً واحداً على الأقل'); return }
    }

    setLoading(true)
    setError(null)

    if (selectedId && selectedId !== 'new') {
      const { data, error: updateError } = await supabase
        .from('presentation_slides')
        .update({ slide_type: draft.slideType, title: draft.title, body: draft.body || null, options })
        .eq('id', selectedId)
        .select()
        .single()
      if (updateError || !data) { setError('حدث خطأ أثناء الحفظ'); setLoading(false); return }
      setItems((prev) => prev.map((s) => (s.id === selectedId ? data : s)))
      setLoading(false)
      flashSaved()
      router.refresh()
      return
    }

    const { data, error: insertError } = await supabase
      .from('presentation_slides')
      .insert({ presentation_id: presentationId, slide_type: draft.slideType, title: draft.title, body: draft.body || null, options, order_index: items.length })
      .select()
      .single()
    if (insertError || !data) { setError('حدث خطأ أثناء الحفظ'); setLoading(false); return }
    setItems((prev) => [...prev, data])
    setSelectedId(data.id)
    setLoading(false)
    flashSaved()
    router.refresh()
  }

  function flashSaved() {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  async function deleteSlide(id: string) {
    if (!confirm('حذف هذه الشريحة نهائياً؟')) return
    const { error: delError } = await supabase.from('presentation_slides').delete().eq('id', id)
    if (!delError) {
      setItems((prev) => prev.filter((s) => s.id !== id))
      if (selectedId === id) setSelectedId(null)
      router.refresh()
    }
  }

  async function duplicateSlide(s: PresentationSlide) {
    const { data, error: insertError } = await supabase
      .from('presentation_slides')
      .insert({
        presentation_id: presentationId,
        slide_type: s.slide_type,
        title: `${s.title} (نسخة)`,
        body: s.body,
        options: s.options,
        order_index: items.length,
      })
      .select()
      .single()
    if (!insertError && data) {
      setItems((prev) => [...prev, data])
      router.refresh()
    }
  }

  async function persistOrder(next: PresentationSlide[]) {
    setItems(next)
    await Promise.all(next.map((s, i) => supabase.from('presentation_slides').update({ order_index: i }).eq('id', s.id)))
    router.refresh()
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((s) => s.id === active.id)
    const newIndex = items.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    persistOrder(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <div className="flex flex-col gap-5">
      {/* بطاقة إحصاء سريعة بنمط Hero */}
      <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-6 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/15 rounded-ruwad-sm p-3"><Layers size={22} /></div>
          <div>
            <p className="text-sm opacity-80">إجمالي الشرائح</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {TYPE_ORDER.map((t) => {
            const meta = TYPE_META[t]
            const Icon = meta.icon
            return (
              <span key={t} className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 text-xs font-semibold">
                <Icon size={13} /> {meta.short} · {counts[t]}
              </span>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 items-start">
        {/* قائمة الشرائح القابلة للسحب */}
        <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ruwad-navy">الشرائح</h2>
            <button
              onClick={() => openNew('text')}
              className="bg-ruwad-blue text-white px-3.5 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition flex items-center gap-1.5"
            >
              <Plus size={15} /> شريحة جديدة
            </button>
          </div>

          {items.length === 0 ? (
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <Sparkles className="text-ruwad-navy/25" size={32} />
              <p className="text-ruwad-navy/50 text-sm">لا توجد شرائح بعد. اختر نوعاً لتبدأ:</p>
              <div className="grid grid-cols-2 gap-2 w-full">
                {TYPE_ORDER.map((t) => {
                  const meta = TYPE_META[t]
                  const Icon = meta.icon
                  return (
                    <button key={t} onClick={() => openNew(t)}
                      className={`flex flex-col items-center gap-1.5 rounded-ruwad-sm p-3 ${meta.soft} hover:opacity-80 transition text-xs font-semibold`}>
                      <Icon size={18} />
                      {meta.short}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {items.map((s, idx) => (
                    <SortableSlideRow
                      key={s.id}
                      slide={s}
                      index={idx}
                      selected={selectedId === s.id}
                      onSelect={() => openEdit(s)}
                      onDuplicate={() => duplicateSlide(s)}
                      onDelete={() => deleteSlide(s.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* لوحة التحرير + المعاينة المباشرة */}
        <div ref={editorRef} className="flex flex-col gap-4">
          {selectedId === null ? (
            <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-3 text-center min-h-[280px] justify-center">
              <Eye className="text-ruwad-navy/25" size={36} />
              <p className="text-ruwad-navy/50 text-sm max-w-xs">
                اختر شريحة من القائمة لتعديلها، أو أنشئ شريحة جديدة لمعاينتها هنا تماماً كما سيراها الطلاب.
              </p>
            </div>
          ) : (
            <>
              {/* المعاينة الحيّة */}
              <div className="bg-ruwad-navy rounded-ruwad shadow-card overflow-hidden">
                <div className="px-5 py-2.5 flex items-center justify-between bg-white/5">
                  <span className="text-white/60 text-xs font-semibold flex items-center gap-1.5"><Eye size={13} /> معاينة مباشرة — كما يراها الطلاب</span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TYPE_META[draft.slideType].soft}`}>{TYPE_META[draft.slideType].label}</span>
                </div>
                <div className="p-6">
                  <SlidePreview type={draft.slideType} title={draft.title} body={draft.body} pollOptions={draft.pollOptions} statRows={draft.statRows} />
                </div>
              </div>

              {/* نموذج التحرير */}
              <form onSubmit={saveSlide} className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-4">
                {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-3 py-2">{error}</div>}

                <div>
                  <p className="text-xs font-semibold text-ruwad-navy/50 mb-2">نوع الشريحة</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TYPE_ORDER.map((t) => {
                      const meta = TYPE_META[t]
                      const Icon = meta.icon
                      const active = draft.slideType === t
                      return (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setType(t)}
                          title={meta.hint}
                          className={`flex flex-col items-center gap-1.5 rounded-ruwad-sm p-3 text-xs font-semibold transition ring-2 ${
                            active ? `${meta.solid} ${meta.text} ${meta.ring}` : `${meta.soft} ring-transparent hover:ring-1`
                          }`}
                        >
                          <Icon size={18} />
                          {meta.short}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-ruwad-navy/40 mt-2">{TYPE_META[draft.slideType].hint}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ruwad-navy">
                    {draft.slideType === 'text' ? 'عنوان الشريحة' : draft.slideType === 'stat' ? 'عنوان الإحصائية' : 'نص السؤال'}
                  </label>
                  <input
                    required
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue transition"
                  />
                </div>

                {draft.slideType === 'text' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ruwad-navy">محتوى الشريحة</label>
                    <textarea
                      value={draft.body}
                      onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                      rows={5}
                      placeholder="اكتب الفكرة أو النص الذي تريد عرضه..."
                      className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue transition resize-none"
                    />
                  </div>
                )}

                {draft.slideType === 'poll' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-ruwad-navy">الخيارات</label>
                    {draft.pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 shrink-0 rounded-full bg-ruwad-blue-light/15 text-ruwad-blue-light text-xs font-bold flex items-center justify-center">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          value={opt}
                          onChange={(e) => {
                            const n = [...draft.pollOptions]; n[idx] = e.target.value
                            setDraft((d) => ({ ...d, pollOptions: n }))
                          }}
                          placeholder={`خيار ${idx + 1}`}
                          className="flex-1 border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue text-sm transition"
                        />
                        {draft.pollOptions.length > 2 && (
                          <button type="button" aria-label="حذف الخيار"
                            onClick={() => setDraft((d) => ({ ...d, pollOptions: d.pollOptions.filter((_, i) => i !== idx) }))}
                            className="text-ruwad-navy/30 hover:text-red-500 transition p-1">
                            <XIcon size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setDraft((d) => ({ ...d, pollOptions: [...d.pollOptions, ''] }))}
                      className="text-xs text-ruwad-blue font-semibold w-fit flex items-center gap-1 mt-1">
                      <Plus size={13} /> خيار آخر
                    </button>
                  </div>
                )}

                {draft.slideType === 'stat' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-ruwad-navy">عناصر الإحصائية</label>
                    {draft.statRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <input
                          value={row.label}
                          onChange={(e) => {
                            const n = [...draft.statRows]; n[idx] = { ...n[idx], label: e.target.value }
                            setDraft((d) => ({ ...d, statRows: n }))
                          }}
                          placeholder="التسمية (مثال: نسبة الحضور)"
                          className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue text-sm transition"
                        />
                        <input
                          type="number"
                          value={row.value}
                          onChange={(e) => {
                            const n = [...draft.statRows]; n[idx] = { ...n[idx], value: e.target.value }
                            setDraft((d) => ({ ...d, statRows: n }))
                          }}
                          placeholder="القيمة"
                          className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue text-sm transition"
                        />
                        {draft.statRows.length > 1 && (
                          <button type="button" aria-label="حذف العنصر"
                            onClick={() => setDraft((d) => ({ ...d, statRows: d.statRows.filter((_, i) => i !== idx) }))}
                            className="text-ruwad-navy/30 hover:text-red-500 transition p-1">
                            <XIcon size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setDraft((d) => ({ ...d, statRows: [...d.statRows, { label: '', value: '' }] }))}
                      className="text-xs text-ruwad-blue font-semibold w-fit flex items-center gap-1 mt-1">
                      <Plus size={13} /> عنصر آخر
                    </button>
                    <p className="text-xs text-ruwad-navy/40">عنصر واحد فقط يُعرض كرقم كبير، وأكثر من عنصر يُعرض كمخطط أعمدة.</p>
                  </div>
                )}

                {draft.slideType === 'open_text' && (
                  <p className="text-xs text-ruwad-navy/50 bg-ruwad-lime/10 rounded-ruwad-sm px-3 py-2.5">
                    سيكتب الطلاب إجاباتهم النصية بحرية، وستظهر إجاباتهم لحظياً وهي تُكتب — لا حاجة لإضافة خيارات.
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button type="submit" disabled={loading} className="bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5">
                    {loading ? 'جارٍ الحفظ...' : savedFlash ? <><Check size={15} /> تم الحفظ</> : selectedId === 'new' ? 'إضافة الشريحة' : 'حفظ التعديلات'}
                  </button>
                  <button type="button" onClick={closeEditor} className="px-5 py-2.5 rounded-ruwad-sm text-sm font-semibold text-ruwad-navy/60 hover:bg-ruwad-gray/30 transition flex items-center gap-1.5">
                    <ArrowRight size={15} /> رجوع للقائمة
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SortableSlideRow({
  slide, index, selected, onSelect, onDuplicate, onDelete,
}: {
  slide: PresentationSlide
  index: number
  selected: boolean
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id })
  const meta = TYPE_META[slide.slide_type]
  const Icon = meta.icon

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const subtitle = slide.slide_type === 'poll'
    ? `${slide.options.length} خيارات`
    : slide.slide_type === 'stat'
    ? `${slide.options.length} عنصر`
    : slide.slide_type === 'open_text'
    ? 'سؤال مفتوح'
    : (slide.body?.slice(0, 32) || 'بلا محتوى')

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-2 p-2.5 rounded-ruwad-sm border cursor-pointer transition ${
        selected ? 'border-ruwad-blue bg-ruwad-blue/5' : 'border-ruwad-gray/60 hover:border-ruwad-blue/40'
      }`}
    >
      <button
        type="button"
        aria-label="سحب لإعادة الترتيب"
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
        className="text-ruwad-navy/30 hover:text-ruwad-navy/60 cursor-grab active:cursor-grabbing shrink-0 touch-none"
      >
        <GripVertical size={16} />
      </button>
      <span className="w-6 h-6 rounded-full bg-ruwad-gray/40 text-ruwad-navy text-[11px] font-bold flex items-center justify-center shrink-0">{index + 1}</span>
      <span className={`w-8 h-8 rounded-ruwad-sm flex items-center justify-center shrink-0 ${meta.solid} ${meta.text}`}>
        <Icon size={15} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ruwad-navy text-sm truncate">{slide.title}</p>
        <p className="text-xs text-ruwad-navy/45 truncate">{subtitle}</p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDuplicate() }} aria-label="تكرار" title="تكرار الشريحة" className="text-ruwad-navy/40 hover:bg-ruwad-gray/30 p-1.5 rounded-ruwad-sm transition shrink-0">
        <Copy size={14} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); onSelect() }} aria-label="تعديل" title="تعديل" className="text-ruwad-blue hover:bg-ruwad-blue/10 p-1.5 rounded-ruwad-sm transition shrink-0">
        <Pencil size={14} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); onDelete() }} aria-label="حذف" title="حذف" className="text-red-500 hover:bg-red-50 p-1.5 rounded-ruwad-sm transition shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function SlidePreview({
  type, title, body, pollOptions, statRows,
}: {
  type: SlideType
  title: string
  body: string
  pollOptions: string[]
  statRows: { label: string; value: string }[]
}) {
  const filledPoll = pollOptions.filter((o) => o.trim() !== '')
  const filledStats = statRows.filter((r) => r.label.trim() !== '')

  return (
    <div className="bg-white rounded-ruwad-sm p-6 min-h-[220px] flex flex-col gap-4">
      <h2 className="text-xl font-bold text-ruwad-navy">{title || 'عنوان الشريحة...'}</h2>

      {type === 'text' && (
        <p className="text-ruwad-navy/80 leading-relaxed whitespace-pre-wrap">{body || 'سيظهر محتوى الشريحة هنا...'}</p>
      )}

      {type === 'stat' && (
        filledStats.length === 0 ? (
          <p className="text-ruwad-navy/30 text-sm py-6 text-center">أضف عنصراً واحداً على الأقل لمعاينة الإحصائية</p>
        ) : filledStats.length === 1 ? (
          <p className="text-5xl font-bold text-ruwad-blue text-center py-6">{filledStats[0].value || 0}</p>
        ) : (
          <div className="h-52" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filledStats.map((r) => ({ label: r.label, value: Number(r.value) || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3A4EFB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      )}

      {type === 'poll' && (
        filledPoll.length === 0 ? (
          <p className="text-ruwad-navy/30 text-sm py-6 text-center">أضف خيارين على الأقل لمعاينة التصويت</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filledPoll.map((opt, i) => (
              <div key={i} className="flex items-center gap-3 border border-ruwad-gray/60 rounded-ruwad-sm px-4 py-3">
                <span className="w-6 h-6 rounded-full bg-ruwad-blue-light/15 text-ruwad-blue-light text-xs font-bold flex items-center justify-center shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-ruwad-navy font-medium text-sm">{opt}</span>
              </div>
            ))}
            <p className="text-xs text-ruwad-navy/35 mt-1">ستظهر نتائج التصويت هنا كنسب لحظية أثناء العرض المباشر</p>
          </div>
        )
      )}

      {type === 'open_text' && (
        <div className="flex flex-col gap-2.5">
          <div className="border border-dashed border-ruwad-gray rounded-ruwad-sm px-4 py-3 text-ruwad-navy/30 text-sm">
            ستظهر إجابات الطلاب هنا فور كتابتها...
          </div>
          <p className="text-xs text-ruwad-navy/35">سؤال مفتوح بدون خيارات محددة</p>
        </div>
      )}
    </div>
  )
}
