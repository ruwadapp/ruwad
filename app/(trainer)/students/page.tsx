import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { EnrollmentRequests } from '@/components/trainer/EnrollmentRequests'

export default async function StudentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: courses } = await supabase.from('courses').select('id').eq('trainer_id', user!.id)
  const courseIds = (courses ?? []).map((c) => c.id)

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, student:profiles(full_name, avatar_url), course:courses(title)')
    .in('course_id', courseIds.length ? courseIds : ['00000000-0000-0000-0000-000000000000'])
    .order('enrolled_at', { ascending: false })

  return (
    <>
      <Header title="الطلاب" />
      <main className="p-6">
        <EnrollmentRequests courseIds={courseIds} initial={enrollments ?? []} />
      </main>
    </>
  )
}
