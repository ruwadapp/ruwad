import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { EnrollmentRequests } from '@/components/trainer/EnrollmentRequests'
import { AwardBadgePanel } from '@/components/shared/AwardBadgePanel'
import { StudentsRoster } from '@/components/institute/StudentsRoster'

export default async function InstituteStudentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user!.id).single()
  if (!institute) redirect('/org/dashboard')

  const { data: shares } = await supabase
    .from('resource_institute_shares')
    .select('resource_id')
    .eq('institute_id', institute.id)
    .eq('resource_type', 'courses')

  const courseIds = (shares ?? []).map((s) => s.resource_id)
  const { data: courses } = courseIds.length
    ? await supabase.from('courses').select('id, title, status').in('id', courseIds)
    : { data: [] }
  const publishedCourses = (courses ?? []).filter((c) => c.status === 'published').map((c) => ({ id: c.id, title: c.title }))

  const { data: members } = await supabase
    .from('institute_members')
    .select('user_id')
    .eq('institute_id', institute.id)
    .eq('status', 'approved')
  const trainerIds = (members ?? []).map((m) => m.user_id)

  const { data: awardableBadges } = await supabase
    .from('badges')
    .select('id, name, icon, trainer_id')
    .or(trainerIds.length ? `trainer_id.is.null,trainer_id.in.(${trainerIds.join(',')})` : 'trainer_id.is.null')

  const [{ data: enrollments }, { data: dues }] = await Promise.all([
    courseIds.length
      ? supabase.from('enrollments')
          .select('*, student:profiles!student_id(full_name, avatar_url), course:courses(title)')
          .in('course_id', courseIds)
          .order('enrolled_at', { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    supabase.from('finance_ledger')
      .select('id, student_id, currency, amount, due_link, entry_type')
      .eq('institute_id', institute.id)
      .in('entry_type', ['due', 'income']),
  ])

  // مستحقات كل طالب المتبقية (مستحق − قبوض مرتبطة به)، مجمّعة بالعملة
  const paidByDue = new Map<string, number>()
  for (const l of dues ?? []) {
    if (l.entry_type === 'income' && l.due_link) paidByDue.set(l.due_link, (paidByDue.get(l.due_link) ?? 0) + Number(l.amount))
  }
  const outstandingByStudent = new Map<string, Map<string, number>>()
  for (const l of dues ?? []) {
    if (l.entry_type !== 'due') continue
    const remaining = Number(l.amount) - (paidByDue.get(l.id) ?? 0)
    if (remaining <= 0) continue
    const m = outstandingByStudent.get(l.student_id) ?? new Map<string, number>()
    m.set(l.currency, (m.get(l.currency) ?? 0) + remaining)
    outstandingByStudent.set(l.student_id, m)
  }

  // تجميع التسجيلات المقبولة حسب الطالب لحساب حالته (نشط/خرّيج)
  const studentMap = new Map<string, {
    student_id: string; full_name: string; avatar_url: string | null
    courses: { course_id: string; title: string; completed: boolean; progress: number }[]
  }>()
  for (const e of enrollments ?? []) {
    if (e.status !== 'approved') continue
    const student = e.student as unknown as { full_name?: string; avatar_url?: string | null } | null
    const course = e.course as unknown as { title?: string } | null
    if (!student?.full_name) continue
    const row = studentMap.get(e.student_id) ?? {
      student_id: e.student_id, full_name: student.full_name, avatar_url: student.avatar_url ?? null,
      courses: [] as { course_id: string; title: string; completed: boolean; progress: number }[],
    }
    row.courses.push({ course_id: e.course_id, title: course?.title ?? '', completed: !!e.completed_at, progress: Number(e.progress ?? 0) })
    studentMap.set(e.student_id, row)
  }
  const rosterStudents = [...studentMap.values()]
    .map((s) => ({ ...s, outstanding: [...(outstandingByStudent.get(s.student_id)?.entries() ?? [])].map(([currency, amount]) => ({ currency, amount })) }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'))

  return (
    <>
      <Header title="الطلاب" />
      <main className="p-4 sm:p-6 flex flex-col gap-6">
        <p className="text-sm text-ruwad-navy/60 -mt-2">
          طلاب الكورسات التي شاركها معهدك المدربون تحديداً؛ يمكنك قبول أو رفض طلبات الالتحاق تماماً
          كما يفعل المدرب — أيّكما يوافق أولاً يُلتحق الطالب فوراً.
        </p>
        <AwardBadgePanel
          students={(() => {
            const m = new Map<string, string>()
            for (const e of enrollments ?? []) {
              if (e.status !== 'approved') continue
              const name = (e.student as unknown as { full_name?: string })?.full_name
              if (name && !m.has(e.student_id)) m.set(e.student_id, name)
            }
            return [...m.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'ar'))
          })()}
          badges={(awardableBadges ?? []).map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        />

        <StudentsRoster students={rosterStudents} publishedCourses={publishedCourses} />

        <EnrollmentRequests courses={courses ?? []} initial={enrollments ?? []} />
      </main>
    </>
  )
}
