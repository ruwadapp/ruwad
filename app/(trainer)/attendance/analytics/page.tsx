import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AttendanceAnalytics } from '@/components/trainer/AttendanceAnalytics'

export default async function AttendanceAnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="إحصاءات الحضور" />
      <main className="p-6">
        <AttendanceAnalytics courses={courses ?? []} />
      </main>
    </>
  )
}
