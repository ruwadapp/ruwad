import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AssignmentForm } from '@/components/trainer/AssignmentForm'

export default async function NewAssignmentPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: courses } = await supabase.from('courses').select('*').eq('trainer_id', user!.id)

  return (
    <>
      <Header title="واجب جديد" />
      <main className="p-6">
        <AssignmentForm courses={courses ?? []} />
      </main>
    </>
  )
}
