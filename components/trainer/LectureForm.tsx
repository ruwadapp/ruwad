'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Lecture } from '@/lib/types'
import { RichTextEditor } from './RichTextEditor'
import { BarChart3, Plus, Trash2 } from 'lucide-react'

export function LectureForm({
  courseId,
  nextOrderIndex,
  initialLecture,
}: {
  courseId: string
  nextOrderIndex: number
  initialLecture?: Lecture
}) {
  const [title, setTitle] = useState(initialLecture?.title ?? '')
  const [description, setDescription] = useState(initialLecture?.description ?? '')
  const [videoUrl, setVideoUrl] = useState(initialLecture?.video_url ?? '')
  const [content, setContent] = useState(initialLecture?.content ?? '')
  const [durationMinutes, setDurationMinutes] = useState<string>(initialLecture?.duration_minutes?.toString() ?? '')
  const [stats, setStats] = useState<{ label: string; value: string }[]>(initialLecture?.stats ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function addStat() {
    setStats((prev) => [...prev, { label: '', value: '' }])
  }
  function updateStat(idx: number, field: 'label' | 'value', val: string) {
    setStats((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s)))
  }
  function removeStat(idx: number) {
    setStats((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('عنوان المحاضرة مطلوب')
      return
    }
    setLoading(true)
    setError(null)

    const cleanedStats = stats.filter((s) => s.label.trim() !== '')

    const payload = {
      title,
      description: description || null,
      video_url: videoUrl || null,
      content: content || null,
      duration_minutes: durationMinutes ? Number(durationMinutes) : null,
      stats: cleanedStats,
    }

    if (initialLecture) {
      const { error: updateError } = await supabase.from('lectures').update(payload).eq('id', initialLecture.id)
      if (updateError) { setError('حدث خطأ أثناء حفظ التعديلات'); setLoading(false); return }
      router.push(`/courses/${courseId}`)
      router.refresh()
      return
    }

    const { error: insertError } = await supabase.from('lectures').insert({
      course_id: courseId,
      ...payload,
      order_index: nextOrderIndex,
      is_published: true,
    })

    if (insertError) {
      setError('حدث خطأ أثناء حفظ المحاضرة، حاول مرة أخرى')
      setLoading(false)
      return
    }

    router.push(`/courses/${courseId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-ruwad-navy">عنوان المحاضرة</label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
          placeholder="مثال: مقدمة في HTML"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-ruwad-navy">وصف مختصر</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="videoUrl" className="text-sm font-medium text-ruwad-navy">رابط الفيديو (YouTube/Vimeo)</label>
          <input
            id="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
            placeholder="https://..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="duration" className="text-sm font-medium text-ruwad-navy">المدة (دقائق)</label>
          <input
            id="duration"
            type="number"
            min={0}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">محتوى المحاضرة</label>
        <RichTextEditor value={content} onChange={setContent} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ruwad-navy flex items-center gap-1.5">
            <BarChart3 size={16} className="text-ruwad-blue" /> إحصائيات المحاضرة (اختياري)
          </label>
          <button type="button" onClick={addStat} className="text-xs font-semibold text-ruwad-blue flex items-center gap-1">
            <Plus size={14} /> إضافة إحصائية
          </button>
        </div>
        <p className="text-xs text-ruwad-navy/50">مثال: "عدد الأسئلة: 12" أو "نسبة الإتمام المتوقعة: 90%" — تظهر كبطاقات بارزة للطالب.</p>
        {stats.map((s, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              value={s.label}
              onChange={(e) => updateStat(idx, 'label', e.target.value)}
              placeholder="التسمية"
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue"
            />
            <input
              value={s.value}
              onChange={(e) => updateStat(idx, 'value', e.target.value)}
              placeholder="القيمة"
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue"
            />
            <button type="button" onClick={() => removeStat(idx)} className="text-red-400 hover:bg-red-50 p-2 rounded-ruwad-sm transition">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-2 w-fit"
      >
        {loading ? 'جارٍ الحفظ...' : initialLecture ? 'حفظ التعديلات' : 'إضافة المحاضرة'}
      </button>
    </form>
  )
}
