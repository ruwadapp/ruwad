import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { LectureViewer } from '@/components/student/LectureViewer'

export default async function StudentLecturePage({
  params,
}: {
  params: Promise<{ id: string; lectureId: string }>
}) {
  const { id, lectureId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', id)
    .eq('student_id', user!.id)
    .eq('status', 'approved')
    .maybeSingle()

  if (!enrollment) redirect('/my-courses')

  const { data: lecture } = await supabase
    .from('lectures')
    .select('*')
    .eq('id', lectureId)
    .eq('course_id', id)
    .eq('is_published', true)
    .single()

  if (!lecture) notFound()

  const { count: totalPublishedLectures } = await supabase
    .from('lectures')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id)
    .eq('is_published', true)

  const { data: progressRow } = await supabase
    .from('lecture_progress')
    .select('completed')
    .eq('student_id', user!.id)
    .eq('lecture_id', lectureId)
    .maybeSingle()

  return (
    <>
      <Header title={lecture.title} />
      <main className="p-6">
        <LectureViewer
          lecture={lecture}
          courseId={id}
          totalPublishedLectures={totalPublishedLectures ?? 0}
          initiallyCompleted={progressRow?.completed ?? false}
        />
      </main>
    </>
  )
}
