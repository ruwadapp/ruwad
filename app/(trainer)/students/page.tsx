import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { EnrollmentRequests } from '@/components/trainer/EnrollmentRequests'
import { StudentsRoster } from '@/components/institute/StudentsRoster'

// طلابي: قائمة موحّدة محسوبة من كل التسجيلات عبر كورساتي (لا عضوية مباشرة منفصلة —
// العلاقة بالطالب تمر دوماً عبر كورس، وهذه الصفحة تجمّعها في مكان واحد)
export default async function StudentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: courses } = await supabase.from('courses').select('id, title, status').eq('trainer_id', user!.id)
  const courseIds = (courses ?? []).map((c) => c.id)
  const publishedCourses = (courses ?? []).filter((c) => c.status === 'published').map((c) => ({ id: c.id, title: c.title }))

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('*, student:profiles!student_id(full_name, avatar_url), course:courses(title)')
    .in('course_id', courseIds.length ? courseIds : ['00000000-0000-0000-0000-000000000000'])
    .order('enrolled_at', { ascending: false })

  if (enrollmentsError) {
    return (
      <>
        <Header title="الطلاب" />
        <main className="p-6">
          <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">
            تعذّر تحميل الطلاب: {enrollmentsError.message}
          </div>
        </main>
      </>
    )
  }

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
    .map((s) => ({ ...s, outstanding: [] as { currency: string; amount: number }[] }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'))

  return (
    <>
      <Header title="الطلاب" />
      <main className="p-4 sm:p-6 flex flex-col gap-6">
        <StudentsRoster students={rosterStudents} publishedCourses={publishedCourses} />
        <EnrollmentRequests courses={courses ?? []} initial={enrollments ?? []} />
      </main>
    </>
  )
}
