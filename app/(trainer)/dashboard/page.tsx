import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { StatsCard } from '@/components/shared/StatsCard'
import { Users, BookOpen, FileText, CalendarCheck, FileCheck, UserPlus, Clock } from 'lucide-react'

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

  // حساب نسبة الحضور الفعلية عبر كل الجلسات المنعقدة لكورسات هذا المدرب
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

  // آخر النشاطات: تسجيلات + تسليمات امتحانات + تسليمات واجبات، مرتّبة زمنياً
  const examIds = courseIds.length ? (await supabase.from('exams').select('id').eq('trainer_id', uid)).data?.map((e) => e.id) ?? [] : []
  const assignmentIds = (await supabase.from('assignments').select('id').eq('trainer_id', uid)).data?.map((a) => a.id) ?? []

  const [recentExamSubs, recentAssignmentSubs] = await Promise.all([
    examIds.length
      ? supabase.from('exam_submissions').select('submitted_at, student:profiles!student_id(full_name), exam:exams(title)').in('exam_id', examIds).not('submitted_at', 'is', null).order('submitted_at', { ascending: false }).limit(5)
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
    { title: 'الكورسات', value: coursesRes.count ?? 0, icon: <BookOpen />, variant: 'white' as const },
    { title: 'الامتحانات', value: examsRes.count ?? 0, icon: <FileText />, variant: 'lime' as const },
    { title: 'نسبة الحضور', value: attendanceRate !== null ? `${attendanceRate}%` : '—', icon: <CalendarCheck />, variant: 'white' as const },
  ]

  return (
    <>
      <Header title="لوحة التحكم" />
      <main className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatsCard key={s.title} {...s} />
          ))}
        </div>

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
