'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Course } from '@/lib/types'

export function AssignmentForm({ courses }: { courses: Course[] }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [courseId, setCourseId] = useState('')
  const [totalMarks, setTotalMarks] = useState('100')
  const [dueDate, setDueDate] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('عنوان الواجب مطلوب'); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const attachments = attachmentUrl ? [{ name: 'مرفق', url: attachmentUrl }] : []

    const { error: insertError } = await supabase.from('assignments').insert({
      trainer_id: user.id,
      course_id: courseId || null,
      title,
      description: description || null,
      instructions: instructions || null,
      attachments,
      total_marks: Number(totalMarks) || 100,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      is_active: true,
    })

    if (insertError) { setError('حدث خطأ أثناء إنشاء الواجب'); setLoading(false); return }
    router.push('/assignments')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 max-w-2xl">
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">عنوان الواجب</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">الوصف</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">تعليمات الحل</label>
        <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">مرفق (رابط، اختياري)</label>
        <input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="https://..."
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">الكورس (اختياري)</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-blue transition bg-white">
            <option value="">بلا كورس</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">الدرجة الكاملة</label>
          <input type="number" min={1} value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-blue transition" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">آخر موعد للتسليم</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-blue transition" />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-2 w-fit">
        {loading ? 'جارٍ الإنشاء...' : 'إنشاء الواجب'}
      </button>
    </form>
  )
}
