import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { RadarBoard, type RadarItem } from '@/components/shared/RadarBoard'

export const dynamic = 'force-dynamic'

export default async function InstituteRadarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user!.id).single()
  if (!institute) redirect('/org/dashboard')

  const { data: shares } = await supabase.from('resource_institute_shares')
    .select('resource_id').eq('institute_id', institute.id).eq('resource_type', 'courses')
  const courseIds = (shares ?? []).map((s) => s.resource_id)
  const { data: sharedCourses } = courseIds.length
    ? await supabase.from('courses').select('id, title').in('id', courseIds).eq('status', 'published')
    : { data: [] }

  const [{ data: leads }, { data: requests }, { data: inquiries }] = await Promise.all([
    supabase.from('interest_leads').select('*').neq('status', 'closed').order('created_at', { ascending: false }).limit(60),
    supabase.from('training_requests')
      .select('*, student:profiles!student_id(full_name, avatar_url), training_offers(count)')
      .eq('status', 'open').order('created_at', { ascending: false }).limit(60),
    supabase.from('institute_inquiries')
      .select('*, course:courses(title)').eq('institute_id', institute.id)
      .neq('stage', 'closed').order('created_at', { ascending: false }).limit(100),
  ])

  const items: RadarItem[] = [
    ...(leads ?? []).map((l): RadarItem => ({
      kind: 'lead', id: l.id, name: l.full_name, topic: l.training_type, detail: l.notes,
      phone: l.phone, createdAt: l.created_at, status: l.status, claimedByMe: l.claimed_by === user!.id,
    })),
    ...(requests ?? []).map((r): RadarItem => {
      const student = r.student as unknown as { full_name?: string; avatar_url?: string | null }
      return {
        kind: 'request', id: r.id, name: student?.full_name ?? 'طالب', avatar: student?.avatar_url ?? null,
        studentId: r.student_id, topic: r.topic, detail: r.details, city: r.city, mode: r.mode,
        createdAt: r.created_at, status: r.status, claimedByMe: false, offersCount: r.training_offers?.[0]?.count ?? 0,
      }
    }),
    ...(inquiries ?? []).map((i): RadarItem => ({
      kind: 'inquiry', id: i.id, name: i.full_name,
      topic: (i.course as unknown as { title?: string })?.title ?? 'استفسار عام',
      detail: i.message, phone: i.phone, courseTitle: (i.course as unknown as { title?: string })?.title ?? null,
      createdAt: i.created_at, status: i.stage, claimedByMe: false,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <Header title="الرادار" />
      <main className="p-4 sm:p-6">
        <RadarBoard items={items} role="institute_admin" offerCourses={sharedCourses ?? []} />
      </main>
    </>
  )
}
