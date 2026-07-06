import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { EnrollmentRequests } from '@/components/trainer/EnrollmentRequests'

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
    ? await supabase.from('courses').select('id, title').in('id', courseIds)
    : { data: [] }

  const { data: enrollments } = courseIds.length
    ? await supabase
        .from('enrollments')
        .select('*, student:profiles!student_id(full_name, avatar_url), course:courses(title)')
        .in('course_id', courseIds)
        .order('enrolled_at', { ascending: false })
    : { data: [] }

  return (
    <>
      <Header title="الطلاب" />
      <main className="p-6 flex flex-col gap-6">
        <p className="text-sm text-ruwad-navy/60 -mt-2">
          طلاب الكورسات التي شاركها معهدك المدربون تحديداً؛ يمكنك قبول أو رفض طلبات الالتحاق تماماً
          كما يفعل المدرب — أيّكما يوافق أولاً يُلتحق الطالب فوراً.
        </p>
        <EnrollmentRequests courses={courses ?? []} initial={enrollments ?? []} />
      </main>
    </>
  )
}
