'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Check, Send, X, Megaphone } from 'lucide-react'

const RESULT_MSG: Record<string, string> = {
  ok: 'أُرسلت الدعوة ✓',
  already_enrolled: 'مسجَّل بالفعل',
  already_invited: 'مدعو بالفعل',
  not_allowed: 'غير مسموح',
  course_not_found: 'الكورس غير موجود',
  recently_promoted: 'أُرسلت له مؤخراً',
}
const PROMO_RESULT_MSG: Record<string, string> = { ...RESULT_MSG, ok: 'أُرسلت الدعاية ✓' }

// زر "دعوة إلى تدريب" بجانب الطالب في "بالقرب مني":
// يفتح قائمة صغيرة بالتدريبات المتاحة، وإرسال الدعوة يمر عبر دالة آمنة
// تتحقق من الصلاحية وتُنشئ إشعاراً للطالب.
export function InviteToCourseButton({
  studentId,
  courses,
  mode = 'invite',
}: {
  studentId: string
  courses: { id: string; title: string }[]
  /** invite: دعوة التحاق رسمية | promo: دعاية تسويقية تظهر ببطاقة على رئيسية الطالب */
  mode?: 'invite' | 'promo'
}) {
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const supabase = createClient()

  if (courses.length === 0) return null

  async function invite(courseId: string) {
    setBusyId(courseId)
    const rpcName = mode === 'promo' ? 'send_course_promo' : 'invite_student_to_course'
    const { data, error } = await supabase.rpc(rpcName, {
      p_student_id: studentId,
      p_course_id: courseId,
    })
    setBusyId(null)
    const msgs = mode === 'promo' ? PROMO_RESULT_MSG : RESULT_MSG
    setResult(error ? 'تعذّر الإرسال' : msgs[data as string] ?? 'تعذّر الإرسال')
    setOpen(false)
  }

  if (result) {
    return (
      <span className={`text-[11px] font-bold rounded-full px-3 py-1.5 shrink-0 ${result.startsWith('أُرسلت') ? 'bg-green-50 text-green-600' : 'bg-ruwad-gray/40 text-ruwad-navy/60'}`}>
        {result.startsWith('أُرسلت') && <Check size={11} className="inline -mt-0.5 ml-1" />}
        {result}
      </span>
    )
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 text-[11px] font-bold rounded-full px-3 py-1.5 hover:opacity-90 transition ${
          mode === 'promo' ? 'text-ruwad-navy bg-ruwad-lime' : 'text-white bg-ruwad-blue'
        }`}
      >
        {mode === 'promo' ? <><Megaphone size={11} /> إرسال دعاية</> : <><Send size={11} /> دعوة إلى تدريب</>}
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-30 bg-white rounded-ruwad-sm shadow-ruwad border border-ruwad-gray/40 py-1 w-60 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b border-ruwad-gray/40">
            <p className="text-[11px] font-bold text-ruwad-navy/50">اختر التدريب</p>
            <button onClick={() => setOpen(false)} aria-label="إغلاق" className="text-ruwad-navy/40 hover:text-ruwad-navy"><X size={13} /></button>
          </div>
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => invite(c.id)}
              disabled={busyId !== null}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-ruwad-navy hover:bg-ruwad-blue/5 transition text-right disabled:opacity-50"
            >
              <BookOpen size={13} className="text-ruwad-blue shrink-0" />
              <span className="truncate">{busyId === c.id ? 'جارٍ الإرسال...' : c.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
