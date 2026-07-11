'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function CourseJoinPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get('code')
  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function run() {
      if (!code) { setStatus('error'); setMessage('رابط غير صالح'); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace(`/login?next=${encodeURIComponent(`/my-courses/join?code=${code}`)}`); return }

      const { data: course, error: courseError } = await supabase
        .from('courses').select('id, title').eq('course_code', code).single()

      if (courseError || !course) { setStatus('error'); setMessage('لا يوجد تدريب بهذا الرابط'); return }
      setCourseTitle(course.title)

      const { data: existing } = await supabase
        .from('enrollments').select('status').eq('course_id', course.id).eq('student_id', user.id).maybeSingle()

      if (existing) {
        setStatus('already')
        setMessage(
          existing.status === 'pending' ? 'لديك طلب انضمام قيد المراجعة لهذا التدريب بالفعل'
          : existing.status === 'approved' ? 'أنت مسجّل في هذا التدريب بالفعل'
          : 'تم رفض طلب انضمامك لهذا التدريب سابقاً'
        )
        return
      }

      const { error: insertError } = await supabase.from('enrollments').insert({ student_id: user.id, course_id: course.id })
      if (insertError) { setStatus('error'); setMessage('حدث خطأ أثناء إرسال طلب الانضمام'); return }

      setStatus('success')
    }
    run()
  }, [code, router, supabase])

  return (
    <main dir="rtl" className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="bg-white rounded-ruwad shadow-card p-10 max-w-md w-full flex flex-col items-center text-center gap-4">
        {status === 'loading' && (
          <>
            <Loader2 size={40} className="text-ruwad-blue animate-spin" />
            <p className="text-ruwad-navy/70">جارٍ إرسال طلب انضمامك...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 size={40} className="text-ruwad-lime" />
            <h2 className="text-xl font-bold text-ruwad-navy">تم إرسال طلبك!</h2>
            <p className="text-sm text-ruwad-navy/60">
              طلب انضمامك لتدريب &quot;{courseTitle}&quot; بانتظار موافقة المدرب — ستصلك إشعار فور القبول.
            </p>
            <Link href="/home" className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition mt-2">
              الذهاب للرئيسية
            </Link>
          </>
        )}
        {status === 'already' && (
          <>
            <CheckCircle2 size={40} className="text-ruwad-navy/40" />
            <p className="text-sm text-ruwad-navy/70">{message}</p>
            <Link href="/my-courses" className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition mt-2">
              تدريباتي
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={40} className="text-red-400" />
            <p className="text-sm text-red-600">{message}</p>
            <Link href="/home" className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition mt-2">
              الذهاب للرئيسية
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
