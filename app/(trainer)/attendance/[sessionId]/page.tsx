import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AttendancePanel } from '@/components/trainer/AttendancePanel'

export default async function AttendanceSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('trainer_id', user!.id)
    .single()

  if (!session) notFound()

  const { data: records } = await supabase
    .from('attendance_records')
    .select('*, student:profiles(full_name, avatar_url)')
    .eq('session_id', sessionId)
    .order('checked_in_at', { ascending: true })

  return (
    <>
      <Header title={session.title} />
      <main className="p-6">
        <AttendancePanel session={session} initialRecords={records ?? []} />
      </main>
    </>
  )
}
