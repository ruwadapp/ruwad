import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ChallengeForm } from '@/components/trainer/ChallengeForm'
import { ChallengeQuestionManager } from '@/components/trainer/ChallengeQuestionManager'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { Trophy } from 'lucide-react'

export default async function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: challenge }, { data: courses }] = await Promise.all([
    supabase.from('challenges').select('*').eq('id', id).eq('trainer_id', user!.id).single(),
    supabase.from('courses').select('*').eq('trainer_id', user!.id),
  ])

  if (!challenge) notFound()

  const { data: questions } = await supabase
    .from('challenge_questions')
    .select('*')
    .eq('challenge_id', id)
    .order('order_index', { ascending: true })

  return (
    <>
      <Header title={challenge.title} />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end gap-3">
          <DeleteButton table="challenges" id={id} redirectTo="/challenges" label="حذف التحدي" />
          <Link href={`/challenges/${id}/results`} className="bg-ruwad-navy text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition flex items-center gap-2">
            <Trophy size={18} /> عرض الترتيب
          </Link>
        </div>
        <ChallengeForm initialChallenge={challenge} courses={courses ?? []} />
        <ChallengeQuestionManager challengeId={id} questions={questions ?? []} />
      </main>
    </>
  )
}
