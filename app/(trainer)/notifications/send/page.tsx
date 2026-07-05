import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AnnouncementComposer } from '@/components/trainer/AnnouncementComposer'

export default async function SendNotificationPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="إرسال إشعار" />
      <main className="p-6 flex flex-col gap-6">
        <AnnouncementComposer courses={courses ?? []} />
      </main>
    </>
  )
}
