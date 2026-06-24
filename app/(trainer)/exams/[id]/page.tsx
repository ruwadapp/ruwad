import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ExamForm } from '@/components/trainer/ExamForm'
import { QuestionManager } from '@/components/trainer/QuestionManager'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { BarChart3 } from 'lucide-react'

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!exam) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', id)
    .order('order_index', { ascending: true })

  return (
    <>
      <Header title={exam.title} />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end gap-3">
          <DeleteButton table="exams" id={id} redirectTo="/exams" label="حذف الامتحان" />
          <Link
            href={`/exams/${id}/results`}
            className="bg-ruwad-navy text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition flex items-center gap-2"
          >
            <BarChart3 size={18} /> عرض النتائج
          </Link>
        </div>
        <ExamForm initialExam={exam} />
        <QuestionManager examId={id} questions={questions ?? []} />
      </main>
    </>
  )
}
