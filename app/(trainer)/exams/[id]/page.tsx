import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ExamForm } from '@/components/trainer/ExamForm'
import { QuestionManager } from '@/components/trainer/QuestionManager'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { BarChart3, PenLine } from 'lucide-react'

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: exam }, { data: courses }] = await Promise.all([
    supabase.from('exams').select('*').eq('id', id).eq('trainer_id', user!.id).single(),
    supabase.from('courses').select('*').eq('trainer_id', user!.id),
  ])

  if (!exam) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', id)
    .order('order_index', { ascending: true })

  const hasEssay = (questions ?? []).some((q) => q.question_type === 'essay')
  const { count: pendingGradingCount } = hasEssay
    ? await supabase.from('exam_submissions').select('id', { count: 'exact', head: true }).eq('exam_id', id).not('submitted_at', 'is', null).is('graded_at', null)
    : { count: 0 }

  return (
    <>
      <Header title={exam.title} />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end gap-3 flex-wrap">
          <DeleteButton table="exams" id={id} redirectTo="/exams" label="حذف الامتحان" />
          {hasEssay && (
            <Link
              href={`/exams/${id}/grade`}
              className="relative bg-amber-500 text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition flex items-center gap-2"
            >
              <PenLine size={18} /> تصحيح مقالي
              {(pendingGradingCount ?? 0) > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingGradingCount}
                </span>
              )}
            </Link>
          )}
          <Link
            href={`/exams/${id}/results`}
            className="bg-ruwad-navy text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition flex items-center gap-2"
          >
            <BarChart3 size={18} /> عرض النتائج
          </Link>
        </div>
        <ExamForm initialExam={exam} courses={courses ?? []} />
        <QuestionManager examId={id} questions={questions ?? []} />
      </main>
    </>
  )
}
