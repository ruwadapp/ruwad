import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { SurveyImportButton } from '@/components/trainer/SurveyImportButton'
import { SharedSurveysList } from '@/components/shared/SharedSurveysList'
import { SurveyShareManager } from '@/components/shared/SurveyShareManager'
import { Plus, ClipboardList, MessageSquare, Pencil, BarChart3 } from 'lucide-react'

export default async function InstituteSurveysPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id, name').eq('owner_id', user!.id).single()
  if (!institute) redirect('/org/dashboard')

  const [{ data: surveys }, { data: sharedRows }, { data: memberRows }] = await Promise.all([
    supabase
      .from('surveys')
      .select('*, survey_questions(count), survey_responses(count)')
      .eq('institute_id', institute.id)
      .order('created_at', { ascending: false }),
    supabase.from('survey_shares').select('survey_id').eq('shared_with_type', 'institute').eq('shared_with_id', institute.id),
    supabase.from('institute_members').select('user_id, trainer:profiles!user_id(full_name)').eq('institute_id', institute.id).eq('member_role', 'trainer').eq('status', 'approved'),
  ])

  const trainers = (memberRows ?? []).map((m: any) => ({ id: m.user_id, name: m.trainer?.full_name ?? 'مدرب' }))

  const sharedSurveyIds = (sharedRows ?? []).map((r) => r.survey_id)
  const { data: sharedSurveysRaw } = sharedSurveyIds.length
    ? await supabase.from('surveys').select('id, title, description, trainer:profiles!trainer_id(full_name)').in('id', sharedSurveyIds)
    : { data: [] }
  const sharedSurveys = (sharedSurveysRaw ?? []).map((s: any) => ({
    id: s.id, title: s.title, description: s.description, ownerName: s.trainer?.full_name ?? 'مدرب',
  }))

  const surveyIds = (surveys ?? []).map((s) => s.id)
  const { data: myShares } = surveyIds.length
    ? await supabase.from('survey_shares').select('survey_id, shared_with_id').eq('shared_with_type', 'trainer').in('survey_id', surveyIds)
    : { data: [] }
  const shareMap: Record<string, string[]> = {}
  for (const r of myShares ?? []) { (shareMap[r.survey_id] ??= []).push(r.shared_with_id) }

  return (
    <>
      <Header title="الاستبيانات" />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end gap-3">
          <SurveyImportButton instituteId={institute.id} redirectBase="/org/surveys" />
          <Link
            href="/org/surveys/new"
            className="bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad flex items-center gap-2"
          >
            <Plus size={18} /> استبيان جديد
          </Link>
        </div>

        <SharedSurveysList
          surveys={sharedSurveys}
          asOwnerType="institute"
          ownerId={institute.id}
          resultsHrefBase="/org/surveys"
          cloneRedirectBase="/org/surveys"
        />

        {!surveys || surveys.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <ClipboardList className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد استبيانات حتى الآن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {surveys.map((survey, idx) => (
              <div
                key={survey.id}
                className={`relative overflow-hidden rounded-ruwad shadow-card hover:shadow-ruwad-lg transition-shadow p-6 flex flex-col gap-3 ${
                  idx % 2 === 0 ? 'bg-ruwad-gradient text-white' : 'bg-ruwad-lime text-ruwad-navy'
                }`}
              >
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="relative flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg line-clamp-1">{survey.title}</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                    idx % 2 === 0 ? (survey.is_active ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-white/20 text-white') : (survey.is_active ? 'bg-ruwad-navy text-white' : 'bg-white/40 text-ruwad-navy/70')
                  }`}>
                    {survey.is_active ? 'نشط' : 'متوقف'}
                  </span>
                </div>
                <p className={`relative text-sm line-clamp-2 min-h-[2.5rem] ${idx % 2 === 0 ? 'text-white/75' : 'text-ruwad-navy/70'}`}>
                  {survey.description || 'بلا وصف'}
                </p>
                <div className={`relative flex items-center gap-4 text-sm ${idx % 2 === 0 ? 'text-white/70' : 'text-ruwad-navy/60'}`}>
                  <span className="flex items-center gap-1.5">
                    <ClipboardList size={16} /> {survey.survey_questions?.[0]?.count ?? 0} سؤال
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={16} /> {survey.survey_responses?.[0]?.count ?? 0} رد
                  </span>
                </div>

                <div className={`relative flex items-center gap-1.5 mt-1 pt-3 border-t flex-wrap ${idx % 2 === 0 ? 'border-white/20' : 'border-ruwad-navy/15'}`}>
                  <Link href={`/org/surveys/${survey.id}`} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-ruwad-sm transition ${idx % 2 === 0 ? 'bg-white/15 hover:bg-white/25' : 'bg-ruwad-navy/10 hover:bg-ruwad-navy/20'}`}>
                    <Pencil size={13} /> تعديل
                  </Link>
                  <Link href={`/org/surveys/${survey.id}/results`} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-ruwad-sm transition ${idx % 2 === 0 ? 'bg-white/15 hover:bg-white/25' : 'bg-ruwad-navy/10 hover:bg-ruwad-navy/20'}`}>
                    <BarChart3 size={13} /> النتائج
                  </Link>
                  {trainers.length > 0 && (
                    <SurveyShareManager
                      surveyId={survey.id}
                      targetType="trainer"
                      targets={trainers}
                      initialSharedIds={shareMap[survey.id] ?? []}
                    />
                  )}
                  <DeleteButton table="surveys" id={survey.id} label="حذف" confirmText="حذف الاستبيان سيحذف معه كل أسئلته وردود المشاركين فيه نهائياً. متابعة؟" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

