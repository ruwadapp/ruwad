import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function JoinChallengeByLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('challenge_sessions')
    .select('id, status')
    .eq('session_code', code)
    .neq('status', 'ended')
    .maybeSingle()

  if (!session) notFound()

  await supabase.from('challenge_session_participants').upsert(
    { session_id: session.id, student_id: user.id },
    { onConflict: 'session_id,student_id' }
  )

  redirect(`/my-challenges/live/${session.id}`)
}
