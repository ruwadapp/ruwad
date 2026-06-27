import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { EssayGrader } from '@/components/trainer/EssayGrader'
import { gradeExam } from '@/lib/utils/gradeExam'
import type { Question } from '@/lib/types'

export default async function GradeEssaysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: exam } = await supabase.from('exams').select('*').eq('id', id).eq('trainer_id', user!.id).single()
  if (!exam) notFound()

  const { data: questions } = await supabase.from('questions').select('*').eq('exam_id', id).order('order_index', { ascending: true })
  const essayQuestions = (questions ?? []).filter((q) => q.question_type === 'essay')

  if (essayQuestions.length === 0) redirect(`/exams/${id}`)

  const { data: submissions } = await supabase
    .from('exam_submissions')
    .select('*, student:profiles!student_id(full_name)')
    .eq('exam_id', id)
    .not('submitted_at', 'is', null)

  const nonEssayQuestions = (questions ?? []).filter((q) => q.question_type !== 'essay') as Question[]
  const autoGradedScore: Record<string, number> = {}
  for (const s of submissions ?? []) {
    autoGradedScore[s.id] = gradeExam(nonEssayQuestions, s.answers).score
  }

  const rows = (submissions ?? []).map((s) => ({
    id: s.id,
    student_id: s.student_id,
    student_name: (s.student as unknown as { full_name?: string } | null)?.full_name ?? 'طالب',
    answers: s.answers,
    essay_scores: s.essay_scores ?? {},
    graded_at: s.graded_at,
    total_marks: s.total_marks ?? exam.total_marks,
    passing_marks: exam.passing_marks,
  }))

  return (
    <>
      <Header title={`تصحيح مقالي — ${exam.title}`} />
      <main className="p-6">
        <EssayGrader
          essayQuestions={essayQuestions.map((q) => ({ id: q.id, question_text: q.question_text, marks: q.marks }))}
          autoGradedScore={autoGradedScore}
          initial={rows}
        />
      </main>
    </>
  )
}
