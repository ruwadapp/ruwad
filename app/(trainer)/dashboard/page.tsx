import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PlatformAdsBar } from '@/components/shared/PlatformAdsBar'
import { Header } from '@/components/shared/Header'
import { StatsCard } from '@/components/shared/StatsCard'
import { AnalyticsBarChart } from '@/components/trainer/AnalyticsBarChart'
import { ActiveItemsPanel, type ActiveItem } from '@/components/trainer/ActiveItemsPanel'
import {
  Users, BookOpen, FileText, CalendarCheck, FileCheck, UserPlus, Clock, Award, Trophy, Zap,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [coursesRes, examsRes, courses] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('trainer_id', uid),
    supabase.from('exams').select('id', { count: 'exact', head: true }).eq('trainer_id', uid),
    supabase.from('courses').select('id, title').eq('trainer_id', uid),
  ])

  const courseIds = (courses.data ?? []).map((c) => c.id)
  const courseTitleById = new Map((courses.data ?? []).map((c) => [c.id, c.title]))

  const [enrollmentsRes, sessionsRes] = await Promise.all([
    courseIds.length
      ? supabase.from('enrollments').select('student_id, course_id, status, enrolled_at, course:courses(title)').in('course_id', courseIds)
      : Promise.resolve({ data: [] }),
    courseIds.length
      ? supabase.from('attendance_sessions').select('id, course_id').in('course_id', courseIds).not('activated_at', 'is', null)
      : Promise.resolve({ data: [] }),
  ])

  const allEnrollments = enrollmentsRes.data ?? []
  const approvedEnrollments = allEnrollments.filter((e) => e.status === 'approved')
  const totalStudents = new Set(approvedEnrollments.map((e) => e.student_id)).size

  // عدد الطلاب المقبولين لكل كورس — أساس مقام نسب الحضور والتسليمات
  const approvedCountByCourse = new Map<string, number>()
  for (const e of approvedEnrollments) {
    approvedCountByCourse.set(e.course_id, (approvedCountByCourse.get(e.course_id) ?? 0) + 1)
  }

  const heldSessions = sessionsRes.data ?? []
  let attendanceRate: number | null = null
  if (heldSessions.length > 0) {
    const sessionIds = heldSessions.map((s) => s.id)
    const { data: approvedRecords } = await supabase
      .from('attendance_records')
      .select('id')
      .in('session_id', sessionIds)
      .eq('status', 'approved')

    const denominator = heldSessions.reduce((sum, s) => sum + (approvedCountByCourse.get(s.course_id) ?? 0), 0)
    if (denominator > 0) {
      attendanceRate = Math.round(((approvedRecords?.length ?? 0) / denominator) * 100)
    }
  }

  // ===== النشاط الحي الآن: كل عنصر مفعّل حالياً عبر الأنواع الخمسة =====
  const [{ data: activeExams }, { data: activeChallenges }, { data: activeSurveys }, { data: activeAssignments }, { data: activeSessions }] = await Promise.all([
    courseIds.length ? supabase.from('exams').select('id, title, course_id').eq('trainer_id', uid).eq('is_active', true) : Promise.resolve({ data: [] }),
    courseIds.length ? supabase.from('challenges').select('id, title, course_id').eq('trainer_id', uid).eq('is_active', true) : Promise.resolve({ data: [] }),
    supabase.from('surveys').select('id, title, course_id').eq('trainer_id', uid).eq('is_active', true),
    courseIds.length ? supabase.from('assignments').select('id, title, course_id').eq('trainer_id', uid).eq('is_active', true) : Promise.resolve({ data: [] }),
    courseIds.length ? supabase.from('attendance_sessions').select('id, title, course_id').eq('trainer_id', uid).eq('is_active', true) : Promise.resolve({ data: [] }),
  ])

  const examList = activeExams ?? []
  const challengeList = activeChallenges ?? []
  const surveyList = activeSurveys ?? []
  const assignmentList = activeAssignments ?? []
  const sessionList = activeSessions ?? []

  const [examSubs, challengeSubs, surveyResps, assignmentSubs, attendanceRecs] = await Promise.all([
    examList.length ? supabase.from('exam_submissions').select('exam_id').in('exam_id', examList.map((x) => x.id)).not('submitted_at', 'is', null) : Promise.resolve({ data: [] }),
    challengeList.length ? supabase.from('challenge_submissions').select('challenge_id').in('challenge_id', challengeList.map((x) => x.id)) : Promise.resolve({ data: [] }),
    surveyList.length ? supabase.from('survey_responses').select('survey_id').in('survey_id', surveyList.map((x) => x.id)) : Promise.resolve({ data: [] }),
    assignmentList.length ? supabase.from('assignment_submissions').select('assignment_id').in('assignment_id', assignmentList.map((x) => x.id)) : Promise.resolve({ data: [] }),
    sessionList.length ? supabase.from('attendance_records').select('session_id').in('session_id', sessionList.map((x) => x.id)).eq('status', 'approved') : Promise.resolve({ data: [] }),
  ])

  function countBy(rows: Record<string, unknown>[] | null, key: string): Map<string, number> {
    const m = new Map<string, number>()
    for (const r of rows ?? []) {
      const k = r[key] as string
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }

  const examSubCount = countBy(examSubs.data, 'exam_id')
  const challengeSubCount = countBy(challengeSubs.data, 'challenge_id')
  const surveyRespCount = countBy(surveyResps.data, 'survey_id')
  const assignmentSubCount = countBy(assignmentSubs.data, 'assignment_id')
  const attendanceRecCount = countBy(attendanceRecs.data, 'session_id')

  const activeItems: ActiveItem[] = [
    ...examList.map((x) => ({
      id: x.id, type: 'exam' as const, title: x.title, courseTitle: courseTitleById.get(x.course_id) ?? '—',
      href: `/exams/${x.id}/results`, table: 'exams',
      submitted: examSubCount.get(x.id) ?? 0, total: approvedCountByCourse.get(x.course_id) ?? 0,
    })),
    ...challengeList.map((x) => ({
      id: x.id, type: 'challenge' as const, title: x.title, courseTitle: courseTitleById.get(x.course_id) ?? '—',
      href: `/challenges/${x.id}/results`, table: 'challenges',
      submitted: challengeSubCount.get(x.id) ?? 0, total: approvedCountByCourse.get(x.course_id) ?? 0,
    })),
    ...surveyList.map((x) => ({
      id: x.id, type: 'survey' as const, title: x.title, courseTitle: x.course_id ? courseTitleById.get(x.course_id) ?? '—' : 'عام',
      href: `/surveys/${x.id}/results`, table: 'surveys',
      submitted: surveyRespCount.get(x.id) ?? 0, total: x.course_id ? approvedCountByCourse.get(x.course_id) ?? 0 : totalStudents,
    })),
    ...assignmentList.map((x) => ({
      id: x.id, type: 'assignment' as const, title: x.title, courseTitle: courseTitleById.get(x.course_id) ?? '—',
      href: `/assignments/${x.id}`, table: 'assignments',
      submitted: assignmentSubCount.get(x.id) ?? 0, total: approvedCountByCourse.get(x.course_id) ?? 0,
    })),
    ...sessionList.map((x) => ({
      id: x.id, type: 'attendance' as const, title: x.title, courseTitle: courseTitleById.get(x.course_id) ?? '—',
      href: `/attendance/${x.id}`, table: 'attendance_sessions',
      submitted: attendanceRecCount.get(x.id) ?? 0, total: approvedCountByCourse.get(x.course_id) ?? 0,
    })),
  ]

  // ===== التحليلات المدمجة: متوسط الامتحانات، الشارات، شعبية الكورسات، المتصدرون =====
  const { data: allExams } = await supabase.from('exams').select('id, title').eq('trainer_id', uid)
  const allExamIds = (allExams ?? []).map((e) => e.id)
  const { data: allSubmissions } = allExamIds.length
    ? await supabase.from('exam_submissions').select('exam_id, student_id, percentage, student:profiles!student_id(full_name)').in('exam_id', allExamIds).not('submitted_at', 'is', null)
    : { data: [] }

  const studentIds = Array.from(new Set(approvedEnrollments.map((e) => e.student_id)))
  const { count: badgesEarnedCount } = studentIds.length
    ? await supabase.from('student_badges').select('id', { count: 'exact', head: true }).in('student_id', studentIds)
    : { count: 0 }

  const popularityData = (courses.data ?? []).map((c) => ({
    label: c.title.slice(0, 14),
    value: approvedEnrollments.filter((e) => e.course_id === c.id).length,
  }))

  const examAvgMap = new Map<string, { sum: number; count: number; title: string }>()
  const studentAvgMap = new Map<string, { sum: number; count: number; name: string }>()
  let overallSum = 0
  let overallCount = 0

  for (const s of allSubmissions ?? []) {
    const pct = s.percentage ?? 0
    overallSum += pct
    overallCount += 1

    const examTitle = (allExams ?? []).find((e) => e.id === s.exam_id)?.title ?? '—'
    const examEntry = examAvgMap.get(s.exam_id) ?? { sum: 0, count: 0, title: examTitle }
    examEntry.sum += pct
    examEntry.count += 1
    examAvgMap.set(s.exam_id, examEntry)

    const studentName = (s.student as { full_name?: string } | null)?.full_name ?? 'طالب'
    const studentEntry = studentAvgMap.get(s.student_id) ?? { sum: 0, count: 0, name: studentName }
    studentEntry.sum += pct
    studentEntry.count += 1
    studentAvgMap.set(s.student_id, studentEntry)
  }

  const examAvgData = Array.from(examAvgMap.values()).map((e) => ({
    label: e.title.slice(0, 14),
    value: Math.round(e.sum / e.count),
  }))

  const leaderboard = Array.from(studentAvgMap.values())
    .map((s) => ({ name: s.name, avg: Math.round(s.sum / s.count), count: s.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5)

  const overallAvg = overallCount > 0 ? Math.round(overallSum / overallCount) : 0

  // ===== آخر النشاطات =====
  const assignmentIds = (await supabase.from('assignments').select('id').eq('trainer_id', uid)).data?.map((a) => a.id) ?? []

  const [recentExamSubs, recentAssignmentSubs] = await Promise.all([
    allExamIds.length
      ? supabase.from('exam_submissions').select('submitted_at, student:profiles!student_id(full_name), exam:exams(title)').in('exam_id', allExamIds).not('submitted_at', 'is', null).order('submitted_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    assignmentIds.length
      ? supabase.from('assignment_submissions').select('submitted_at, student:profiles!student_id(full_name), assignment:assignments(title)').in('assignment_id', assignmentIds).order('submitted_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
  ])

  type Activity = { type: 'enroll' | 'exam' | 'assignment'; time: string; text: string }
  const activities: Activity[] = [
    ...allEnrollments
      .slice()
      .sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime())
      .slice(0, 5)
      .map((e) => {
        const courseTitle = (e.course as unknown as { title?: string } | null)?.title ?? ''
        return {
          type: 'enroll' as const,
          time: e.enrolled_at,
          text: `طلب التحاق ${e.status === 'pending' ? 'جديد' : e.status === 'approved' ? 'مقبول' : 'مرفوض'} بكورس "${courseTitle}"`,
        }
      }),
    ...(recentExamSubs.data ?? []).map((s) => {
      const studentName = (s.student as unknown as { full_name?: string } | null)?.full_name ?? 'طالب'
      const examTitle = (s.exam as unknown as { title?: string } | null)?.title ?? ''
      return { type: 'exam' as const, time: s.submitted_at as string, text: `${studentName} سلّم امتحان "${examTitle}"` }
    }),
    ...(recentAssignmentSubs.data ?? []).map((s) => {
      const studentName = (s.student as unknown as { full_name?: string } | null)?.full_name ?? 'طالب'
      const assignmentTitle = (s.assignment as unknown as { title?: string } | null)?.title ?? ''
      return { type: 'assignment' as const, time: s.submitted_at as string, text: `${studentName} سلّم واجب "${assignmentTitle}"` }
    }),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6)

  const ACTIVITY_ICON = { enroll: UserPlus, exam: FileText, assignment: FileCheck }

  const stats = [
    { title: 'عدد الطلاب', value: totalStudents, icon: <Users />, variant: 'blue' as const },
    { title: 'تدريبات', value: coursesRes.count ?? 0, icon: <BookOpen />, variant: 'white' as const },
    { title: 'الامتحانات', value: examsRes.count ?? 0, icon: <FileText />, variant: 'lime' as const },
    { title: 'نسبة الحضور', value: attendanceRate !== null ? `${attendanceRate}%` : '—', icon: <CalendarCheck />, variant: 'white' as const },
    { title: 'متوسط درجات الامتحانات', value: `${overallAvg}%`, icon: <Trophy />, variant: 'white' as const },
    { title: 'شارات مُنحت لطلابك', value: badgesEarnedCount ?? 0, icon: <Award />, variant: 'lime' as const },
  ]

  return (
    <>
      <Header title="لوحة التحكم" />
      <main className="p-6 flex flex-col gap-6">
        <PlatformAdsBar />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s) => (
            <StatsCard key={s.title} {...s} />
          ))}
        </div>

        <section>
          <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
            <Zap size={19} className="text-ruwad-blue" /> النشاط الحي الآن
            {activeItems.length > 0 && (
              <span className="text-xs font-extrabold bg-ruwad-blue/10 text-ruwad-blue rounded-full px-2.5 py-0.5">{activeItems.length}</span>
            )}
          </h2>
          <ActiveItemsPanel initial={activeItems} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-ruwad shadow-card p-6">
            <h2 className="text-lg font-bold text-ruwad-navy mb-4">شعبية التدريبات (عدد الطلاب المقبولين)</h2>
            <AnalyticsBarChart data={popularityData} color="#3A4EFB" />
          </section>

          <section className="bg-white rounded-ruwad shadow-card p-6">
            <h2 className="text-lg font-bold text-ruwad-navy mb-4">متوسط الدرجة لكل امتحان</h2>
            <AnalyticsBarChart data={examAvgData} color="#E3FF3B" unit="%" />
          </section>
        </div>

        <section className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-ruwad-blue" /> أفضل 5 طلاب (متوسط درجات الامتحانات)
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد بيانات كافية بعد.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {leaderboard.map((s, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60">
                  <span className="w-7 h-7 rounded-full bg-ruwad-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-ruwad-navy font-medium">{s.name}</span>
                  <span className="text-xs text-ruwad-navy/50">{s.count} امتحان</span>
                  <span className="font-bold text-ruwad-navy">{s.avg}%</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">آخر النشاطات</h2>
          {activities.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm">
              لا توجد نشاطات حتى الآن. ابدأ بإنشاء كورس أو امتحان جديد.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {activities.map((a, idx) => {
                const Icon = ACTIVITY_ICON[a.type]
                return (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 rounded-full bg-ruwad-gray/30 flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-ruwad-blue" />
                    </span>
                    <span className="flex-1 text-ruwad-navy">{a.text}</span>
                    <span className="text-xs text-ruwad-navy/40 flex items-center gap-1 shrink-0">
                      <Clock size={12} /> {new Date(a.time).toLocaleDateString('ar')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
