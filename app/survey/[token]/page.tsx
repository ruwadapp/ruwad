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

  const [{ data: questions }, { data: sections }] = await Promise.all([
    supabase.from('survey_questions').select('*').eq('survey_id', survey.id).order('order_index', { ascending: true }),
    supabase.from('survey_sections').select('*').eq('survey_id', survey.id).order('order_index', { ascending: true }),
  ])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F6FA]" dir="rtl">
      {/* فقاعات ضوء خفيفة بألوان الهوية — خلفية فاتحة موحّدة طوال الصفحة (لا تعتمد على موضع التمرير) */}
      <div className="fixed -top-20 -right-24 w-96 h-96 bg-ruwad-blue/15 rounded-full blur-3xl animate-blob-float -z-10" />
      <div className="fixed top-10 -left-20 w-80 h-80 bg-ruwad-lime/20 rounded-full blur-3xl animate-blob-float-slow -z-10" />
      <div className="fixed top-1/2 right-1/3 w-64 h-64 bg-ruwad-blue-light/10 rounded-full blur-3xl animate-blob-float -z-10" />

      <div className="relative p-4 sm:p-6">
        <SurveyResponseForm survey={survey} questions={questions ?? []} sections={sections ?? []} />
      </div>
    </main>
  )
}
