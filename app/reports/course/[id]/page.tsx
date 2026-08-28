import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PrintReportButton } from '@/components/shared/PrintReportButton'

export const dynamic = 'force-dynamic'

// ============================================================================
// تقرير الكورس الشامل — صفحة مهيّأة للطباعة/التصدير PDF بهوية رُوّاد
// متاحة للمدرب صاحب الكورس ولمدير المعهد الذي شورك معه الكورس.
// الوصول للبيانات محكوم بالكامل بسياسات RLS: إن لم يكن للمستخدم حق، لن يرى شيئاً.
// ============================================================================

const BLUE = '#3A4EFB'
const BLUE_LIGHT = '#33A4FA'
const LIME = '#E3FF3B'
const NAVY = '#252943'
const GRAY = '#DEE0ED'

type Sub = { student_id: string; score: number | null; total?: number | null }

export default async function CourseReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS يعيد الكورس فقط للمدرب المالك أو للمعهد المُشارَك معه أو منشوراً للعموم،
  // لذا نتحقق صراحةً من صفة الطالب لعدم كشف التقرير عبر رابط كورس منشور
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer' && profile?.role !== 'institute_admin' && profile?.role !== 'super_admin') redirect('/home')

  const { data: course } = await supabase.from('courses').select('*').eq('id', id).single()
  if (!course) notFound()

  const isOwner = course.trainer_id === user.id
  if (!isOwner && profile?.role !== 'super_admin') {
    // مدير معهد: يجب أن يكون الكورس مُشارَكاً مع معهده تحديداً
    const { data: inst } = await supabase.from('institutes').select('id').eq('owner_id', user.id).single()
    const { data: share } = inst
      ? await supabase.from('resource_institute_shares').select('id').eq('institute_id', inst.id).eq('resource_type', 'courses').eq('resource_id', id).maybeSingle()
      : { data: null }
    if (!share) notFound()
  }

  const [
    { data: trainer },
    { data: lectures },
    { data: enrollments },
    { data: exams },
    { data: assignments },
    { data: challenges },
    { data: attSessions },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', course.trainer_id).single(),
    supabase.from('lectures').select('id, title, order_index, is_published').eq('course_id', id).order('order_index'),
    supabase.from('enrollments').select('student_id, progress, status, created_at, student:profiles!student_id(full_name)').eq('course_id', id).eq('status', 'approved'),
    supabase.from('exams').select('id, title, total_marks, is_active, exam_submissions(student_id, score, total_marks)').eq('course_id', id).order('created_at'),
    supabase.from('assignments').select('id, title, due_date, is_active, assignment_submissions(student_id, score)').eq('course_id', id).order('created_at'),
    supabase.from('challenges').select('id, title, is_active, challenge_submissions(student_id, score, percentage)').eq('course_id', id).order('created_at'),
    supabase.from('attendance_sessions').select('id, title, created_at, attendance_records(student_id, status)').eq('course_id', id).order('created_at'),
  ])

  // ==================== الحسابات ====================
  const students = (enrollments ?? []).map((e) => ({
    id: e.student_id,
    name: (e.student as unknown as { full_name?: string })?.full_name ?? 'طالب',
    progress: e.progress ?? 0,
    joinedAt: e.created_at,
  }))
  const studentIds = new Set(students.map((s) => s.id))

  const pct = (score: number | null | undefined, total: number | null | undefined) =>
    score == null || !total ? null : Math.round((score / total) * 100)

  // امتحانات: متوسط كل امتحان + متوسط كل طالب
  const examRows = (exams ?? []).map((ex) => {
    const subs = (ex.exam_submissions ?? []) as Sub[]
    const graded = subs.map((s) => pct(s.score, (s as { total_marks?: number }).total_marks ?? ex.total_marks)).filter((v): v is number => v != null)
    return {
      title: ex.title,
      active: ex.is_active,
      submissions: subs.length,
      avg: graded.length ? Math.round(graded.reduce((a, b) => a + b, 0) / graded.length) : null,
      max: graded.length ? Math.max(...graded) : null,
      min: graded.length ? Math.min(...graded) : null,
    }
  })

  const studentExamPcts = new Map<string, number[]>()
  for (const ex of exams ?? []) {
    for (const s of (ex.exam_submissions ?? []) as (Sub & { total_marks?: number })[]) {
      const p = pct(s.score, s.total_marks ?? ex.total_marks)
      if (p != null) studentExamPcts.set(s.student_id, [...(studentExamPcts.get(s.student_id) ?? []), p])
    }
  }

  // واجبات
  const assignmentRows = (assignments ?? []).map((a) => {
    const subs = (a.assignment_submissions ?? []) as Sub[]
    const graded = subs.filter((s) => s.score != null)
    return {
      title: a.title,
      submissions: subs.length,
      graded: graded.length,
      avg: graded.length ? Math.round(graded.reduce((x, s) => x + (s.score ?? 0), 0) / graded.length) : null,
    }
  })
  const studentAssignments = new Map<string, number>()
  for (const a of assignments ?? [])
    for (const s of (a.assignment_submissions ?? []) as Sub[])
      studentAssignments.set(s.student_id, (studentAssignments.get(s.student_id) ?? 0) + 1)

  // تحديات
  const challengeRows = (challenges ?? []).map((c) => {
    const subs = (c.challenge_submissions ?? []) as { student_id: string; percentage: number | null }[]
    const graded = subs.map((s) => s.percentage).filter((v): v is number => v != null)
    return {
      title: c.title,
      submissions: subs.length,
      avg: graded.length ? Math.round(graded.reduce((a, b) => a + b, 0) / graded.length) : null,
    }
  })

  // حضور: نحسب فقط طلاب هذا الكورس، والحاضر = pending/approved (سجّل دخوله فعلاً)
  const attRows = (attSessions ?? []).map((s) => {
    const recs = ((s.attendance_records ?? []) as { student_id: string; status: string }[]).filter((r) => studentIds.has(r.student_id))
    const present = recs.filter((r) => r.status === 'approved' || r.status === 'pending').length
    return {
      title: s.title,
      date: s.created_at,
      present,
      total: students.length,
      rate: students.length ? Math.round((present / students.length) * 100) : 0,
    }
  })
  const studentPresent = new Map<string, number>()
  for (const s of attSessions ?? [])
    for (const r of (s.attendance_records ?? []) as { student_id: string; status: string }[])
      if ((r.status === 'approved' || r.status === 'pending') && studentIds.has(r.student_id))
        studentPresent.set(r.student_id, (studentPresent.get(r.student_id) ?? 0) + 1)

  // جدول الطلاب النهائي
  const studentRows = students
    .map((st) => {
      const examPcts = studentExamPcts.get(st.id) ?? []
      return {
        ...st,
        examAvg: examPcts.length ? Math.round(examPcts.reduce((a, b) => a + b, 0) / examPcts.length) : null,
        examCount: examPcts.length,
        assignments: studentAssignments.get(st.id) ?? 0,
        attendance: attSessions?.length ? Math.round(((studentPresent.get(st.id) ?? 0) / attSessions.length) * 100) : null,
      }
    })
    .sort((a, b) => (b.examAvg ?? -1) - (a.examAvg ?? -1))

  // الإحصائيات العامة
  const allExamAvgs = examRows.map((r) => r.avg).filter((v): v is number => v != null)
  const overall = {
    students: students.length,
    lectures: lectures?.length ?? 0,
    progressAvg: students.length ? Math.round(students.reduce((a, s) => a + s.progress, 0) / students.length) : 0,
    examAvg: allExamAvgs.length ? Math.round(allExamAvgs.reduce((a, b) => a + b, 0) / allExamAvgs.length) : null,
    attendanceAvg: attRows.length ? Math.round(attRows.reduce((a, r) => a + r.rate, 0) / attRows.length) : null,
    topStudent: studentRows.find((s) => s.examAvg != null)?.name ?? null,
  }

  const today = new Date().toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })

  // ==================== العرض ====================
  return (
    <div dir="rtl" style={{ background: '#F5F6FA', minHeight: '100vh', fontFamily: 'inherit' }}>
      {/* أنماط الطباعة: تحويل الصفحة لمستند A4 نظيف مع الحفاظ على الألوان */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: #fff !important; }
          .report-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; border-radius: 0 !important; }
          .avoid-break { break-inside: avoid; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { size: A4; margin: 12mm; }
        .rw-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .rw-table th { background: ${NAVY}; color: #fff; padding: 8px 10px; text-align: right; font-weight: 700; }
        .rw-table th:first-child { border-radius: 0 8px 8px 0; }
        .rw-table th:last-child { border-radius: 8px 0 0 8px; }
        .rw-table td { padding: 7px 10px; border-bottom: 1px solid ${GRAY}; color: ${NAVY}; }
        .rw-table tr:nth-child(even) td { background: #F8F9FE; }
      `}</style>

      <PrintReportButton />

      <div className="report-sheet" style={{ maxWidth: 860, margin: '24px auto', background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(58,78,251,.12)', overflow: 'hidden' }}>
        {/* ===== الترويسة بهوية رُوّاد ===== */}
        <div style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_LIGHT} 100%)`, padding: '32px 36px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, marginBottom: 6 }}>تقرير الكورس الشامل</p>
              <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: 0 }}>{course.title}</h1>
              <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 14, marginTop: 8 }}>
                المدرب: {trainer?.full_name ?? '—'} &nbsp;•&nbsp; تاريخ التقرير: {today}
              </p>
            </div>
            <div style={{ background: LIME, color: NAVY, fontWeight: 800, fontSize: 20, padding: '10px 18px', borderRadius: 14 }}>رُوّاد</div>
          </div>

          {/* شريط الإحصائيات */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: 24 }}>
            {[
              { label: 'الطلاب', value: overall.students },
              { label: 'المحاضرات', value: overall.lectures },
              { label: 'متوسط الإنجاز', value: `${overall.progressAvg}%` },
              { label: 'متوسط الامتحانات', value: overall.examAvg != null ? `${overall.examAvg}%` : '—' },
              { label: 'نسبة الحضور', value: overall.attendanceAvg != null ? `${overall.attendanceAvg}%` : '—' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                <p style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 11, margin: '4px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {overall.topStudent && (
            <div className="avoid-break" style={{ background: `${LIME}55`, border: `1px solid ${LIME}`, borderRadius: 12, padding: '12px 16px', color: NAVY, fontSize: 13, fontWeight: 700 }}>
              🏆 الطالب الأعلى أداءً في الامتحانات: {overall.topStudent}
            </div>
          )}

          <Section title="الامتحانات">
            {examRows.length === 0 ? <Empty /> : (
              <table className="rw-table"><thead><tr>
                <th>الامتحان</th><th>التسليمات</th><th>المتوسط</th><th>الأعلى</th><th>الأدنى</th><th>الحالة</th>
              </tr></thead><tbody>
                {examRows.map((r) => (
                  <tr key={r.title}><td style={{ fontWeight: 700 }}>{r.title}</td><td>{r.submissions}</td>
                    <td>{r.avg != null ? `${r.avg}%` : '—'}</td><td>{r.max != null ? `${r.max}%` : '—'}</td>
                    <td>{r.min != null ? `${r.min}%` : '—'}</td><td>{r.active ? 'نشط' : 'مغلق'}</td></tr>
                ))}
              </tbody></table>
            )}
          </Section>

          <Section title="الواجبات">
            {assignmentRows.length === 0 ? <Empty /> : (
              <table className="rw-table"><thead><tr>
                <th>الواجب</th><th>التسليمات</th><th>المصحَّحة</th><th>متوسط العلامة</th>
              </tr></thead><tbody>
                {assignmentRows.map((r) => (
                  <tr key={r.title}><td style={{ fontWeight: 700 }}>{r.title}</td><td>{r.submissions}</td><td>{r.graded}</td><td>{r.avg ?? '—'}</td></tr>
                ))}
              </tbody></table>
            )}
          </Section>

          <Section title="التحديات">
            {challengeRows.length === 0 ? <Empty /> : (
              <table className="rw-table"><thead><tr>
                <th>التحدي</th><th>المشاركات</th><th>متوسط النتيجة</th>
              </tr></thead><tbody>
                {challengeRows.map((r) => (
                  <tr key={r.title}><td style={{ fontWeight: 700 }}>{r.title}</td><td>{r.submissions}</td><td>{r.avg != null ? `${r.avg}%` : '—'}</td></tr>
                ))}
              </tbody></table>
            )}
          </Section>

          <Section title="جلسات الحضور">
            {attRows.length === 0 ? <Empty /> : (
              <table className="rw-table"><thead><tr>
                <th>الجلسة</th><th>التاريخ</th><th>الحضور</th><th>النسبة</th>
              </tr></thead><tbody>
                {attRows.map((r) => (
                  <tr key={r.title + r.date}><td style={{ fontWeight: 700 }}>{r.title}</td>
                    <td>{new Date(r.date).toLocaleDateString('ar')}</td>
                    <td>{r.present} / {r.total}</td><td>{r.rate}%</td></tr>
                ))}
              </tbody></table>
            )}
          </Section>

          <Section title={`الطلاب (${studentRows.length})`}>
            {studentRows.length === 0 ? <Empty /> : (
              <table className="rw-table"><thead><tr>
                <th>#</th><th>الاسم</th><th>الإنجاز</th><th>متوسط الامتحانات</th><th>واجبات مسلَّمة</th><th>الحضور</th>
              </tr></thead><tbody>
                {studentRows.map((s, i) => (
                  <tr key={s.id}><td>{i + 1}</td><td style={{ fontWeight: 700 }}>{s.name}</td>
                    <td>{s.progress}%</td>
                    <td>{s.examAvg != null ? `${s.examAvg}% (${s.examCount})` : '—'}</td>
                    <td>{s.assignments}</td>
                    <td>{s.attendance != null ? `${s.attendance}%` : '—'}</td></tr>
                ))}
              </tbody></table>
            )}
          </Section>

          {/* التذييل */}
          <div style={{ borderTop: `2px solid ${GRAY}`, paddingTop: 14, display: 'flex', justifyContent: 'space-between', color: `${NAVY}99`, fontSize: 11 }}>
            <span>أُنشئ هذا التقرير آلياً عبر منصة رُوّاد — ruwaad.app</span>
            <span>{today}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="avoid-break">
      <h2 style={{ color: NAVY, fontSize: 16, fontWeight: 800, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 4, height: 18, background: BLUE, borderRadius: 4, display: 'inline-block' }} /> {title}
      </h2>
      {children}
    </section>
  )
}

function Empty() {
  return <p style={{ color: `${NAVY}66`, fontSize: 12, background: '#F8F9FE', borderRadius: 10, padding: '10px 14px' }}>لا توجد بيانات بعد.</p>
}
