import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CourseCalendar } from '@/components/calendar/CourseCalendar'

export default async function InstituteCalendarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase
    .from('institutes').select('id').eq('owner_id', user!.id).single()
  if (!institute) redirect('/org/dashboard')

  // الكورسات المشتركة مع هذا المعهد فقط — هي وحدها ما يحق للمعهد جدولته
  const { data: shares } = await supabase
    .from('resource_institute_shares')
    .select('resource_id')
    .eq('resource_type', 'courses')
    .eq('institute_id', institute.id)
  const courseIds = (shares ?? []).map((s) => s.resource_id)
  const { data: courses } = courseIds.length
    ? await supabase.from('courses').select('id, title').in('id', courseIds).order('title')
    : { data: [] }

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="التقويم" />
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {courseIds.length === 0 && (
          <p className="mb-4 text-sm font-bold text-ruwad-navy/60 bg-white border-2 border-ruwad-gray rounded-ruwad-sm px-4 py-3">
            لا توجد تدريبات مشاركة مع معهدك بعد — عندما يشارك مدرب تدريباً معك ستتمكن من جدولة مواعيده هنا.
          </p>
        )}
        <CourseCalendar meta={{ mode: 'institute', userId: user!.id, instituteId: institute.id, courses: courses ?? [] }} />
      </div>
    </div>
  )
}
