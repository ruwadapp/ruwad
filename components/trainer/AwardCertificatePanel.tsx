'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Search, Check, AlertCircle } from 'lucide-react'

interface Student { id: string; name: string }
interface Course { id: string; title: string }

// منح شهادة إتمام يدوياً لطالب على كورس محدد
export function AwardCertificatePanel({ students, courses }: { students: Student[]; courses: Course[] }) {
  const [studentId, setStudentId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [score, setScore] = useState('')
  const [q, setQ] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const filtered = q.trim()
    ? students.filter((s) => s.name.includes(q.trim()))
    : students

  async function award() {
    if (!studentId || !courseId) {
      setResult({ ok: false, msg: 'اختر الطالب والكورس أولاً' })
      return
    }
    setSaving(true)
    setResult(null)

    // تحقق: هل لديه شهادة مسبقاً؟
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing) {
      setSaving(false)
      setResult({ ok: false, msg: 'هذا الطالب يمتلك شهادة هذا الكورس مسبقاً' })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const certCode = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`

    const { error } = await supabase.from('certificates').insert({
      student_id: studentId,
      course_id: courseId,
      trainer_id: user!.id,
      score: score ? Number(score) : null,
      certificate_code: certCode,
      issued_at: new Date().toISOString(),
    })

    setSaving(false)
    if (error) {
      setResult({ ok: false, msg: 'تعذّر منح الشهادة: ' + error.message })
      return
    }
    setResult({ ok: true, msg: `✓ مُنحت الشهادة بنجاح — الكود: ${certCode}` })
    setStudentId(''); setCourseId(''); setScore(''); setQ('')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-ruwad-sm bg-amber-50 flex items-center justify-center shrink-0">
          <GraduationCap size={20} className="text-amber-600" />
        </span>
        <div>
          <h2 className="font-extrabold text-ruwad-navy">منح شهادة إتمام</h2>
          <p className="text-xs text-ruwad-navy/50 mt-0.5">امنح شهادة موثّقة بـ QR لطالب على كورس محدد يدوياً</p>
        </div>
      </div>

      {result && (
        <div className={`flex items-start gap-2 text-sm rounded-ruwad-sm px-4 py-3 ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {result.ok ? <Check size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
          {result.msg}
        </div>
      )}

      {/* بحث الطالب */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-ruwad-navy/60">اختر الطالب</label>
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ruwad-navy/35" />
          <input
            value={q} onChange={(e) => { setQ(e.target.value); setStudentId('') }}
            placeholder="ابحث باسم الطالب..."
            className="w-full border border-ruwad-gray rounded-ruwad-sm pr-9 pl-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition"
          />
        </div>
        {q.trim() && !studentId && (
          <div className="border border-ruwad-gray rounded-ruwad-sm overflow-hidden max-h-40 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-ruwad-navy/40 p-3 text-center">لا نتائج</p>
            ) : filtered.slice(0, 12).map((s) => (
              <button key={s.id} type="button"
                onClick={() => { setStudentId(s.id); setQ(s.name) }}
                className="w-full text-right text-sm px-4 py-2.5 hover:bg-ruwad-blue/5 transition text-ruwad-navy">
                {s.name}
              </button>
            ))}
          </div>
        )}
        {studentId && (
          <span className="text-xs text-green-600 font-bold flex items-center gap-1"><Check size={12} /> {students.find(s => s.id === studentId)?.name}</span>
        )}
      </div>

      {/* اختيار الكورس */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-ruwad-navy/60">الكورس</label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition bg-white">
          <option value="">— اختر الكورس —</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {/* الدرجة (اختياري) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-ruwad-navy/60">الدرجة من 100 (اختياري)</label>
        <input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)}
          placeholder="مثال: 92"
          className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition w-32" />
      </div>

      <button onClick={award} disabled={saving || !studentId || !courseId}
        className="self-start flex items-center gap-2 bg-amber-500 text-white font-bold px-6 py-2.5 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-40 shadow-ruwad">
        <GraduationCap size={16} /> {saving ? 'جارٍ المنح...' : 'منح الشهادة'}
      </button>
    </div>
  )
}
