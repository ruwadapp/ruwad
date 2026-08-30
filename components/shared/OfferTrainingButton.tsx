'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Check, Target, X } from 'lucide-react'

const RESULT_MSG: Record<string, { text: string; ok: boolean }> = {
  ok: { text: 'أُرسل عرضك ووصلت الدعوة للطالب ✓', ok: true },
  already_enrolled: { text: 'الطالب مسجَّل في هذا الكورس بالفعل', ok: false },
  already_offered: { text: 'سبق اقتراح هذا الكورس على الطلب', ok: false },
  request_closed: { text: 'أُغلق هذا الطلب', ok: false },
  not_allowed: { text: 'غير مسموح', ok: false },
}

// زر "أستطيع تدريبك": اختيار كورس (+رسالة اختيارية) لاقتراحه على طلب التدريب
export function OfferTrainingButton({
  requestId,
  courses,
}: {
  requestId: string
  courses: { id: string; title: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [courseId, setCourseId] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ text: string; ok: boolean } | null>(null)
  const supabase = createClient()

  if (courses.length === 0) return null

  async function offer() {
    if (!courseId) return
    setBusy(true)
    const { data, error } = await supabase.rpc('offer_training', {
      p_request_id: requestId,
      p_course_id: courseId,
      p_message: message.trim() || null,
    })
    setBusy(false)
    setResult(error ? { text: 'تعذّر الإرسال، حاول مجدداً.', ok: false } : RESULT_MSG[data as string] ?? { text: 'تعذّر الإرسال.', ok: false })
    if (!error && data === 'ok') setOpen(false)
  }

  return (
    <div className="flex flex-col gap-2">
      {result && (
        <p className={`text-[11px] font-bold rounded-ruwad-sm px-3 py-2 ${result.ok ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
          {result.ok && <Check size={11} className="inline -mt-0.5 ml-1" />}{result.text}
        </p>
      )}
      {!result?.ok && (
        !open ? (
          <button
            onClick={() => setOpen(true)}
            className="self-start flex items-center gap-1.5 bg-ruwad-blue text-white text-sm font-bold px-5 py-2.5 rounded-ruwad-sm hover:opacity-90 transition shadow-ruwad"
          >
            <Target size={15} /> أستطيع تدريبك
          </button>
        ) : (
          <div className="border border-ruwad-blue/30 bg-ruwad-blue/5 rounded-ruwad-sm p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-ruwad-navy">اقترح كورساً مناسباً لهذا الطلب</p>
              <button onClick={() => setOpen(false)} aria-label="إغلاق" className="text-ruwad-navy/40 hover:text-ruwad-navy"><X size={14} /></button>
            </div>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue transition bg-white"
            >
              <option value="">اختر الكورس...</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="رسالة قصيرة اختيارية للطالب..."
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue transition bg-white"
            />
            <button
              onClick={offer}
              disabled={busy || !courseId}
              className="flex items-center justify-center gap-1.5 bg-ruwad-blue text-white text-sm font-bold px-4 py-2 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-40"
            >
              <BookOpen size={14} /> {busy ? 'جارٍ الإرسال...' : 'إرسال العرض والدعوة'}
            </button>
          </div>
        )
      )}
    </div>
  )
}
