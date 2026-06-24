import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CourseForm } from '@/components/trainer/CourseForm'
import { LectureManager } from '@/components/trainer/LectureManager'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!course) notFound()

  const { data: lectures } = await supabase
    .from('lectures')
    .select('*')
    .eq('course_id', id)
    .order('order_index', { ascending: true })

  return (
    <>
      <Header title={course.title} />
      <main className="p-6 flex flex-col gap-6">
        <CourseForm initialCourse={course} />
        <LectureManager courseId={id} lectures={lectures ?? []} />
      </main>
    </>
  )
}
