import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { FileText, CheckCircle2, Clock } from 'lucide-react'

export default async function MyExamsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const { data: submissions } = await supabase
    .from('exam_submissions')
    .select('exam_id, submitted_at, score, total_marks, percentage, passed')
    .eq('student_id', user!.id)

  const submissionMap = new Map((submissions ?? []).map((s) => [s.exam_id, s]))

  return (
    <>
      <Header title="امتحاناتي" />
      <main className="p-6 flex flex-col gap-4">
        {!exams || exams.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <FileText className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد امتحانات متاحة حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => {
              const submission = submissionMap.get(exam.id)
              const submitted = submission?.submitted_at

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
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${
                        submission?.passed ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {exam.show_results ? `${submission?.percentage}% — ${submission?.passed ? 'ناجح' : 'غير ناجح'}` : 'تم التسليم'}
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
