'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Course } from '@/lib/types'

interface CourseFormProps {
  initialCourse?: Course
}

export function CourseForm({ initialCourse }: CourseFormProps) {
  const [title, setTitle] = useState(initialCourse?.title ?? '')
  const [description, setDescription] = useState(initialCourse?.description ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>(
    (initialCourse?.status as 'draft' | 'published') ?? 'draft'
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('عنوان الكورس مطلوب')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (initialCourse) {
      const { error: updateError } = await supabase
        .from('courses')
        .update({ title, description, status })
        .eq('id', initialCourse.id)

      if (updateError) {
        setError('حدث خطأ أثناء الحفظ، حاول مرة أخرى')
        setLoading(false)
        return
      }
      router.push(`/courses/${initialCourse.id}`)
      router.refresh()
    } else {
      const { data, error: insertError } = await supabase
        .from('courses')
        .insert({ trainer_id: user.id, title, description, status })
        .select()
        .single()

      if (insertError || !data) {
        setError('حدث خطأ أثناء إنشاء الكورس، حاول مرة أخرى')
        setLoading(false)
        return
      }
      router.push(`/courses/${data.id}`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>
      )}

      {initialCourse && (
        <div className="flex items-center justify-between bg-ruwad-blue/5 rounded-ruwad-sm px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ruwad-navy">كود الانضمام لهذا الكورس</p>
            <p className="text-xs text-ruwad-navy/50">شارك هذا الكود مع طلابك ليطلبوا الالتحاق</p>
          </div>
          <p className="text-2xl font-mono font-bold text-ruwad-blue tracking-widest">{initialCourse.course_code}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-ruwad-navy">عنوان الكورس</label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
          placeholder="مثال: أساسيات تطوير الويب"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-ruwad-navy">الوصف</label>
        <textarea
          id="description"
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none"
          placeholder="وصف مختصر لمحتوى الكورس وأهدافه"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">الحالة</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStatus('draft')}
            className={`rounded-ruwad-sm py-2.5 font-medium text-sm transition border-2 ${
              status === 'draft' ? 'bg-ruwad-blue text-white border-ruwad-blue' : 'bg-white text-ruwad-navy border-ruwad-gray'
            }`}
          >
            مسودة
          </button>
          <button
            type="button"
            onClick={() => setStatus('published')}
            className={`rounded-ruwad-sm py-2.5 font-medium text-sm transition border-2 ${
              status === 'published' ? 'bg-ruwad-blue text-white border-ruwad-blue' : 'bg-white text-ruwad-navy border-ruwad-gray'
            }`}
          >
            منشور
          </button>
        </div>
        <p className="text-xs text-ruwad-navy/50">الكورس المنشور يظهر للطلاب ويمكنهم التسجيل فيه.</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-2 w-fit"
      >
        {loading ? 'جارٍ الحفظ...' : initialCourse ? 'حفظ التعديلات' : 'إنشاء الكورس'}
      </button>
    </form>
  )
}
