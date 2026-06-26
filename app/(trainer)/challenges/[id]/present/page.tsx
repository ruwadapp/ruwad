import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ChallengeHostLiveView } from '@/components/trainer/ChallengeHostLiveView'

export default async function ChallengePresentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ session?: string }>
}) {
  const { id } = await params
  const { session: sessionId } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!challenge) notFound()

  const { data: questions } = await supabase
    .from('challenge_questions')
    .select('*')
    .eq('challenge_id', id)
    .order('order_index', { ascending: true })

  if (!questions || questions.length === 0) redirect(`/challenges/${id}`)

  let session = null
  if (sessionId) {
    const { data } = await supabase.from('challenge_sessions').select('*').eq('id', sessionId).eq('trainer_id', user!.id).single()
    session = data
  }

  if (!session) {
    const { data: latest } = await supabase
      .from('challenge_sessions')
      .select('*')
      .eq('challenge_id', id)
      .eq('trainer_id', user!.id)
      .neq('status', 'ended')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    session = latest
  }

  if (!session) redirect(`/challenges/${id}`)

  return (
    <>
      <Header title={`تحدٍ مباشر — ${challenge.title}`} />
      <main className="p-6">
        <ChallengeHostLiveView session={session} questions={questions} />
      </main>
    </>
  )
}
