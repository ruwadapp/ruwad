import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { SurveyForm } from '@/components/trainer/SurveyForm'
import { SurveyQuestionManager } from '@/components/trainer/SurveyQuestionManager'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { BarChart3 } from 'lucide-react'

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: survey } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!survey) notFound()

  const { data: questions } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('survey_id', id)
    .order('order_index', { ascending: true })

  return (
    <>
      <Header title={survey.title} />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end gap-3">
          <DeleteButton table="surveys" id={id} redirectTo="/surveys" label="حذف الاستبيان" />
          <Link
            href={`/surveys/${id}/results`}
            className="bg-ruwad-navy text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition flex items-center gap-2"
          >
            <BarChart3 size={18} /> عرض النتائج
          </Link>
        </div>
        <SurveyForm initialSurvey={survey} />
        <SurveyQuestionManager surveyId={id} questions={questions ?? []} />
      </main>
    </>
  )
}
