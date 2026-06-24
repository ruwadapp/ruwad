import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ExamReview } from '@/components/student/ExamReview'

export default async function ExamReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: exam } = await supabase.from('exams').select('*').eq('id', id).single()
  if (!exam || !exam.allow_review) notFound()

  const { data: submission } = await supabase
    .from('exam_submissions')
    .select('*')
    .eq('exam_id', id)
    .eq('student_id', user!.id)
    .single()

  if (!submission || !submission.submitted_at) redirect(`/my-exams/${id}`)

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', id)
    .order('order_index', { ascending: true })

  return (
    <>
      <Header title={`مراجعة: ${exam.title}`} />
      <main className="p-6">
        <ExamReview questions={questions ?? []} submission={submission} />
      </main>
    </>
  )
}
