import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CourseCalendar } from '@/components/calendar/CourseCalendar'

export default async function StudentCalendarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // كورسات الطالب المقبولة فقط — للفلترة؛ الرؤية نفسها تفرضها RLS
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course:courses(id, title)')
    .eq('student_id', user!.id)
    .eq('status', 'approved')
  const courses = (enrollments ?? [])
    .map((e: any) => e.course).filter(Boolean)
    .map((c: any) => ({ id: c.id, title: c.title }))

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="التقويم" />
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <CourseCalendar meta={{ mode: 'student', userId: user!.id, courses }} />
      </div>
    </div>
  )
}
