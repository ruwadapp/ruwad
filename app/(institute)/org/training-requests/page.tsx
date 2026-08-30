import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { TrainingRequestsBoard } from '@/components/shared/TrainingRequestsBoard'

export const dynamic = 'force-dynamic'

export default async function InstituteTrainingRequestsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // كورسات المعهد: المشارَكة معه
  const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user!.id).single()
  const { data: shares } = institute
    ? await supabase.from('resource_institute_shares').select('resource_id').eq('institute_id', institute.id).eq('resource_type', 'courses')
    : { data: [] }
  const ids = (shares ?? []).map((s) => s.resource_id)
  const { data: sharedCourses } = ids.length
    ? await supabase.from('courses').select('id, title').in('id', ids)
    : { data: [] }

  return (
    <>
      <Header title="طلبات التدريب" />
      <main className="p-6"><TrainingRequestsBoard offerCourses={sharedCourses ?? []} /></main>
    </>
  )
}
