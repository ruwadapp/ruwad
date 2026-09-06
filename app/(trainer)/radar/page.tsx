import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { RadarBoard, type RadarItem } from '@/components/shared/RadarBoard'

export const dynamic = 'force-dynamic'

export default async function TrainerRadarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: myCourses }, { data: leads }, { data: requests }] = await Promise.all([
    supabase.from('courses').select('id, title').eq('trainer_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('interest_leads').select('*').neq('status', 'closed').order('created_at', { ascending: false }).limit(60),
    supabase.from('training_requests')
      .select('*, student:profiles!student_id(full_name, avatar_url), training_offers(count)')
      .eq('status', 'open').order('created_at', { ascending: false }).limit(60),
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
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <Header title="الرادار" />
      <main className="p-4 sm:p-6">
        <RadarBoard items={items} role="trainer" offerCourses={myCourses ?? []} />
      </main>
    </>
  )
}
