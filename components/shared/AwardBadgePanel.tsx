'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Medal, Send } from 'lucide-react'

const RESULT_MSG: Record<string, { text: string; ok: boolean }> = {
  ok: { text: 'مُنحت الشارة بنجاح 🏅 ووصل الطالب إشعار بها.', ok: true },
  already_has_badge: { text: 'هذا الطالب يحمل هذه الشارة بالفعل.', ok: false },
  not_your_student: { text: 'هذا الطالب غير مسجَّل في أي من تدريباتك.', ok: false },
  not_allowed: { text: 'غير مسموح بمنح هذه الشارة.', ok: false },
  badge_not_found: { text: 'الشارة غير موجودة.', ok: false },
}

// منح شارة يدوياً لطالب معيّن — للمدرب (شارات المنصة + شاراته)
// وللمعهد (شارات المنصة + شارات مدربيه). التحقق كله داخل دالة آمنة.
export function AwardBadgePanel({
  students,
  badges,
}: {
  students: { id: string; name: string }[]
  badges: { id: string; name: string; icon?: string | null }[]
}) {
  const [studentId, setStudentId] = useState('')
  const [badgeId, setBadgeId] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ text: string; ok: boolean } | null>(null)
  const supabase = createClient()

  if (students.length === 0 || badges.length === 0) return null

  async function award() {
    if (!studentId || !badgeId) return
    setBusy(true)
    setResult(null)
    const { data, error } = await supabase.rpc('award_badge_to_student', {
      p_student_id: studentId,
      p_badge_id: badgeId,
    })
    setBusy(false)
    setResult(error ? { text: 'تعذّر منح الشارة، حاول مجدداً.', ok: false } : RESULT_MSG[data as string] ?? { text: 'تعذّر منح الشارة.', ok: false })
  }

  return (
    <section className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 font-extrabold text-ruwad-navy">
          <Medal size={18} className="text-ruwad-blue" /> منح شارة لطالب
        </h2>
        <p className="text-xs text-ruwad-navy/55 mt-1">
          اختر طالباً من طلابك وشارة لمنحه إياها تقديراً لإنجازه — تظهر فوراً في "شاراتي" لديه ويصله إشعار.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ruwad-navy">الطالب</label>
          <select
            value={studentId}
            onChange={(e) => { setStudentId(e.target.value); setResult(null) }}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition bg-white"
          >
            <option value="">اختر الطالب...</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ruwad-navy">الشارة</label>
          <select
            value={badgeId}
            onChange={(e) => { setBadgeId(e.target.value); setResult(null) }}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition bg-white"
          >
            <option value="">اختر الشارة...</option>
            {badges.map((b) => <option key={b.id} value={b.id}>{b.icon ? `${b.icon} ` : ''}{b.name}</option>)}
          </select>
        </div>
        <button
          onClick={award}
          disabled={busy || !studentId || !badgeId}
          className="flex items-center justify-center gap-1.5 bg-ruwad-blue text-white text-sm font-bold px-6 py-2.5 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-40"
        >
          <Send size={14} /> {busy ? 'جارٍ المنح...' : 'منح الشارة'}
        </button>
      </div>

      {result && (
        <p className={`text-xs font-semibold rounded-ruwad-sm px-4 py-2.5 ${result.ok ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
          {result.text}
        </p>
      )}
    </section>
  )
}
