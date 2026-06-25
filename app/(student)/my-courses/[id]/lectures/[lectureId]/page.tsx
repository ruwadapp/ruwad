import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
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
    .select('id, progress, course:courses(title)')
    .eq('course_id', id)
    .eq('student_id', user!.id)
    .eq('status', 'approved')
    .maybeSingle()

  if (!enrollment) redirect('/my-courses')

  const { data: allLectures } = await supabase
    .from('lectures')
    .select('*')
    .eq('course_id', id)
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  const lecture = (allLectures ?? []).find((l) => l.id === lectureId)
  if (!lecture) notFound()

  const { data: progressRows } = await supabase
    .from('lecture_progress')
    .select('lecture_id, completed')
    .eq('student_id', user!.id)

  const completedIds = new Set((progressRows ?? []).filter((p) => p.completed).map((p) => p.lecture_id))
  const courseTitle = (enrollment.course as unknown as { title?: string })?.title ?? ''

  return (
    <LectureViewer
      lecture={lecture}
      allLectures={allLectures ?? []}
      completedIds={Array.from(completedIds)}
      courseId={id}
      courseTitle={courseTitle}
      courseProgress={enrollment.progress ?? 0}
      initiallyCompleted={completedIds.has(lecture.id)}
    />
  )
}
