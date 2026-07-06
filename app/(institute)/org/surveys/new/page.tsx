import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { SurveyForm } from '@/components/trainer/SurveyForm'

export default async function NewInstituteSurveyPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user!.id).single()
  if (!institute) redirect('/org/dashboard')

  return (
    <>
      <Header title="استبيان جديد للمعهد" />
      <main className="p-6">
        <SurveyForm instituteId={institute.id} redirectBase="/org/surveys" />
      </main>
    </>
  )
}
