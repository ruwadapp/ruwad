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

  // لا مفتاح أجنبي بين المشاركات والكورسات (resource_id عام) — فنجلبها على خطوتين
  const [{ data: shares }, { data: trainerMembers }] = await Promise.all([
    supabase.from('resource_institute_shares')
      .select('id, resource_id, origin, created_at')
      .eq('resource_type', 'courses').eq('institute_id', institute.id)
      .order('created_at', { ascending: false }),
    supabase.from('institute_members')
      .select('user_id, profile:profiles!user_id(full_name)')
      .eq('institute_id', institute.id).eq('member_role', 'trainer').eq('status', 'approved'),
  ])

  const courseIds = (shares ?? []).map((s) => s.resource_id)
  const [{ data: courses }, { data: enrollRows }] = await Promise.all([
    courseIds.length
      ? supabase.from('courses')
          .select('id, title, description, cover_image, status, created_at, trainer:profiles!trainer_id(id, full_name, avatar_url), lectures(count)')
          .in('id', courseIds)
      : Promise.resolve({ data: [] as never[] }),
    courseIds.length
      ? supabase.from('enrollments').select('course_id').eq('status', 'approved').in('course_id', courseIds)
      : Promise.resolve({ data: [] as never[] }),
  ])
  const courseById = new Map((courses ?? []).map((c) => [c.id, c]))
  const counts = new Map<string, number>()
  for (const r of (enrollRows ?? []) as { course_id: string }[]) counts.set(r.course_id, (counts.get(r.course_id) ?? 0) + 1)

  const items = (shares ?? [])
    .map((s) => ({
      share_id: s.id,
      origin: s.origin as 'trainer' | 'institute',
      course: courseById.get(s.resource_id) as never,
      students: counts.get(s.resource_id) ?? 0,
    }))
    .filter((x) => x.course)

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="التدريبات" />
      <main className="p-4 sm:p-6 max-w-6xl mx-auto">
        <InstituteCoursesBoard instituteId={institute.id} initial={items as never} trainers={(trainerMembers ?? []) as never} />
      </main>
    </div>
  )
}
