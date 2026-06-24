import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ExamTaker } from '@/components/student/ExamTaker'
import { CheckCircle2, XCircle } from 'lucide-react'

export default async function TakeExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!exam) notFound()

  let { data: submission } = await supabase
    .from('exam_submissions')
    .select('*')
    .eq('exam_id', id)
    .eq('student_id', user!.id)
    .maybeSingle()

  if (!submission) {
    const { data: created } = await supabase
      .from('exam_submissions')
      .insert({ exam_id: id, student_id: user!.id, answers: {} })
      .select()
      .single()
    submission = created
  }

  // إذا تم التسليم — عرض النتيجة بدل خوض الامتحان من جديد
  if (submission?.submitted_at) {
    return (
      <>
        <Header title={exam.title} />
        <main className="p-6">
          <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col items-center gap-4 text-center max-w-md mx-auto">
            {exam.show_results ? (
              <>
                {submission.passed ? (
                  <CheckCircle2 size={48} className="text-ruwad-blue" />
                ) : (
                  <XCircle size={48} className="text-red-500" />
                )}
                <h2 className="text-2xl font-bold text-ruwad-navy">
                  {submission.score}/{submission.total_marks} ({submission.percentage}%)
                </h2>
                <span
                  className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                    submission.passed ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {submission.passed ? 'ناجح' : 'غير ناجح'}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 size={48} className="text-ruwad-blue" />
                <h2 className="text-xl font-bold text-ruwad-navy">تم تسليم إجابتك بنجاح</h2>
                <p className="text-ruwad-navy/60 text-sm">ستظهر النتيجة لاحقاً من المدرب.</p>
              </>
            )}

            {exam.allow_review && (
              <Link
                href={`/my-exams/${id}/review`}
                className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition mt-2"
              >
                مراجعة الإجابات
              </Link>
            )}
          </div>
        </main>
      </>
    )
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', id)
    .order('order_index', { ascending: true })

  const orderedQuestions = exam.shuffle_questions
    ? [...(questions ?? [])].sort(() => Math.random() - 0.5)
    : questions ?? []

  return (
    <>
      <Header title={exam.title} />
      <main className="p-6">
        {exam.instructions && (
          <div className="bg-ruwad-blue/5 rounded-ruwad p-4 mb-4 text-sm text-ruwad-navy">
            {exam.instructions}
          </div>
        )}
        <ExamTaker exam={exam} questions={orderedQuestions} submissionId={submission!.id} />
      </main>
    </>
  )
}
