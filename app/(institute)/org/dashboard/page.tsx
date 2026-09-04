import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { LiveActivitySection, AttentionSection } from '@/components/institute/LiveDashboardCards'
import { GrowthChart, TrainerComparisonChart, RateGauge } from '@/components/institute/InstituteAnalyticsCharts'
import {
  Users, GraduationCap, BookOpen, FileText, FileCheck, Trophy,
  CalendarCheck, TrendingUp, Crown, Sparkles,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const pct = (score: number | null | undefined, total: number | null | undefined) =>
  score == null || !total ? null : Math.round((score / total) * 100)

// لوحة المعهد الرئيسية — نشاط حي لحظي + ما يحتاج قراراً + إحصائيات شاملة، كل ذلك في مكان واحد
export default async function InstituteDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('*').eq('owner_id', user!.id).single()
  if (!institute) {
    return (
      <>
        <Header title="لوحة المعهد" />
        <main className="p-6">
          <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">لم يتم العثور على معهد مرتبط بحسابك.</div>
        </main>
      </>
    )
  }

  const [{ data: live }, { data: members }, { data: shares }] = await Promise.all([
    supabase.rpc('institute_live_dashboard', { p_institute_id: institute.id }),
    supabase.from('institute_members').select('user_id, member_role, member:profiles!user_id(full_name)').eq('institute_id', institute.id).eq('status', 'approved'),
    supabase.from('resource_institute_shares').select('resource_id').eq('resource_type', 'courses').eq('institute_id', institute.id),
  ])

  const liveData = (live ?? {
    ongoing_events: [], active_attendance: [], active_exams: [], active_challenges: [],
    finance: [], pending_enrollments: 0, pending_general_join: 0, pending_trainer_join: 0, new_inquiries: 0,
  }) as {
    ongoing_events: never[]; active_attendance: never[]; active_exams: never[]; active_challenges: never[]
    finance: { currency: string; outstanding: number; overdue: number }[]
    pending_enrollments: number; pending_general_join: number; pending_trainer_join: number; new_inquiries: number
  }

  const trainerIds = (members ?? []).filter((m) => m.member_role === 'trainer').map((m) => m.user_id)
  const studentCount = (members ?? []).filter((m) => m.member_role === 'student').length
  const trainerNames = new Map((members ?? []).map((m) => [m.user_id, (m.member as unknown as { full_name?: string })?.full_name ?? 'مدرب']))
  const sharedCourseIds = (shares ?? []).map((s) => s.resource_id)

  // ===== محتوى «الإحصائيات» السابق — منقول ومُدمج هنا، مُصحَّحاً ليُحصر بالكورسات المشارَكة فعلياً مع هذا المعهد =====
  const [
    { data: courses },
    { data: enrollments },
    { data: exams },
    { data: assignments },
    { data: challenges },
    { data: attSessions },
  ] = await Promise.all([
    sharedCourseIds.length ? supabase.from('courses').select('id, title, trainer_id').in('id', sharedCourseIds) : Promise.resolve({ data: [] as { id: string; title: string; trainer_id: string }[] }),
    sharedCourseIds.length ? supabase.from('enrollments').select('student_id, course_id, progress, enrolled_at, status').in('course_id', sharedCourseIds).eq('status', 'approved') : Promise.resolve({ data: [] as { student_id: string; course_id: string; progress: number; enrolled_at: string; status: string }[] }),
    sharedCourseIds.length ? supabase.from('exams').select('id, title, trainer_id, course_id, total_marks, exam_submissions(student_id, score, total_marks, submitted_at)').in('course_id', sharedCourseIds) : Promise.resolve({ data: [] as never[] }),
    sharedCourseIds.length ? supabase.from('assignments').select('id, title, trainer_id, course_id, assignment_submissions(student_id, score, submitted_at)').in('course_id', sharedCourseIds) : Promise.resolve({ data: [] as never[] }),
    sharedCourseIds.length ? supabase.from('challenges').select('id, title, trainer_id, course_id, challenge_submissions(student_id, percentage, submitted_at)').in('course_id', sharedCourseIds) : Promise.resolve({ data: [] as never[] }),
    sharedCourseIds.length ? supabase.from('attendance_sessions').select('id, trainer_id, course_id, created_at, attendance_records(student_id, status, checked_in_at)').in('course_id', sharedCourseIds) : Promise.resolve({ data: [] as never[] }),
  ])

  type ExamRow = { id: string; title: string; trainer_id: string; course_id: string | null; total_marks: number; exam_submissions: { student_id: string; score: number | null; total_marks: number | null; submitted_at: string }[] }
  type AttRow = { id: string; trainer_id: string; course_id: string | null; created_at: string; attendance_records: { student_id: string; status: string; checked_in_at: string }[] }

  const examList = (exams ?? []) as unknown as ExamRow[]
  const attList = (attSessions ?? []) as unknown as AttRow[]
  const courseList = courses ?? []
  const enrollList = enrollments ?? []

  const uniqueStudents = new Set(enrollList.map((e) => e.student_id))
  const courseStudents = new Map<string, string[]>()
  for (const e of enrollList) courseStudents.set(e.course_id, [...(courseStudents.get(e.course_id) ?? []), e.student_id])

  const allExamPcts: number[] = []
  const studentPcts = new Map<string, number[]>()
  const trainerPcts = new Map<string, number[]>()
  const coursePcts = new Map<string, number[]>()
  let examSubmissionsCount = 0
  for (const ex of examList) {
    for (const s of ex.exam_submissions ?? []) {
      examSubmissionsCount++
      const p = pct(s.score, s.total_marks ?? ex.total_marks)
      if (p == null) continue
      allExamPcts.push(p)
      studentPcts.set(s.student_id, [...(studentPcts.get(s.student_id) ?? []), p])
      trainerPcts.set(ex.trainer_id, [...(trainerPcts.get(ex.trainer_id) ?? []), p])
      if (ex.course_id) coursePcts.set(ex.course_id, [...(coursePcts.get(ex.course_id) ?? []), p])
    }
  }
  const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null)

  let presentTotal = 0
  let expectedTotal = 0
  const courseAttRates = new Map<string, { present: number; expected: number }>()
  for (const s of attList) {
    const enrolledHere = s.course_id ? (courseStudents.get(s.course_id) ?? []) : []
    const enrolledSet = new Set(enrolledHere)
    const present = (s.attendance_records ?? []).filter((r) => (r.status === 'approved' || r.status === 'pending') && (enrolledSet.size === 0 || enrolledSet.has(r.student_id))).length
    const expected = enrolledSet.size || present
    presentTotal += present
    expectedTotal += expected
    if (s.course_id) {
      const cur = courseAttRates.get(s.course_id) ?? { present: 0, expected: 0 }
      courseAttRates.set(s.course_id, { present: cur.present + present, expected: cur.expected + expected })
    }
  }
  const attendanceRate = expectedTotal ? Math.round((presentTotal / expectedTotal) * 100) : null

  const assignmentSubsCount = (assignments ?? []).reduce((a, x) => a + ((x as { assignment_submissions?: unknown[] }).assignment_submissions?.length ?? 0), 0)
  const challengeSubsCount = (challenges ?? []).reduce((a, x) => a + ((x as { challenge_submissions?: unknown[] }).challenge_submissions?.length ?? 0), 0)
  const examParticipation = examList.length && uniqueStudents.size
    ? Math.min(100, Math.round((examSubmissionsCount / (examList.length * uniqueStudents.size)) * 100))
    : null
  const progressAvg = enrollList.length ? Math.round(enrollList.reduce((a, e) => a + (e.progress ?? 0), 0) / enrollList.length) : null

  const WEEKS = 12
  const now = Date.now()
  const weekIndex = (d: string) => {
    const diff = Math.floor((now - new Date(d).getTime()) / (7 * 86400_000))
    return diff >= 0 && diff < WEEKS ? WEEKS - 1 - diff : null
  }
  const series = Array.from({ length: WEEKS }, (_, i) => {
    const d = new Date(now - (WEEKS - 1 - i) * 7 * 86400_000)
    return { week: d.toLocaleDateString('ar', { day: 'numeric', month: 'short' }), تسجيلات: 0, تسليمات: 0, حضور: 0 }
  })
  for (const e of enrollList) { const i = weekIndex(e.enrolled_at); if (i != null) series[i].تسجيلات++ }
  for (const ex of examList) for (const s of ex.exam_submissions ?? []) { const i = weekIndex(s.submitted_at); if (i != null) series[i].تسليمات++ }
  for (const s of attList) for (const r of s.attendance_records ?? []) { const i = weekIndex(r.checked_in_at); if (i != null) series[i].حضور++ }

  const trainerStudentCounts = new Map<string, Set<string>>()
  for (const c of courseList) {
    const set = trainerStudentCounts.get(c.trainer_id) ?? new Set<string>()
    for (const sid of courseStudents.get(c.id) ?? []) set.add(sid)
    trainerStudentCounts.set(c.trainer_id, set)
  }
  const trainerComparison = trainerIds
    .map((tid) => ({
      name: (trainerNames.get(tid) ?? 'مدرب').split(' ').slice(0, 2).join(' '),
      طلاب: trainerStudentCounts.get(tid)?.size ?? 0,
      'متوسط الامتحانات': avg(trainerPcts.get(tid) ?? []) ?? 0,
    }))
    .filter((t) => t.طلاب > 0 || t['متوسط الامتحانات'] > 0)

  const courseRows = courseList.map((c) => {
    const students = new Set(courseStudents.get(c.id) ?? []).size
    const attn = courseAttRates.get(c.id)
    const courseEnrolls = enrollList.filter((e) => e.course_id === c.id)
    return {
      id: c.id, title: c.title, trainer: trainerNames.get(c.trainer_id) ?? 'مدرب', students,
      progress: courseEnrolls.length ? Math.round(courseEnrolls.reduce((a, e) => a + (e.progress ?? 0), 0) / courseEnrolls.length) : null,
      examAvg: avg(coursePcts.get(c.id) ?? []),
      attRate: attn && attn.expected ? Math.round((attn.present / attn.expected) * 100) : null,
    }
  }).sort((a, b) => b.students - a.students)

  const studentNames = new Map<string, string>()
  if (studentPcts.size > 0) {
    const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', [...studentPcts.keys()].slice(0, 200))
    for (const p of profs ?? []) studentNames.set(p.id, p.full_name)
  }
  const topStudents = [...studentPcts.entries()]
    .map(([id, arr]) => ({ id, name: studentNames.get(id) ?? 'طالب', avg: avg(arr) ?? 0, count: arr.length }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5)

  const kpis = [
    { label: 'المدربون', value: trainerIds.length, icon: Users },
    { label: 'الطلاب', value: uniqueStudents.size, icon: GraduationCap, accent: true },
    { label: 'الكورسات المشارَكة', value: courseList.length, icon: BookOpen },
    { label: 'الامتحانات', value: examList.length, icon: FileText },
    { label: 'تسليمات الامتحانات', value: examSubmissionsCount, icon: TrendingUp },
    { label: 'الواجبات', value: assignments?.length ?? 0, icon: FileCheck },
    { label: 'تسليمات الواجبات', value: assignmentSubsCount, icon: FileCheck },
    { label: 'التحديات', value: challenges?.length ?? 0, icon: Trophy },
    { label: 'مشاركات التحديات', value: challengeSubsCount, icon: Trophy },
    { label: 'جلسات الحضور', value: attList.length, icon: CalendarCheck },
  ]

  return (
    <>
      <Header title={institute.name} />
      <main className="p-4 sm:p-6 flex flex-col gap-5">
        {/* الآن + يحتاج انتباهك */}
        <LiveActivitySection
          events={liveData.ongoing_events} attendance={liveData.active_attendance}
          exams={liveData.active_exams} challenges={liveData.active_challenges}
        />
        <AttentionSection
          finance={liveData.finance}
          pendingEnrollments={liveData.pending_enrollments}
          pendingGeneralJoin={liveData.pending_general_join}
          pendingTrainerJoin={liveData.pending_trainer_join}
          newInquiries={liveData.new_inquiries}
        />

        {/* مؤشرات KPI */}
        <div className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg p-6 sm:p-8" style={{ background: 'linear-gradient(180deg, #252943 0%, #1a1e33 100%)' }}>
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-ruwad-blue/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-14 -left-14 w-52 h-52 bg-ruwad-lime/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-3 mb-5 sm:mb-6">
            <Sparkles className="text-ruwad-lime" size={22} />
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">مركز قيادة {institute.name}</h2>
              <p className="text-xs sm:text-sm text-white/60">نظرة شاملة لحظية على كل نشاط معهدك</p>
            </div>
          </div>
          <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {kpis.map((k) => (
              <div key={k.label} className={`rounded-ruwad-sm p-3.5 sm:p-4 ${k.accent ? 'bg-ruwad-lime' : 'bg-white/10 backdrop-blur'}`}>
                <k.icon size={16} className={k.accent ? 'text-ruwad-navy/60' : 'text-white/50'} />
                <p className={`text-xl sm:text-2xl font-extrabold mt-2 ${k.accent ? 'text-ruwad-navy' : 'text-white'}`}>{k.value}</p>
                <p className={`text-[10px] sm:text-[11px] mt-0.5 ${k.accent ? 'text-ruwad-navy/60' : 'text-white/60'}`}>{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* المقاييس الدائرية */}
        <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-6">
          <h3 className="font-extrabold text-ruwad-navy mb-2 flex items-center gap-2"><TrendingUp size={17} className="text-ruwad-blue" /> مؤشرات الأداء</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <RateGauge value={avg(allExamPcts) ?? 0} label="متوسط علامات الامتحانات" />
            <RateGauge value={attendanceRate ?? 0} label="نسبة الحضور الإجمالية" color="#33A4FA" />
            <RateGauge value={progressAvg ?? 0} label="متوسط إنجاز الكورسات" color="#a8c40f" />
            <RateGauge value={examParticipation ?? 0} label="نسبة المشاركة في الامتحانات" color="#252943" />
          </div>
        </div>

        {/* النمو الأسبوعي + مقارنة المدربين */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-6">
            <h3 className="font-extrabold text-ruwad-navy mb-4">النشاط خلال آخر 12 أسبوعاً</h3>
            <GrowthChart data={series} />
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-6">
            <h3 className="font-extrabold text-ruwad-navy mb-4">مقارنة المدربين</h3>
            {trainerComparison.length === 0 ? (
              <p className="text-sm text-ruwad-navy/50 py-10 text-center">لا توجد بيانات مدربين بعد.</p>
            ) : (
              <TrainerComparisonChart data={trainerComparison} />
            )}
          </div>
        </div>

        {/* أفضل الطلاب + جدول الكورسات */}
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5 items-start">
          <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-6">
            <h3 className="font-extrabold text-ruwad-navy mb-4 flex items-center gap-2"><Crown size={17} className="text-ruwad-lime" style={{ fill: '#E3FF3B' }} /> أفضل 5 طلاب</h3>
            {topStudents.length === 0 ? (
              <p className="text-sm text-ruwad-navy/50 py-6 text-center">لا توجد علامات بعد.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topStudents.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${i === 0 ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-ruwad-blue/10 text-ruwad-blue'}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ruwad-navy truncate">{s.name}</p>
                      <div className="h-1.5 bg-ruwad-gray/40 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-ruwad-gradient rounded-full" style={{ width: `${s.avg}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-ruwad-blue shrink-0">{s.avg}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-6 overflow-x-auto">
            <h3 className="font-extrabold text-ruwad-navy mb-4">أداء الكورسات المشارَكة</h3>
            {courseRows.length === 0 ? (
              <p className="text-sm text-ruwad-navy/50 py-6 text-center">لا توجد كورسات مشارَكة مع معهدك بعد.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-xs text-ruwad-navy/50 border-b border-ruwad-gray/50">
                    <th className="py-2 pl-3">الكورس</th><th className="py-2 px-3">المدرب</th><th className="py-2 px-3">الطلاب</th>
                    <th className="py-2 px-3">الإنجاز</th><th className="py-2 px-3">متوسط الامتحانات</th><th className="py-2 px-3">الحضور</th><th className="py-2 pr-3">التقرير</th>
                  </tr>
                </thead>
                <tbody>
                  {courseRows.map((c) => (
                    <tr key={c.id} className="border-b border-ruwad-gray/30 last:border-0">
                      <td className="py-3 pl-3 font-bold text-ruwad-navy">{c.title}</td>
                      <td className="py-3 px-3 text-ruwad-navy/70">{c.trainer}</td>
                      <td className="py-3 px-3">{c.students}</td>
                      <td className="py-3 px-3">{c.progress != null ? `${c.progress}%` : '—'}</td>
                      <td className="py-3 px-3">{c.examAvg != null ? `${c.examAvg}%` : '—'}</td>
                      <td className="py-3 px-3">{c.attRate != null ? `${c.attRate}%` : '—'}</td>
                      <td className="py-3 pr-3 flex flex-wrap gap-1.5">
                        <Link href={`/reports/course/${c.id}`} className="text-xs font-bold text-white bg-ruwad-navy rounded-full px-3 py-1 hover:opacity-90">PDF</Link>
                        <Link href={`/journey/${c.id}`} className="text-xs font-bold text-ruwad-blue bg-ruwad-blue/10 rounded-full px-3 py-1 hover:bg-ruwad-blue/20">🗺️ الرحلة</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
