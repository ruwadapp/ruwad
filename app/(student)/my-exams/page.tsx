import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { FileText, CheckCircle2, Clock, Hourglass, PenLine } from 'lucide-react'

export default async function MyExamsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const { data: enrollments } = await supabase
    .from('enrollments').select('course_id').eq('student_id', uid).eq('status', 'approved')
  const courseIds = (enrollments ?? []).map((e) => e.course_id)

  const { data: submissions } = await supabase
    .from('exam_submissions')
    .select('exam_id, submitted_at, score, total_marks, percentage, passed, graded_at')
    .eq('student_id', uid)

  const submittedExamIds = (submissions ?? []).map((s) => s.exam_id)

  // ===== فقط امتحانات كورساتي، أو امتحانات سبق وخضتها (حتى لو أُلغي ربطها بالكورس لاحقاً) =====
  const relevantIds = Array.from(new Set([...courseIds.length ? [] : [], ...submittedExamIds]))
  const orFilter = courseIds.length
    ? `course_id.in.(${courseIds.join(',')}),id.in.(${relevantIds.length ? relevantIds.join(',') : '00000000-0000-0000-0000-000000000000'})`
    : `id.in.(${relevantIds.length ? relevantIds.join(',') : '00000000-0000-0000-0000-000000000000'})`

  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .or(orFilter)
    .order('created_at', { ascending: false })

  const submissionMap = new Map((submissions ?? []).map((s) => [s.exam_id, s]))
  const now = new Date()

  return (
    <>
      <Header title="امتحاناتي" />
      <main className="p-6 flex flex-col gap-4">
        {!exams || exams.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <FileText className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد امتحانات متاحة حالياً. امتحانات كورساتك تظهر هنا تلقائياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.filter((e) => e.is_active || submissionMap.has(e.id)).map((exam) => {
              const submission = submissionMap.get(exam.id)
              const submitted = submission?.submitted_at
              const pendingGrading = submitted && !submission?.graded_at
              const notYetOpen = exam.starts_at && now < new Date(exam.starts_at)
              const closed = exam.ends_at && now > new Date(exam.ends_at)

              return (
                <Link
                  key={exam.id}
                  href={`/my-exams/${exam.id}`}
                  className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad transition"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{exam.title}</h3>
                    {submitted ? (
                      <CheckCircle2 size={20} className="text-ruwad-blue shrink-0" />
                    ) : (
                      <Clock size={20} className="text-ruwad-navy/30 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">
                    {exam.description || 'بلا وصف'}
                  </p>

                  {submitted ? (
                    pendingGrading ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit bg-amber-100 text-amber-700">
                        <PenLine size={12} /> بانتظار التصحيح اليدوي
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${
                          submission?.passed ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {exam.show_results ? `${submission?.percentage}% — ${submission?.passed ? 'ناجح' : 'غير ناجح'}` : 'تم التسليم'}
                      </span>
                    )
                  ) : notYetOpen ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit bg-ruwad-gray/30 text-ruwad-navy/60">
                      <Clock size={12} /> يبدأ {new Date(exam.starts_at!).toLocaleDateString('ar')}
                    </span>
                  ) : closed ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit bg-red-50 text-red-500">
                      <Hourglass size={12} /> انتهى وقته
                    </span>
                  ) : (
                    <span className="text-xs text-ruwad-navy/50">
                      {exam.duration_minutes ? `${exam.duration_minutes} دقيقة` : 'بلا حد زمني'}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
