import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ChallengePlayerLiveView } from '@/components/student/ChallengePlayerLiveView'

export const dynamic = 'force-dynamic'

export default async function StudentChallengeLivePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: session } = await supabase.from('challenge_sessions').select('*').eq('id', sessionId).single()
  if (!session) notFound()

  await supabase.from('challenge_session_participants').upsert(
    { session_id: sessionId, student_id: user!.id },
    { onConflict: 'session_id,student_id' }
  )

  const { data: challenge } = await supabase.from('challenges').select('title').eq('id', session.challenge_id).single()

  return (
    <>
      <Header title={challenge?.title ?? 'تحدٍ مباشر'} />
      <main className="p-6">
        <ChallengePlayerLiveView session={session} />
      </main>
    </>
  )
}
