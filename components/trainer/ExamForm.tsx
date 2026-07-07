'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Exam, Course } from '@/lib/types'
import { ShareCodeBlock } from '@/components/shared/ShareCodeBlock'

interface ExamFormProps {
  initialExam?: Exam
  courses: Course[]
}

export function ExamForm({ initialExam, courses }: ExamFormProps) {
  const [title, setTitle] = useState(initialExam?.title ?? '')
  const [description, setDescription] = useState(initialExam?.description ?? '')
  const [instructions, setInstructions] = useState(initialExam?.instructions ?? '')
  const [courseId, setCourseId] = useState(initialExam?.course_id ?? '')
  const [durationMinutes, setDurationMinutes] = useState<string>(
    initialExam?.duration_minutes?.toString() ?? ''
  )
  const [passingMarks, setPassingMarks] = useState<string>(
    initialExam?.passing_marks?.toString() ?? '50'
  )
  const [shuffleQuestions, setShuffleQuestions] = useState(initialExam?.shuffle_questions ?? false)
  const [showResults, setShowResults] = useState(initialExam?.show_results ?? true)
  const [allowReview, setAllowReview] = useState(initialExam?.allow_review ?? true)
  const [isActive, setIsActive] = useState(initialExam?.is_active ?? true)
  const [startsAt, setStartsAt] = useState(initialExam?.starts_at ? initialExam.starts_at.slice(0, 16) : '')
  const [endsAt, setEndsAt] = useState(initialExam?.ends_at ? initialExam.ends_at.slice(0, 16) : '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('عنوان الامتحان مطلوب')
      return
    }
    setLoading(true)
    setError(null)

    const payload = {
      title,
      description: description || null,
      instructions: instructions || null,
      course_id: courseId || null,
      duration_minutes: durationMinutes ? Number(durationMinutes) : null,
      passing_marks: Math.min(100, Math.max(0, Number(passingMarks) || 0)),
      shuffle_questions: shuffleQuestions,
      show_results: showResults,
      allow_review: allowReview,
      is_active: isActive,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (initialExam) {
      const { error: updateError } = await supabase.from('exams').update(payload).eq('id', initialExam.id)
      if (updateError) {
        setError('حدث خطأ أثناء الحفظ')
        setLoading(false)
        return
      }
      router.refresh()
      setLoading(false)
    } else {
      const { data, error: insertError } = await supabase
        .from('exams')
        .insert({ ...payload, trainer_id: user.id, total_marks: 0 })
        .select()
        .single()

      if (insertError || !data) {
        setError('حدث خطأ أثناء إنشاء الامتحان')
        setLoading(false)
        return
      }
      router.push(`/exams/${data.id}`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 max-w-2xl">
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

      {initialExam && (
        <ShareCodeBlock
          code={initialExam.exam_code}
          title="كود الانضمام لهذا الامتحان"
          description="شارك هذا الكود أو رمز QR أو الرابط مع طلابك للدخول مباشرة"
        />
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">عنوان الامتحان</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">الوصف</label>
        <textarea
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">تعليمات الامتحان</label>
        <textarea
          value={instructions ?? ''}
          onChange={(e) => setInstructions(e.target.value)}
          rows={2}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none"
          placeholder="مثال: يُمنع الخروج من الصفحة أثناء الامتحان"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">الكورس (اختياري)</label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition bg-white"
        >
          <option value="">بلا كورس محدد (امتحان عام)</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <p className="text-xs text-ruwad-navy/50">ربط الامتحان بكورس يتيح لك متابعة مستوى طلاب ذلك الكورس تحديداً.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">المدة (دقائق، اتركها فارغة لبلا حد)</label>
          <input
            type="number"
            min={0}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">نسبة النجاح المطلوبة (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={passingMarks}
            onChange={(e) => setPassingMarks(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
          />
          <p className="text-xs text-ruwad-navy/50">مثال: 50 تعني أن الطالب ينجح إذا حصل على 50% فأكثر من إجمالي علامات الامتحان، بغض النظر عن عدد الأسئلة.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">يبدأ في (اختياري)</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">ينتهي في (اختياري)</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
          />
        </div>
      </div>
      <p className="text-xs text-ruwad-navy/50 -mt-2">اتركهما فارغين ليبقى الامتحان متاحاً بلا قيود زمنية، أو حدّدهما لفرض نافذة زمنية حقيقية يُمنع الدخول خارجها.</p>

      <div className="flex flex-col gap-3 pt-2">
        {[
          { label: 'ترتيب الأسئلة عشوائياً', value: shuffleQuestions, set: setShuffleQuestions },
          { label: 'إظهار النتيجة للطالب مباشرة بعد التسليم', value: showResults, set: setShowResults },
          { label: 'السماح بمراجعة الإجابات', value: allowReview, set: setAllowReview },
          { label: 'الامتحان نشط (متاح للطلاب)', value: isActive, set: setIsActive },
        ].map((opt) => (
          <label key={opt.label} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-ruwad-navy">{opt.label}</span>
            <input
              type="checkbox"
              checked={opt.value}
              onChange={(e) => opt.set(e.target.checked)}
              className="w-5 h-5 accent-ruwad-blue"
            />
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-2 w-fit"
      >
        {loading ? 'جارٍ الحفظ...' : initialExam ? 'حفظ التعديلات' : 'إنشاء الامتحان'}
      </button>
    </form>
  )
}
