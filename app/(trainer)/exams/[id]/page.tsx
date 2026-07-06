import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ExamForm } from '@/components/trainer/ExamForm'
import { QuestionManager } from '@/components/trainer/QuestionManager'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { ShareToggle } from '@/components/shared/ShareToggle'
import { getTrainerInstitute } from '@/lib/utils/getTrainerInstitute'
import { Building2, BarChart3, PenLine } from 'lucide-react'

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // لا نقيّد بـ trainer_id = المستخدم الحالي هنا؛ RLS (can_manage_shared_resource) هو من
  // يقرر الصلاحية الفعلية، وهذا ما يسمح لمدير المعهد بفتح وتعديل الامتحانات المُشارَكة معه.
  const { data: exam } = await supabase.from('exams').select('*').eq('id', id).single()
  if (!exam) notFound()

  const actingAsInstituteAdmin = exam.trainer_id !== user!.id
  const [{ data: courses }, institute] = await Promise.all([
    supabase.from('courses').select('*').eq('trainer_id', exam.trainer_id),
    actingAsInstituteAdmin ? Promise.resolve(null) : getTrainerInstitute(supabase, user!.id),
  ])

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
        {actingAsInstituteAdmin && (
          <div className="bg-ruwad-blue/10 text-ruwad-blue text-sm font-semibold rounded-ruwad-sm px-4 py-3 flex items-center gap-2">
            <Building2 size={16} /> تُعدّل هذا الامتحان بصفتك مدير المعهد، بما أن المدرب فعّل مشاركته مع المعهد.
          </div>
        )}
        <div className="flex justify-end gap-3 flex-wrap">
          {institute && (
            <ShareToggle table="exams" id={id} initialShared={exam.shared_with_institute} instituteName={institute.name} />
          )}
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

