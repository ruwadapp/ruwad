'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Course } from '@/lib/types'
import { ShareCodeBlock } from '@/components/shared/ShareCodeBlock'

interface CourseFormProps {
  initialCourse?: Course
}

export function CourseForm({ initialCourse }: CourseFormProps) {
  const [title, setTitle] = useState(initialCourse?.title ?? '')
  const [description, setDescription] = useState(initialCourse?.description ?? '')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(
    (initialCourse?.status as 'draft' | 'published' | 'archived') ?? 'draft'
  )
  const [sequential, setSequential] = useState<boolean>(initialCourse?.sequential_learning ?? true)
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
        .update({ title, description, status, sequential_learning: sequential })
        .eq('id', initialCourse.id)

      if (updateError) {
        setError('حدث خطأ أثناء الحفظ، حاول مرة أخرى')
        setLoading(false)
        return
      }
      router.push(`/courses/${initialCourse.id}`)
      router.refresh()
      if (status === 'archived') {
        setTimeout(() => {
          document.getElementById('course-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 400)
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('courses')
        .insert({ trainer_id: user.id, title, description, status, sequential_learning: sequential })
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
    <form onSubmit={handleSave} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 w-full">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>
      )}

      {initialCourse && (
        <ShareCodeBlock
          code={initialCourse.course_code}
          title="كود الانضمام لهذا الكورس"
          description="شارك هذا الكود أو رمز QR أو الرابط مع طلابك ليطلبوا الالتحاق"
        />
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
        <div className="grid grid-cols-3 gap-3">
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
          <button
            type="button"
            onClick={() => setStatus('archived')}
            className={`rounded-ruwad-sm py-2.5 font-medium text-sm transition border-2 ${
              status === 'archived' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy border-ruwad-gray'
            }`}
          >
            🏁 إنهاء الكورس
          </button>
        </div>
        <p className="text-xs text-ruwad-navy/50">
          {status === 'archived'
            ? 'عند الحفظ ستنتقل مباشرة إلى ملخص الكورس النهائي أدناه — ترتيب الطلاب، الحضور، والنتائج.'
            : 'الكورس المنشور يظهر للطلاب ويمكنهم التسجيل فيه.'}
        </p>
      </div>

      <label className="flex items-center justify-between gap-3 border border-ruwad-gray/60 rounded-ruwad-sm px-4 py-3 cursor-pointer">
        <span>
          <span className="block text-sm font-bold text-ruwad-navy">التعلم المتسلسل 🗺️</span>
          <span className="block text-[11px] text-ruwad-navy/50 mt-0.5">الطالب يفتح محطات الرحلة بالترتيب — لا محاضرة قبل إتمام سابقتها</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={sequential}
          onClick={() => setSequential(!sequential)}
          className={`relative inline-flex items-center h-7 w-[52px] rounded-full transition-colors duration-300 shrink-0 ${sequential ? 'bg-ruwad-blue' : 'bg-ruwad-gray'}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${sequential ? 'right-[26px]' : 'right-1'}`} />
        </button>
      </label>

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
