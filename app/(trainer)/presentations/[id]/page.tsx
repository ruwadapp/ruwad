import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { SlideManager } from '@/components/trainer/SlideManager'
import { StartSessionButton } from '@/components/trainer/StartSessionButton'
import { DeleteButton } from '@/components/shared/DeleteButton'

export default async function PresentationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  return (
    <>
      <Header title={presentation.title} />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end gap-3">
          <DeleteButton table="presentations" id={id} redirectTo="/presentations" label="حذف العرض" />
          <StartSessionButton presentationId={id} hasSlides={(slides?.length ?? 0) > 0} />
        </div>
        <SlideManager presentationId={id} slides={slides ?? []} />
      </main>
    </>
  )
}
