import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ChallengeForm } from '@/components/trainer/ChallengeForm'

export default async function NewChallengePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: courses } = await supabase.from('courses').select('*').eq('trainer_id', user!.id)

  return (
    <>
      <Header title="تحدي جديد" />
      <main className="p-6">
        <ChallengeForm courses={courses ?? []} />
      </main>
    </>
  )
}
