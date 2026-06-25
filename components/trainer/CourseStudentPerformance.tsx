'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Award, GraduationCap, X } from 'lucide-react'

interface StudentRow {
  student_id: string
  full_name: string
  examAvg: number | null
  examCount: number
  assignmentAvg: number | null
  assignmentCount: number
  attendanceRate: number | null
  certificateId: string | null
}

export function CourseStudentPerformance({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [issuingFor, setIssuingFor] = useState<StudentRow | null>(null)
  const [scoreInput, setScoreInput] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)

    const [{ data: enrollments }, { data: exams }, { data: assignments }, { data: certs }, { data: attendanceStats }] =
      await Promise.all([
        supabase.from('enrollments').select('student_id, student:profiles!student_id(full_name)').eq('course_id', courseId).eq('status', 'approved'),
        supabase.from('exams').select('id').eq('course_id', courseId),
        supabase.from('assignments').select('id, total_marks').eq('course_id', courseId),
        supabase.from('certificates').select('id, student_id').eq('course_id', courseId),
        supabase.rpc('get_course_attendance_stats', { p_course_id: courseId }),
      ])

    const examIds = (exams ?? []).map((e) => e.id)
    const assignmentIds = (assignments ?? []).map((a) => a.id)

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

      return {
        student_id: e.student_id,
        full_name: studentName,
        examAvg,
        examCount: myExams.length,
        assignmentAvg,
        assignmentCount: myAssignments.length,
        attendanceRate: attendanceMap.get(e.student_id) ?? null,
        certificateId: certMap.get(e.student_id) ?? null,
      }
    })

    setRows(result)
    setLoading(false)
  }, [courseId, supabase])

  useEffect(() => { load() }, [load])

  function openIssueModal(row: StudentRow) {
    const scores = [row.examAvg, row.assignmentAvg].filter((v): v is number => v !== null)
    const suggested = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    setScoreInput(String(suggested))
    setIssuingFor(row)
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
    }
    setSaving(false)
    setIssuingFor(null)
  }

  if (loading) return <p className="text-ruwad-navy/50 text-sm py-6 text-center">جارٍ التحميل...</p>

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6">
      <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
        <GraduationCap size={20} className="text-ruwad-blue" /> مستوى الطلاب في هذا الكورس
      </h2>

      {rows.length === 0 ? (
        <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا يوجد طلاب مقبولون في هذا الكورس بعد.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-ruwad-navy/50 border-b border-ruwad-gray/60">
                <th className="py-2">الطالب</th>
                <th className="py-2">متوسط الامتحانات</th>
                <th className="py-2">متوسط الواجبات</th>
                <th className="py-2">نسبة الحضور</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student_id} className="border-b border-ruwad-gray/30">
                  <td className="py-3 text-ruwad-navy font-medium">{r.full_name}</td>
                  <td className="py-3 text-ruwad-navy">{r.examAvg !== null ? `${r.examAvg}% (${r.examCount})` : '—'}</td>
                  <td className="py-3 text-ruwad-navy">{r.assignmentAvg !== null ? `${r.assignmentAvg}% (${r.assignmentCount})` : '—'}</td>
                  <td className="py-3 text-ruwad-navy">{r.attendanceRate !== null ? `${r.attendanceRate}%` : '—'}</td>
                  <td className="py-3 text-left">
                    {r.certificateId ? (
                      <Link href={`/certificates/${r.certificateId}`} className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-blue">
                        <Award size={14} /> عرض الشهادة
                      </Link>
                    ) : (
                      <button onClick={() => openIssueModal(r)} className="flex items-center gap-1.5 text-xs font-semibold bg-ruwad-lime text-ruwad-navy px-3 py-1.5 rounded-full hover:opacity-80 transition">
                        <Award size={14} /> إصدار شهادة
                      </button>
                    )}
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
              <p className="text-xs text-ruwad-navy/50">مقترحة تلقائياً من متوسط الامتحانات والواجبات، ويمكنك تعديلها حسب تقديرك.</p>
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
