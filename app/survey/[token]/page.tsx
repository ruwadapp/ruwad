import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SurveyResponseForm } from '@/components/public/SurveyResponseForm'

export const dynamic = 'force-dynamic'

export default async function PublicSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServerSupabaseClient()

  const { data: survey } = await supabase
    .from('surveys')
    .select('*')
    .eq('share_token', token)
    .eq('is_active', true)
    .single()

  if (!survey) notFound()

  const { data: questions } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('survey_id', survey.id)
    .order('order_index', { ascending: true })

  return (
    <main className="min-h-screen bg-[#F5F6FA] p-6" dir="rtl">
      <SurveyResponseForm survey={survey} questions={questions ?? []} />
    </main>
  )
}
