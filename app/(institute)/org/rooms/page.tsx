import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { RoomsManager } from '@/components/institute/RoomsManager'

export default async function InstituteRoomsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: institute } = await supabase
    .from('institutes').select('id').eq('owner_id', session!.user.id).single()
  if (!institute) redirect('/org/dashboard')

  const [{ data: rooms }, { data: statuses }, { data: shares }] = await Promise.all([
    supabase.from('institute_rooms').select('*').eq('institute_id', institute.id).order('name'),
    supabase.rpc('institute_rooms_status', { p_institute_id: institute.id }),
    supabase.from('resource_institute_shares').select('resource_id')
      .eq('resource_type', 'courses').eq('institute_id', institute.id),
  ])

  // الحجوزات القادمة (وجارية اليوم) لقاعات المعهد + كورسات المعهد للاختيار
  const roomIds = (rooms ?? []).map((r) => r.id)
  const courseIds = (shares ?? []).map((s) => s.resource_id)
  const [{ data: bookings }, { data: courses }] = await Promise.all([
    roomIds.length
      ? supabase.from('calendar_events')
          .select('id, title, starts_at, ends_at, room_id, course:courses(title)')
          .in('room_id', roomIds)
          .gte('starts_at', new Date(Date.now() - 12 * 3600000).toISOString())
          .order('starts_at').limit(200)
      : Promise.resolve({ data: [] as never[] }),
    courseIds.length
      ? supabase.from('courses').select('id, title').in('id', courseIds).order('title')
      : Promise.resolve({ data: [] as never[] }),
  ])

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="القاعات" />
      <main className="p-4 sm:p-6 max-w-4xl mx-auto">
        <RoomsManager
          instituteId={institute.id}
          initialRooms={(rooms ?? []).map((r) => ({ ...r, equipment: Array.isArray(r.equipment) ? r.equipment : [] })) as never}
          statuses={(statuses ?? []) as never}
          bookings={(bookings ?? []) as never}
          courses={(courses ?? []) as never}
        />
      </main>
    </div>
  )
}
