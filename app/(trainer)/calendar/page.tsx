import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CourseCalendar } from '@/components/calendar/CourseCalendar'

export default async function TrainerCalendarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: courses }, { data: memberships }] = await Promise.all([
    supabase.from('courses').select('id, title').eq('trainer_id', user!.id).order('title'),
    supabase.from('institute_members')
      .select('institute:institutes(id, name)')
      .eq('user_id', user!.id).eq('member_role', 'trainer').eq('status', 'approved'),
  ])
  const institutes = (memberships ?? [])
    .map((m) => m.institute as never as { id: string; name: string } | null)
    .filter((i): i is { id: string; name: string } => !!i)

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="التقويم" />
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <CourseCalendar meta={{ mode: 'trainer', userId: user!.id, courses: courses ?? [], institutes }} />
      </div>
    </div>
  )
}
