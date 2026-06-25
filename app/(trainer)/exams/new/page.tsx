import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ExamForm } from '@/components/trainer/ExamForm'

export default async function NewExamPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: courses } = await supabase.from('courses').select('*').eq('trainer_id', user!.id)

  return (
    <>
      <Header title="امتحان جديد" />
      <main className="p-6">
        <ExamForm courses={courses ?? []} />
      </main>
    </>
  )
}
