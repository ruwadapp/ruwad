'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Assignment, Course } from '@/lib/types'
import { RichTextEditor } from './RichTextEditor'
import { FileUploadZone, type UploadedFile } from '@/components/shared/FileUploadZone'
import { Paperclip, Calendar, Award, BookOpen } from 'lucide-react'

export function AssignmentForm({ courses, initialAssignment }: { courses: Course[]; initialAssignment?: Assignment }) {
  const [title, setTitle] = useState(initialAssignment?.title ?? '')
  const [description, setDescription] = useState(initialAssignment?.description ?? '')
  const [instructions, setInstructions] = useState(initialAssignment?.instructions ?? '')
  const [courseId, setCourseId] = useState(initialAssignment?.course_id ?? '')
  const [totalMarks, setTotalMarks] = useState(initialAssignment?.total_marks?.toString() ?? '100')
  const [dueDate, setDueDate] = useState(initialAssignment?.due_date ? initialAssignment.due_date.slice(0, 16) : '')
  const [attachments, setAttachments] = useState<UploadedFile[]>(
    (initialAssignment?.attachments as unknown as UploadedFile[]) ?? []
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('عنوان الواجب مطلوب'); return }
    setLoading(true)
    setError(null)

    const payload = {
      course_id: courseId || null,
      title,
      description: description || null,
      instructions: instructions || null,
      attachments,
      total_marks: Number(totalMarks) || 100,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    }

    if (initialAssignment) {
      const { error: updateError } = await supabase.from('assignments').update(payload).eq('id', initialAssignment.id)
      if (updateError) { setError('حدث خطأ أثناء الحفظ'); setLoading(false); return }
      router.refresh()
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: insertError } = await supabase
      .from('assignments')
      .insert({ ...payload, trainer_id: user.id, is_active: true })
      .select()
      .single()
    if (insertError || !data) { setError('حدث خطأ أثناء إنشاء الواجب'); setLoading(false); return }
    router.push(`/assignments/${data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-5 max-w-2xl">
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
        <RichTextEditor value={instructions} onChange={setInstructions} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy flex items-center gap-1.5">
          <Paperclip size={15} className="text-ruwad-blue" /> مرفقات الواجب (اختياري)
        </label>
        {initialAssignment ? (
          <FileUploadZone
            bucket="assignment-attachments"
            pathPrefix={initialAssignment.id}
            files={attachments}
            onChange={setAttachments}
            maxFiles={5}
          />
        ) : (
          <p className="text-xs text-ruwad-navy/50 bg-ruwad-gray/10 rounded-ruwad-sm px-4 py-3">
            يمكنك إضافة المرفقات بعد إنشاء الواجب مباشرة من صفحته.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy flex items-center gap-1.5">
            <BookOpen size={14} className="text-ruwad-blue" /> الكورس
          </label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-blue transition bg-white">
            <option value="">بلا كورس</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy flex items-center gap-1.5">
            <Award size={14} className="text-ruwad-blue" /> الدرجة الكاملة
          </label>
          <input type="number" min={1} value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-blue transition" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy flex items-center gap-1.5">
            <Calendar size={14} className="text-ruwad-blue" /> آخر موعد
          </label>
          <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-blue transition" />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-2 w-fit">
        {loading ? 'جارٍ الحفظ...' : initialAssignment ? 'حفظ التعديلات' : 'إنشاء الواجب'}
      </button>
    </form>
  )
}
