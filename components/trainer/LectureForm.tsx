'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Lecture } from '@/lib/types'

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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('عنوان المحاضرة مطلوب')
      return
    }
    setLoading(true)
    setError(null)

    const payload = {
      title,
      description: description || null,
      video_url: videoUrl || null,
      content: content || null,
      duration_minutes: durationMinutes ? Number(durationMinutes) : null,
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
        <label htmlFor="content" className="text-sm font-medium text-ruwad-navy">محتوى المحاضرة (نص/ملاحظات)</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none"
          placeholder="يمكنك كتابة ملخص أو محتوى المحاضرة هنا"
        />
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
