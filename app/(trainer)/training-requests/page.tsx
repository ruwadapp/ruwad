import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { TrainingRequestsBoard } from '@/components/shared/TrainingRequestsBoard'

export const dynamic = 'force-dynamic'

export default async function TrainerTrainingRequestsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myCourses } = await supabase
    .from('courses').select('id, title').eq('trainer_id', user!.id).order('created_at', { ascending: false })

  return (
    <>
      <Header title="طلبات التدريب" />
      <main className="p-6"><TrainingRequestsBoard offerCourses={myCourses ?? []} /></main>
    </>
  )
}
