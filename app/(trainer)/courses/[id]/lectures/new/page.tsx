import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { LectureForm } from '@/components/trainer/LectureForm'

export default async function NewLecturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!course) notFound()

  const { count } = await supabase
    .from('lectures')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id)

  return (
    <>
      <Header title={`محاضرة جديدة — ${course.title}`} />
      <main className="p-6">
        <LectureForm courseId={id} nextOrderIndex={count ?? 0} />
      </main>
    </>
  )
}
