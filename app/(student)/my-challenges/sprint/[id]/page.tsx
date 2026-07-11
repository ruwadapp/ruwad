import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ChallengeSprintPlayer } from '@/components/student/ChallengeSprintPlayer'

export default async function ChallengeSprintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, title, challenge_type, is_active')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!challenge || challenge.challenge_type !== 'sprint') notFound()

  return (
    <>
      <Header title={challenge.title} />
      <main className="p-6">
        <ChallengeSprintPlayer challengeId={challenge.id} title={challenge.title} />
      </main>
    </>
  )
}
