import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ChallengeForm } from '@/components/trainer/ChallengeForm'
import { ChallengeQuestionManager } from '@/components/trainer/ChallengeQuestionManager'
import { ChallengeSubmissionsGrader } from '@/components/trainer/ChallengeSubmissionsGrader'
import { StartChallengeSessionButton } from '@/components/trainer/StartChallengeSessionButton'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { ShareManager } from '@/components/shared/ShareManager'
import { InheritedShareNote } from '@/components/shared/InheritedShareNote'
import { getTrainerInstitutes, getResourceShares } from '@/lib/utils/getTrainerInstitutes'
import { Building2, Trophy } from 'lucide-react'

export default async function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await supabase.from('challenges').select('*').eq('id', id).single()
  if (!challenge) notFound()

  const isQuiz = challenge.challenge_type === 'quiz'
  const actingAsInstituteAdmin = challenge.trainer_id !== user!.id
  const [{ data: courses }, institutes, sharedInstituteIds] = await Promise.all([
    supabase.from('courses').select('*').eq('trainer_id', challenge.trainer_id),
    actingAsInstituteAdmin ? Promise.resolve([]) : getTrainerInstitutes(supabase, user!.id),
    actingAsInstituteAdmin ? Promise.resolve([]) : getResourceShares(supabase, 'challenges', id),
  ])

  const { data: questions } = isQuiz
    ? await supabase.from('challenge_questions').select('*').eq('challenge_id', id).order('order_index', { ascending: true })
    : { data: [] }

  const { data: submissions } = !isQuiz
    ? await supabase
        .from('challenge_submissions')
        .select('*, student:profiles!student_id(full_name)')
        .eq('challenge_id', id)
        .order('submitted_at', { ascending: false })
    : { data: [] }

  return (
    <>
      <Header title={challenge.title} />
      <main className="p-6 flex flex-col gap-6">
        {actingAsInstituteAdmin && (
          <div className="bg-ruwad-blue/10 text-ruwad-blue text-sm font-semibold rounded-ruwad-sm px-4 py-3 flex items-center gap-2">
            <Building2 size={16} /> تُعدّل هذا التحدي بصفتك مدير المعهد، بما أن المدرب فعّل مشاركته مع معهدك.
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 [&>*]:w-full sm:[&>*]:w-auto [&>*]:flex [&>*]:justify-center">
          {challenge.course_id ? (
            <InheritedShareNote courseId={challenge.course_id} />
          ) : (
            institutes.length > 0 && (
              <ShareManager resourceType="challenges" resourceId={id} institutes={institutes} initialSharedInstituteIds={sharedInstituteIds} />
            )
          )}
          <DeleteButton table="challenges" id={id} redirectTo="/challenges" label="حذف التحدي" />
          <Link href={`/challenges/${id}/results`} className="bg-white border-2 border-ruwad-gray text-ruwad-navy px-5 py-2.5 rounded-ruwad-sm font-semibold hover:bg-ruwad-gray/20 transition flex items-center gap-2">
            <Trophy size={18} /> سجل النتائج
          </Link>
          {isQuiz && <StartChallengeSessionButton challengeId={id} hasQuestions={(questions?.length ?? 0) > 0} />}
        </div>
        <ChallengeForm initialChallenge={challenge} courses={courses ?? []} />

        {isQuiz ? (
          <ChallengeQuestionManager challengeId={id} questions={questions ?? []} />
        ) : (
          <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-ruwad-navy">التسليمات</h2>
              <p className="text-xs text-ruwad-navy/50 mt-1">
                هذا النوع من التحديات لا يحتاج أسئلة ولا جلسة مباشرة — يرسل الطالب تسليمه من صفحة التحدي لديه، وتُصحّحه أنت يدوياً هنا.
              </p>
            </div>
            <ChallengeSubmissionsGrader
              submissions={submissions ?? []}
              challengeType={challenge.challenge_type as 'coding' | 'upload' | 'practical'}
              totalMarks={challenge.total_marks}
            />
          </div>
        )}
      </main>
    </>
  )
}



