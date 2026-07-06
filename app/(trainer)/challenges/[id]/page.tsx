import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ChallengeForm } from '@/components/trainer/ChallengeForm'
import { ChallengeQuestionManager } from '@/components/trainer/ChallengeQuestionManager'
import { StartChallengeSessionButton } from '@/components/trainer/StartChallengeSessionButton'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { ShareManager } from '@/components/shared/ShareManager'
import { getTrainerInstitutes, getResourceShares } from '@/lib/utils/getTrainerInstitutes'
import { Building2, Trophy } from 'lucide-react'

export default async function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await supabase.from('challenges').select('*').eq('id', id).single()
  if (!challenge) notFound()

  const actingAsInstituteAdmin = challenge.trainer_id !== user!.id
  const [{ data: courses }, institutes, sharedInstituteIds] = await Promise.all([
    supabase.from('courses').select('*').eq('trainer_id', challenge.trainer_id),
    actingAsInstituteAdmin ? Promise.resolve([]) : getTrainerInstitutes(supabase, user!.id),
    actingAsInstituteAdmin ? Promise.resolve([]) : getResourceShares(supabase, 'challenges', id),
  ])

  const { data: questions } = await supabase
    .from('challenge_questions')
    .select('*')
    .eq('challenge_id', id)
    .order('order_index', { ascending: true })

  return (
    <>
      <Header title={challenge.title} />
      <main className="p-6 flex flex-col gap-6">
        {actingAsInstituteAdmin && (
          <div className="bg-ruwad-blue/10 text-ruwad-blue text-sm font-semibold rounded-ruwad-sm px-4 py-3 flex items-center gap-2">
            <Building2 size={16} /> تُعدّل هذا التحدي بصفتك مدير المعهد، بما أن المدرب فعّل مشاركته مع معهدك.
          </div>
        )}
        <div className="flex justify-end gap-3 flex-wrap">
          {institutes.length > 0 && (
            <ShareManager resourceType="challenges" resourceId={id} institutes={institutes} initialSharedInstituteIds={sharedInstituteIds} />
          )}
          <DeleteButton table="challenges" id={id} redirectTo="/challenges" label="حذف التحدي" />
          <Link href={`/challenges/${id}/results`} className="bg-white border-2 border-ruwad-gray text-ruwad-navy px-5 py-2.5 rounded-ruwad-sm font-semibold hover:bg-ruwad-gray/20 transition flex items-center gap-2">
            <Trophy size={18} /> سجل النتائج
          </Link>
          <StartChallengeSessionButton challengeId={id} hasQuestions={(questions?.length ?? 0) > 0} />
        </div>
        <ChallengeForm initialChallenge={challenge} courses={courses ?? []} />
        <ChallengeQuestionManager challengeId={id} questions={questions ?? []} />
      </main>
    </>
  )
}


