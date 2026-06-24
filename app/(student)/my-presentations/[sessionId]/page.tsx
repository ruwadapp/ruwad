import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { StudentLiveView } from '@/components/student/StudentLiveView'

export const dynamic = 'force-dynamic'

export default async function StudentPresentationPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: session } = await supabase.from('presentation_sessions').select('*').eq('id', sessionId).single()
  if (!session) notFound()

  // تأكيد الانضمام (في حال فتح الرابط مباشرة بدون المرور بصفحة إدخال الكود)
  await supabase.from('presentation_participants').upsert(
    { session_id: sessionId, student_id: user!.id },
    { onConflict: 'session_id,student_id' }
  )

  const { data: presentation } = await supabase.from('presentations').select('title').eq('id', session.presentation_id).single()

  const { data: slides } = await supabase
    .from('presentation_slides')
    .select('*')
    .eq('presentation_id', session.presentation_id)
    .order('order_index', { ascending: true })

  if (!slides) redirect('/my-presentations')

  return (
    <>
      <Header title={presentation?.title ?? 'عرض مباشر'} />
      <main className="p-6">
        <StudentLiveView session={session} slides={slides} />
      </main>
    </>
  )
}
