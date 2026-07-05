'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { AttendanceStatus } from '@/lib/types'

export function AttendanceCheckIn() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [status, setStatus] = useState<AttendanceStatus | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!recordId) return
    const channel = supabase
      .channel(`attendance_record:${recordId}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'attendance_records', filter: `id=eq.${recordId}` },
        (payload) => {
          setStatus((payload.new as { status: AttendanceStatus }).status)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [recordId, supabase])

  function handleDigitChange(idx: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[idx] = value
    setDigits(next)
    if (value && idx < 5) inputsRef.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
  }

  async function handleSubmit() {
    const code = digits.join('')
    if (code.length !== 6) {
      setError('أدخل الكود كاملاً (6 أرقام)')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('id, title')
      .eq('session_code', code)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      setError('الكود غير صحيح أو الجلسة غير نشطة حالياً')
      setLoading(false)
      return
    }

    setSessionTitle(session.title)

    const { data: existing } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', session.id)
      .eq('student_id', user.id)
      .maybeSingle()

    if (existing) {
      setRecordId(existing.id)
      setStatus(existing.status)
      setLoading(false)
      return
    }

    const { data: record, error: insertError } = await supabase
      .from('attendance_records')
      .insert({ session_id: session.id, student_id: user.id })
      .select()
      .single()

    if (insertError || !record) {
      setError('حدث خطأ أثناء تسجيل الحضور')
      setLoading(false)
      return
    }

    setRecordId(record.id)
    setStatus('pending')
    setLoading(false)
  }

  if (status === 'approved') {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
        <CheckCircle2 size={56} className="text-ruwad-blue" />
        <h2 className="text-xl font-bold text-ruwad-navy">تم تأكيد حضورك!</h2>
        <p className="text-ruwad-navy/60 text-sm">{sessionTitle}</p>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
        <XCircle size={56} className="text-red-500" />
        <h2 className="text-xl font-bold text-ruwad-navy">تم رفض طلب الحضور</h2>
        <p className="text-ruwad-navy/60 text-sm">يرجى التواصل مع المدرب إذا كان هذا خطأً.</p>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
        <Loader2 size={48} className="text-ruwad-blue animate-spin" />
        <h2 className="text-lg font-bold text-ruwad-navy">تم تسجيل طلبك</h2>
        <p className="text-ruwad-navy/60 text-sm">في انتظار موافقة المدرب على حضورك في: {sessionTitle}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col items-center gap-6 max-w-sm mx-auto">
      <h2 className="text-lg font-bold text-ruwad-navy">تسجيل الحضور</h2>
      <p className="text-sm text-ruwad-navy/60">أدخل كود الجلسة المكوّن من 6 أرقام</p>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3 w-full text-center">{error}</div>}

      <div className="flex gap-2" dir="ltr">
        {digits.map((d, idx) => (
          <input
            key={idx}
            ref={(el) => { inputsRef.current[idx] = el }}
            value={d}
            onChange={(e) => handleDigitChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            maxLength={1}
            inputMode="numeric"
            className="w-11 h-14 text-center text-2xl font-bold border-2 border-ruwad-gray rounded-ruwad-sm outline-none focus:border-ruwad-blue transition"
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-ruwad-blue text-white px-8 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 w-full"
      >
        {loading ? 'جارٍ التسجيل...' : 'تسجيل الحضور'}
      </button>
    </div>
  )
}
