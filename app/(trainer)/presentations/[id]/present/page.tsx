import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { PresenterLiveView } from '@/components/trainer/PresenterLiveView'

export default async function PresentPage({
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

  const { data: presentation } = await supabase
    .from('presentations')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!presentation) notFound()

  const { data: slides } = await supabase
    .from('presentation_slides')
    .select('*')
    .eq('presentation_id', id)
    .order('order_index', { ascending: true })

  if (!slides || slides.length === 0) redirect(`/presentations/${id}`)

  let session = null
  if (sessionId) {
    const { data } = await supabase.from('presentation_sessions').select('*').eq('id', sessionId).eq('trainer_id', user!.id).single()
    session = data
  }

  if (!session) {
    const { data: latest } = await supabase
      .from('presentation_sessions')
      .select('*')
      .eq('presentation_id', id)
      .eq('trainer_id', user!.id)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    session = latest
  }

  if (!session) redirect(`/presentations/${id}`)

  return (
    <>
      <Header title={`عرض مباشر — ${presentation.title}`} />
      <main className="p-6">
        <PresenterLiveView session={session} slides={slides} />
      </main>
    </>
  )
}
