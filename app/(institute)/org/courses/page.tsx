import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { InstituteCoursesBoard } from '@/components/institute/InstituteCoursesBoard'

export default async function InstituteCoursesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: institute } = await supabase
    .from('institutes').select('id').eq('owner_id', session!.user.id).single()
  if (!institute) redirect('/org/dashboard')

  const [{ data: shares }, { data: trainerMembers }] = await Promise.all([
    supabase.from('resource_institute_shares')
      .select(`id, origin,
               course:courses(id, title, description, cover_image, status, created_at,
                 trainer:profiles!trainer_id(id, full_name, avatar_url),
                 lectures(count))`)
      .eq('resource_type', 'courses').eq('institute_id', institute.id)
      .order('created_at', { ascending: false }),
    supabase.from('institute_members')
      .select('user_id, profile:profiles!user_id(full_name)')
      .eq('institute_id', institute.id).eq('member_role', 'trainer').eq('status', 'approved'),
  ])

  // عدد الطلاب المقبولين لكل تدريب (استعلام واحد مجمّع)
  const courseIds = (shares ?? []).map((s) => (s.course as never as { id: string } | null)?.id).filter(Boolean) as string[]
  const { data: enrollRows } = courseIds.length
    ? await supabase.from('enrollments').select('course_id').eq('status', 'approved').in('course_id', courseIds)
    : { data: [] }
  const counts = new Map<string, number>()
  for (const r of enrollRows ?? []) counts.set(r.course_id, (counts.get(r.course_id) ?? 0) + 1)

  const items = (shares ?? [])
    .filter((s) => s.course)
    .map((s) => ({
      share_id: s.id,
      origin: s.origin as 'trainer' | 'institute',
      course: s.course as never,
      students: counts.get((s.course as never as { id: string }).id) ?? 0,
    }))

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="التدريبات" />
      <main className="p-4 sm:p-6 max-w-6xl mx-auto">
        <InstituteCoursesBoard instituteId={institute.id} initial={items as never} trainers={(trainerMembers ?? []) as never} />
      </main>
    </div>
  )
}
