import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ExamTaker } from '@/components/student/ExamTaker'
import { CheckCircle2, XCircle, Clock, Hourglass } from 'lucide-react'

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

  // ===== فرض النافذة الزمنية الحقيقية (إن وُجدت) قبل السماح بأي محاولة جديدة =====
  const now = new Date()
  if (!submission) {
    if (exam.starts_at && now < new Date(exam.starts_at)) {
      return (
        <>
          <Header title={exam.title} />
          <main className="p-6">
            <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
              <Clock size={48} className="text-ruwad-navy/40" />
              <h2 className="font-bold text-ruwad-navy">لم يبدأ هذا الامتحان بعد</h2>
              <p className="text-sm text-ruwad-navy/60">يبدأ في {new Date(exam.starts_at).toLocaleString('ar')}</p>
            </div>
          </main>
        </>
      )
    }
    if (exam.ends_at && now > new Date(exam.ends_at)) {
      return (
        <>
          <Header title={exam.title} />
          <main className="p-6">
            <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
              <Hourglass size={48} className="text-red-400" />
              <h2 className="font-bold text-ruwad-navy">انتهى وقت هذا الامتحان</h2>
              <p className="text-sm text-ruwad-navy/60">انتهى في {new Date(exam.ends_at).toLocaleString('ar')}</p>
            </div>
          </main>
        </>
      )
    }

    const { data: created } = await supabase
      .from('exam_submissions')
      .insert({ exam_id: id, student_id: user!.id, answers: {} })
      .select()
      .single()
    submission = created
  }

  // إذا تم التسليم — عرض النتيجة بدل خوض الامتحان من جديد
  if (submission?.submitted_at) {
    const passed = submission.passed
    const needsManualGrading = !submission.graded_at

    return (
      <>
        <Header title={exam.title} />
        <main className="p-6">
          <div className="max-w-md mx-auto">
            {needsManualGrading ? (
              <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col items-center gap-4 text-center">
                <Hourglass size={48} className="text-amber-500" />
                <h2 className="text-xl font-bold text-ruwad-navy">بانتظار التصحيح اليدوي</h2>
                <p className="text-ruwad-navy/60 text-sm">هذا الامتحان يحتوي أسئلة مقالية يصحّحها المدرب يدوياً. ستظهر نتيجتك النهائية بعد اكتمال التصحيح.</p>
              </div>
            ) : exam.show_results ? (
              <div
                className={`relative overflow-hidden rounded-ruwad shadow-ruwad-lg p-10 flex flex-col items-center gap-3 text-center ${
                  passed ? 'bg-ruwad-gradient' : 'bg-ruwad-navy'
                }`}
              >
                <div className="absolute -top-14 -right-14 w-44 h-44 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-ruwad-lime/20 rounded-full blur-3xl" />

                {passed ? (
                  <span className="relative text-6xl">🎉</span>
                ) : (
                  <XCircle size={56} className="relative text-white/70" />
                )}

                <h2 className="relative text-4xl font-extrabold text-white mt-1">
                  {submission.percentage}%
                </h2>
                <p className="relative text-white/70 text-sm">
                  {submission.score} من {submission.total_marks} درجة
                </p>

                <span
                  className={`relative text-sm font-bold px-4 py-1.5 rounded-full mt-1 ${
                    passed ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-white/15 text-white'
                  }`}
                >
                  {passed ? 'ناجح ✓' : 'غير ناجح'}
                </span>

                {exam.allow_review && (
                  <Link
                    href={`/my-exams/${id}/review`}
                    className="relative bg-white text-ruwad-navy px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition mt-4"
                  >
                    مراجعة الإجابات
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col items-center gap-4 text-center">
                <CheckCircle2 size={48} className="text-ruwad-blue" />
                <h2 className="text-xl font-bold text-ruwad-navy">تم تسليم إجابتك بنجاح</h2>
                <p className="text-ruwad-navy/60 text-sm">ستظهر النتيجة لاحقاً من المدرب.</p>
                {exam.allow_review && (
                  <Link
                    href={`/my-exams/${id}/review`}
                    className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition mt-2"
                  >
                    مراجعة الإجابات
                  </Link>
                )}
              </div>
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
        {exam.ends_at && (
          <div className="bg-amber-50 text-amber-700 text-sm rounded-ruwad-sm px-4 py-2.5 mb-4 flex items-center gap-2">
            <Clock size={15} /> ينتهي هذا الامتحان في {new Date(exam.ends_at).toLocaleString('ar')}
          </div>
        )}
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
