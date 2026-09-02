'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarCheck, Radio, Loader2, CheckCircle2, Clock } from 'lucide-react'

// بطاقة "جلسة حضور مفتوحة الآن" على الرئيسية — تسجّل الحضور مباشرة من مكانها
// برحلة واحدة (RPC) مع حالة فورية، بدل الانتقال لصفحة /qr وسلسلة استعلاماتها
export function LiveAttendanceCard({ sessionCode, title, courseTitle }: {
  sessionCode: string
  title: string
  courseTitle: string
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'pending' | 'approved' | 'error'>('idle')
  const [error, setError] = useState('')
  const supabase = createClient()

  async function checkIn() {
    if (state === 'busy' || state === 'pending' || state === 'approved') return
    setState('busy'); setError('')
    const { data, error: err } = await supabase.rpc('check_in_attendance', { p_code: sessionCode })
    const row = Array.isArray(data) ? data[0] : data
    if (err || !row) { setState('error'); setError('تعذّر الاتصال — حاول مجدداً'); return }
    if (!row.ok) {
      setState('error')
      setError(row.reason === 'invalid_or_closed' ? 'أُغلقت الجلسة للتو' : 'تعذّر التسجيل')
      return
    }
    setState(row.record_status === 'approved' ? 'approved' : 'pending')
  }

  const done = state === 'pending' || state === 'approved'

  return (
    <div className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg p-[2px]" style={{ background: 'linear-gradient(120deg,#16a34a,#4ade80,#16a34a)' }}>
      <div className="relative bg-gradient-to-l from-green-600 via-emerald-500 to-green-500 rounded-[10px] p-5 flex items-center justify-between gap-4 text-white overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            {!done && <span className="absolute inline-flex h-full w-full rounded-full bg-white/40 animate-ping" />}
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              {done ? <CheckCircle2 size={24} /> : <CalendarCheck size={24} />}
            </span>
          </span>
          <div className="min-w-0">
            {state === 'approved' ? (
              <p className="font-bold">تم تأكيد حضورك! ✓</p>
            ) : state === 'pending' ? (
              <p className="font-bold flex items-center gap-1.5">وصل طلبك — بانتظار موافقة المدرب <Clock size={14} /></p>
            ) : (
              <p className="font-bold flex items-center gap-1.5">جلسة حضور مفتوحة الآن <Radio size={15} className="animate-pulse" /></p>
            )}
            <p className="text-sm opacity-90 truncate">{title}{courseTitle ? ` — ${courseTitle}` : ''}</p>
            {error && <p className="text-xs font-bold bg-white/20 rounded-full px-2.5 py-0.5 mt-1 inline-block">{error}</p>}
          </div>
        </div>
        {!done && (
          <button
            onClick={checkIn}
            disabled={state === 'busy'}
            className="bg-white text-green-600 font-bold px-4 py-2 rounded-ruwad-sm text-sm shrink-0 hover:opacity-90 active:scale-95 transition disabled:opacity-80 flex items-center gap-1.5 min-w-[7.5rem] justify-center"
          >
            {state === 'busy' ? <><Loader2 size={15} className="animate-spin" /> جارٍ التسجيل</> : 'سجّل حضورك'}
          </button>
        )}
      </div>
    </div>
  )
}
