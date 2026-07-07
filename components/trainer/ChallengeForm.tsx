'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Challenge, Course } from '@/lib/types'
import { Copy, Check, Zap } from 'lucide-react'

const TYPE_LABELS = {
  quiz: 'اختبار سريع',
  coding: 'تحدي برمجي',
  upload: 'رفع ملف',
  practical: 'تطبيقي',
}

export function ChallengeForm({ initialChallenge, courses }: { initialChallenge?: Challenge; courses: Course[] }) {
  const [title, setTitle] = useState(initialChallenge?.title ?? '')
  const [description, setDescription] = useState(initialChallenge?.description ?? '')
  const [instructions, setInstructions] = useState(initialChallenge?.instructions ?? '')
  const [challengeType, setChallengeType] = useState(initialChallenge?.challenge_type ?? 'quiz')
  const [courseId, setCourseId] = useState(initialChallenge?.course_id ?? '')
  const [timeLimit, setTimeLimit] = useState(initialChallenge?.time_limit_minutes?.toString() ?? '')
  const [isActive, setIsActive] = useState(initialChallenge?.is_active ?? true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('عنوان التحدي مطلوب'); return }
    setLoading(true)
    setError(null)

    const payload = {
      title,
      description: description || null,
      instructions: instructions || null,
      challenge_type: challengeType,
      course_id: courseId || null,
      time_limit_minutes: timeLimit ? Number(timeLimit) : null,
      is_active: isActive,
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (initialChallenge) {
      const { error: updateError } = await supabase.from('challenges').update(payload).eq('id', initialChallenge.id)
      if (updateError) { setError('حدث خطأ أثناء الحفظ'); setLoading(false); return }
      router.refresh()
      setLoading(false)
    } else {
      const { data, error: insertError } = await supabase
        .from('challenges')
        .insert({ ...payload, trainer_id: user.id, total_marks: 0 })
        .select()
        .single()
      if (insertError || !data) { setError('حدث خطأ أثناء إنشاء التحدي'); setLoading(false); return }
      router.push(`/challenges/${data.id}`)
      router.refresh()
    }
  }

  function copyLink() {
    if (!initialChallenge) return
    navigator.clipboard.writeText(`${window.location.origin}/my-challenges/${initialChallenge.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 max-w-2xl border-t-4 border-ruwad-lime">
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

      {initialChallenge && (
        <div className="flex items-center justify-between bg-ruwad-lime/20 rounded-ruwad-sm px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-ruwad-navy" />
            <p className="text-sm font-medium text-ruwad-navy">رابط التحدي للطلاب: /my-challenges/{initialChallenge.id}</p>
          </div>
          <button type="button" onClick={copyLink} className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-navy">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'تم النسخ' : 'نسخ'}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">عنوان التحدي</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-lime transition" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">الوصف</label>
        <textarea value={description ?? ''} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-lime transition resize-none" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">تعليمات التحدي</label>
        <textarea value={instructions ?? ''} onChange={(e) => setInstructions(e.target.value)} rows={2}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-lime transition resize-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">نوع التحدي</label>
          <select value={challengeType} onChange={(e) => setChallengeType(e.target.value as Challenge['challenge_type'])}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-lime transition bg-white">
            {Object.entries(TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
          <p className="text-xs text-ruwad-navy/50">
            {challengeType === 'quiz' && 'أسئلة اختيار من متعدد بجلسة مباشرة وترتيب فوري (Kahoot-style).'}
            {challengeType === 'coding' && 'يكتب الطالب كوداً في مربع نص وتُصحَّح يدوياً من قبلك.'}
            {challengeType === 'upload' && 'يرفع الطالب ملفاً (صورة/مستند/مشروع) وتُصحَّح يدوياً من قبلك.'}
            {challengeType === 'practical' && 'يكتب الطالب وصفاً لما أنجزه عملياً وتُصحَّح يدوياً من قبلك.'}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">الوقت المحدد (دقائق، اختياري)</label>
          <input type="number" min={0} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-lime transition" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">الكورس (اختياري)</label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-lime transition bg-white">
          <option value="">بلا كورس محدد</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <label className="flex items-center justify-between cursor-pointer pt-2">
        <span className="text-sm text-ruwad-navy">التحدي نشط (متاح للطلاب)</span>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-5 h-5 accent-ruwad-lime" />
      </label>

      <button type="submit" disabled={loading}
        className="bg-ruwad-lime text-ruwad-navy px-6 py-3 rounded-ruwad-sm font-bold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-2 w-fit flex items-center gap-2">
        <Zap size={18} />
        {loading ? 'جارٍ الحفظ...' : initialChallenge ? 'حفظ التعديلات' : 'إنشاء التحدي'}
      </button>
    </form>
  )
}
