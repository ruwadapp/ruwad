import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { LectureForm } from '@/components/trainer/LectureForm'
import { DeleteButton } from '@/components/shared/DeleteButton'

export default async function EditLecturePage({
  params,
}: {
  params: Promise<{ id: string; lectureId: string }>
}) {
  const { id, lectureId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!course) notFound()

  const { data: lecture } = await supabase
    .from('lectures')
    .select('*')
    .eq('id', lectureId)
    .eq('course_id', id)
    .single()

  if (!lecture) notFound()

  return (
    <>
      <Header title={`تعديل محاضرة — ${course.title}`} />
      <main className="p-6 flex flex-col gap-4">
        <div className="flex justify-end">
          <DeleteButton table="lectures" id={lectureId} redirectTo={`/courses/${id}`} label="حذف المحاضرة" />
        </div>
        <LectureForm courseId={id} nextOrderIndex={lecture.order_index} initialLecture={lecture} />
      </main>
    </>
  )
}
