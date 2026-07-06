'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Award, GraduationCap, X, CalendarCheck, FileCheck, FileText, UserMinus } from 'lucide-react'

interface StudentRow {
  student_id: string
  enrollment_id: string
  full_name: string
  examAvg: number | null
  examCount: number
  assignmentAvg: number | null
  assignmentCount: number
  attendanceRate: number | null
  overallScore: number
  certificateId: string | null
}

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_ROW_STYLE = [
  'bg-gradient-to-l from-amber-50 to-white border-amber-200',
  'bg-gradient-to-l from-slate-50 to-white border-slate-200',
  'bg-gradient-to-l from-orange-50 to-white border-orange-200',
]

export function CourseStudentPerformance({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<StudentRow[]>([])
  const [totalExams, setTotalExams] = useState(0)
  const [totalAssignments, setTotalAssignments] = useState(0)
  const [loading, setLoading] = useState(true)
  const [issuingFor, setIssuingFor] = useState<StudentRow | null>(null)
  const [scoreInput, setScoreInput] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)

    const [{ data: enrollments }, { data: exams }, { data: assignments }, { data: certs }, { data: attendanceStats }] =
      await Promise.all([
        supabase.from('enrollments').select('id, student_id, student:profiles!student_id(full_name)').eq('course_id', courseId).eq('status', 'approved'),
        supabase.from('exams').select('id').eq('course_id', courseId),
        supabase.from('assignments').select('id, total_marks').eq('course_id', courseId),
        supabase.from('certificates').select('id, student_id').eq('course_id', courseId),
        supabase.rpc('get_course_attendance_stats', { p_course_id: courseId }),
      ])

    const examIds = (exams ?? []).map((e) => e.id)
    const assignmentIds = (assignments ?? []).map((a) => a.id)
    setTotalExams(examIds.length)
    setTotalAssignments(assignmentIds.length)

    const [{ data: examSubs }, { data: assignmentSubs }] = await Promise.all([
      examIds.length
        ? supabase.from('exam_submissions').select('student_id, percentage').in('exam_id', examIds).not('submitted_at', 'is', null)
        : Promise.resolve({ data: [] }),
      assignmentIds.length
        ? supabase.from('assignment_submissions').select('student_id, score, assignment_id').in('assignment_id', assignmentIds).not('graded_at', 'is', null)
        : Promise.resolve({ data: [] }),
    ])

    const assignmentTotalMap = new Map((assignments ?? []).map((a) => [a.id, a.total_marks]))
    const attendanceMap = new Map(
      ((attendanceStats ?? []) as { student_id: string; rate: number }[]).map((s) => [s.student_id, s.rate])
    )
    const certMap = new Map((certs ?? []).map((c) => [c.student_id, c.id]))

    const result: StudentRow[] = (enrollments ?? []).map((e) => {
      const studentName = (e.student as unknown as { full_name?: string } | null)?.full_name ?? 'طالب'
      const myExams = (examSubs ?? []).filter((s) => s.student_id === e.student_id)
      const myAssignments = (assignmentSubs ?? []).filter((s) => s.student_id === e.student_id)

      const examAvg = myExams.length
        ? Math.round(myExams.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / myExams.length)
        : null

      const assignmentAvg = myAssignments.length
        ? Math.round(
            myAssignments.reduce((sum, s) => {
              const total = assignmentTotalMap.get(s.assignment_id) ?? 100
              return sum + ((s.score ?? 0) / total) * 100
            }, 0) / myAssignments.length
          )
        : null

      const scores = [examAvg, assignmentAvg].filter((v): v is number => v !== null)
      const overallScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

      return {
        student_id: e.student_id,
        enrollment_id: e.id,
        full_name: studentName,
        examAvg,
        examCount: myExams.length,
        assignmentAvg,
        assignmentCount: myAssignments.length,
        attendanceRate: attendanceMap.get(e.student_id) ?? null,
        overallScore,
        certificateId: certMap.get(e.student_id) ?? null,
      }
    }).sort((a, b) => b.overallScore - a.overallScore)

    setRows(result)
    setLoading(false)
  }, [courseId, supabase])

  useEffect(() => { load() }, [load])

  function openIssueModal(row: StudentRow) {
    setScoreInput(String(row.overallScore))
    setIssuingFor(row)
  }

  async function removeStudent(row: StudentRow) {
    if (!confirm(`إزالة "${row.full_name}" من هذا الكورس؟ سيفقد الوصول لمحتواه فوراً (يمكنه إعادة طلب الالتحاق لاحقاً).`)) return
    const { error } = await supabase.from('enrollments').delete().eq('id', row.enrollment_id)
    if (!error) setRows((prev) => prev.filter((r) => r.enrollment_id !== row.enrollment_id))
  }

  async function issueCertificate() {
    if (!issuingFor) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: codeData } = await supabase.rpc('generate_certificate_code')

    const { data, error } = await supabase
      .from('certificates')
      .upsert(
        {
          student_id: issuingFor.student_id,
          course_id: courseId,
          trainer_id: user!.id,
          score: Number(scoreInput) || 0,
          certificate_code: codeData,
        },
        { onConflict: 'student_id,course_id' }
      )
      .select()
      .single()

    if (!error && data) {
      setRows((prev) => prev.map((r) => (r.student_id === issuingFor.student_id ? { ...r, certificateId: data.id } : r)))
      // نشر تلقائي في الرواق — الشهادة تصبح إنجازاً مرئياً لمتابعي المدرب
      const { data: courseRow } = await supabase.from('courses').select('title').eq('id', courseId).single()
      await supabase.from('trainer_posts').insert({
        trainer_id: user!.id,
        content: `🎓 أتمّ ${issuingFor.full_name} كورس "${courseRow?.title ?? ''}" بنجاح!`,
        card_type: 'certificate',
        card_ref_id: data.id,
      })
    }
    setSaving(false)
    setIssuingFor(null)
  }

  if (loading) return <p className="text-ruwad-navy/50 text-sm py-6 text-center">جارٍ التحميل...</p>

  const avgOverall = rows.length ? Math.round(rows.reduce((s, r) => s + r.overallScore, 0) / rows.length) : 0
  const withAttendance = rows.filter((r) => r.attendanceRate !== null)
  const avgAttendance = withAttendance.length
    ? Math.round(withAttendance.reduce((s, r) => s + (r.attendanceRate ?? 0), 0) / withAttendance.length)
    : null

  return (
    <div id="course-summary" className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-5">
      <div className="relative overflow-hidden rounded-ruwad p-5 flex items-center justify-between flex-wrap gap-4" style={{ backgroundImage: 'linear-gradient(135deg, #3A4EFB 0%, #33A4FA 100%)' }}>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-2 text-white">
          <GraduationCap size={22} />
          <h2 className="text-lg font-bold">ملخص الكورس — أداء الطلاب</h2>
        </div>
        <div className="relative flex items-center gap-3 flex-wrap">
          <div className="bg-white/15 backdrop-blur rounded-ruwad-sm px-4 py-2 text-center">
            <p className="text-xl font-bold text-white">{rows.length}</p>
            <p className="text-[11px] text-white/70">طالب</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-ruwad-sm px-4 py-2 text-center">
            <p className="text-xl font-bold text-white">{avgOverall}%</p>
            <p className="text-[11px] text-white/70">متوسط النتائج</p>
          </div>
          <div className="bg-ruwad-lime rounded-ruwad-sm px-4 py-2 text-center">
            <p className="text-xl font-bold text-ruwad-navy">{avgAttendance !== null ? `${avgAttendance}%` : '—'}</p>
            <p className="text-[11px] text-ruwad-navy/70">متوسط الحضور</p>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا يوجد طلاب مقبولون في هذا الكورس بعد.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-ruwad-navy/50 border-b border-ruwad-gray/60">
                <th className="py-2 px-2">الترتيب</th>
                <th className="py-2 px-2">الطالب</th>
                <th className="py-2 px-2">النتيجة الإجمالية</th>
                <th className="py-2 px-2"><span className="flex items-center gap-1"><CalendarCheck size={13} /> الحضور</span></th>
                <th className="py-2 px-2"><span className="flex items-center gap-1"><FileCheck size={13} /> الواجبات</span></th>
                <th className="py-2 px-2"><span className="flex items-center gap-1"><FileText size={13} /> الامتحانات</span></th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.student_id} className={`border-b ${idx < 3 ? RANK_ROW_STYLE[idx] : 'border-ruwad-gray/30'}`}>
                  <td className="py-3 px-2 font-bold text-ruwad-navy">
                    {idx < 3 ? <span className="text-lg">{MEDALS[idx]}</span> : <span className="text-ruwad-navy/50">#{idx + 1}</span>}
                  </td>
                  <td className="py-3 px-2 text-ruwad-navy font-medium">{r.full_name}</td>
                  <td className="py-3 px-2">
                    <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                      r.overallScore >= 85 ? 'bg-ruwad-lime/40 text-ruwad-navy' :
                      r.overallScore >= 50 ? 'bg-ruwad-blue/10 text-ruwad-blue' : 'bg-red-50 text-red-500'
                    }`}>{r.overallScore}%</span>
                  </td>
                  <td className="py-3 px-2 text-ruwad-navy">{r.attendanceRate !== null ? `${r.attendanceRate}%` : '—'}</td>
                  <td className="py-3 px-2 text-ruwad-navy">{r.assignmentCount} / {totalAssignments}</td>
                  <td className="py-3 px-2 text-ruwad-navy">{r.examCount} / {totalExams}</td>
                  <td className="py-3 px-2 text-left">
                    <div className="flex items-center justify-end gap-2">
                      {r.certificateId ? (
                        <Link href={`/certificates/${r.certificateId}`} className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-blue whitespace-nowrap">
                          <Award size={14} /> الشهادة
                        </Link>
                      ) : (
                        <button onClick={() => openIssueModal(r)} className="flex items-center gap-1.5 text-xs font-semibold bg-ruwad-lime text-ruwad-navy px-3 py-1.5 rounded-full hover:opacity-80 transition whitespace-nowrap">
                          <Award size={14} /> إصدار شهادة
                        </button>
                      )}
                      <button
                        onClick={() => removeStudent(r)}
                        aria-label="إزالة من الكورس"
                        title="إزالة من الكورس"
                        className="text-red-400 hover:bg-red-50 p-1.5 rounded-ruwad-sm transition shrink-0"
                      >
                        <UserMinus size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {issuingFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setIssuingFor(null)}>
          <div className="bg-white rounded-ruwad p-6 max-w-sm w-full flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ruwad-navy">إصدار شهادة لـ {issuingFor.full_name}</h3>
              <button onClick={() => setIssuingFor(null)} aria-label="إغلاق"><X size={18} className="text-ruwad-navy/50" /></button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ruwad-navy">العلامة النهائية المعروضة في الشهادة (%)</label>
              <input
                type="number" min={0} max={100} value={scoreInput} onChange={(e) => setScoreInput(e.target.value)}
                className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
              />
              <p className="text-xs text-ruwad-navy/50">مقترحة تلقائياً من النتيجة الإجمالية، ويمكنك تعديلها حسب تقديرك.</p>
            </div>
            <button onClick={issueCertificate} disabled={saving} className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
              {saving ? 'جارٍ الإصدار...' : 'إصدار الشهادة'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
