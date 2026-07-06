import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { SurveyForm } from '@/components/trainer/SurveyForm'
import { SurveyQuestionManager } from '@/components/trainer/SurveyQuestionManager'
import { SurveyExportButton } from '@/components/trainer/SurveyExportButton'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { SurveyShareManager } from '@/components/shared/SurveyShareManager'
import { CloneSurveyButton } from '@/components/shared/CloneSurveyButton'
import { getTrainerInstitutes } from '@/lib/utils/getTrainerInstitutes'
import { BarChart3, Building2 } from 'lucide-react'

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // لا نقيّد بـ trainer_id هنا؛ RLS تسمح أيضاً لمن شُورك معه الاستبيان (نسخ/عرض نتائج فقط)
  const { data: survey } = await supabase.from('surveys').select('*').eq('id', id).single()
  if (!survey) notFound()

  const isOwner = survey.trainer_id === user!.id

  if (!isOwner) {
    // مُشارَك مع هذا المدرب من معهد — عرض فقط + إمكانية النسخ، بلا تعديل يسبب تعارضاً
    return (
      <>
        <Header title={survey.title} />
        <main className="p-6 flex flex-col gap-6 max-w-2xl">
          <div className="bg-ruwad-blue/10 text-ruwad-blue text-sm font-semibold rounded-ruwad-sm px-4 py-3 flex items-center gap-2">
            <Building2 size={16} /> استبيان شارَكه معك أحد المعاهد — يمكنك عرض نتائجه أو نسخه ليصبح استبياناً خاصاً بك.
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-ruwad-navy">{survey.title}</h2>
            {survey.description && <p className="text-sm text-ruwad-navy/60">{survey.description}</p>}
            <div className="flex items-center gap-3 pt-2">
              <Link href={`/surveys/${id}/results`} className="flex items-center gap-2 bg-ruwad-navy text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition">
                <BarChart3 size={18} /> عرض النتائج
              </Link>
              <CloneSurveyButton surveyId={id} asOwnerType="trainer" ownerId={user!.id} redirectBase="/surveys" />
            </div>
          </div>
        </main>
      </>
    )
  }

  const [{ data: questions }, { data: sections }, institutes, { data: shareRows }] = await Promise.all([
    supabase.from('survey_questions').select('*').eq('survey_id', id).order('order_index', { ascending: true }),
    supabase.from('survey_sections').select('*').eq('survey_id', id).order('order_index', { ascending: true }),
    getTrainerInstitutes(supabase, user!.id),
    supabase.from('survey_shares').select('shared_with_id').eq('survey_id', id).eq('shared_with_type', 'institute'),
  ])

  return (
    <>
      <Header title={survey.title} />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end gap-3 flex-wrap">
          <SurveyShareManager
            surveyId={id}
            targetType="institute"
            targets={institutes}
            initialSharedIds={(shareRows ?? []).map((r) => r.shared_with_id)}
          />
          <SurveyExportButton survey={survey} questions={questions ?? []} sections={sections ?? []} />
          <DeleteButton table="surveys" id={id} redirectTo="/surveys" label="حذف الاستبيان" />
          <Link
            href={`/surveys/${id}/results`}
            className="bg-ruwad-navy text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition flex items-center gap-2"
          >
            <BarChart3 size={18} /> عرض النتائج
          </Link>
        </div>
        <SurveyForm initialSurvey={survey} />
        <SurveyQuestionManager surveyId={id} questions={questions ?? []} initialSections={sections ?? []} />
      </main>
    </>
  )
}

