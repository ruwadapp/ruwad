'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, Clock, CheckCircle2 } from 'lucide-react'

export function CourseCodeJoin() {
  const [chars, setChars] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const supabase = createClient()

  function handleChange(idx: number, value: string) {
    if (!/^[A-Za-z0-9]?$/.test(value)) return
    const next = [...chars]
    next[idx] = value.toUpperCase()
    setChars(next)
    if (value && idx < 5) inputsRef.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !chars[idx] && idx > 0) inputsRef.current[idx - 1]?.focus()
  }

  async function handleSubmit() {
    const code = chars.join('')
    if (code.length !== 6) { setError('أدخل الكود كاملاً (6 رموز)'); return }
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('course_code', code)
      .single()

    if (courseError || !course) {
      setError('لا يوجد كورس بهذا الكود')
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('enrollments')
      .select('status')
      .eq('course_id', course.id)
      .eq('student_id', user.id)
      .maybeSingle()

    if (existing) {
      setError(
        existing.status === 'pending' ? 'لديك طلب التحاق قيد المراجعة لهذا الكورس بالفعل'
        : existing.status === 'approved' ? 'أنت مسجّل في هذا الكورس بالفعل'
        : 'تم رفض طلب التحاقك بهذا الكورس سابقاً'
      )
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('enrollments')
      .insert({ student_id: user.id, course_id: course.id })

    if (insertError) { setError('حدث خطأ أثناء إرسال الطلب'); setLoading(false); return }

    setSuccess(`تم إرسال طلب الالتحاق بكورس "${course.title}" — بانتظار موافقة المدرب`)
    setChars(Array(6).fill(''))
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-ruwad-navy">
        <KeyRound size={20} className="text-ruwad-blue" />
        <h3 className="font-bold">لديك كود كورس؟</h3>
      </div>
      <p className="text-sm text-ruwad-navy/60 text-center">أدخل الكود المكوّن من 6 رموز الذي شاركه مدربك</p>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3 w-full text-center">{error}</div>}
      {success && (
        <div className="bg-ruwad-lime/20 text-ruwad-navy text-sm rounded-ruwad-sm px-4 py-3 w-full text-center flex items-center justify-center gap-2">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      <div className="flex gap-2" dir="ltr">
        {chars.map((c, idx) => (
          <input
            key={idx}
            ref={(el) => { inputsRef.current[idx] = el }}
            value={c}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            maxLength={1}
            className="w-11 h-14 text-center text-xl font-bold uppercase border-2 border-ruwad-gray rounded-ruwad-sm outline-none focus:border-ruwad-blue transition"
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-ruwad-blue text-white px-8 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition disabled:opacity-50 w-full max-w-xs"
      >
        {loading ? 'جارٍ الإرسال...' : 'إرسال طلب الالتحاق'}
      </button>
    </div>
  )
}
