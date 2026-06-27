import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AnalyticsBarChart } from '@/components/trainer/AnalyticsBarChart'
import { ResetAttemptButton } from '@/components/trainer/ResetAttemptButton'
import { ExportResultsCsvButton } from '@/components/shared/ExportResultsCsvButton'
import { Trophy, BarChart3 } from 'lucide-react'

const MEDALS = ['🥇', '🥈', '🥉']

export default async function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [{ data: submissions }, { data: questions }] = await Promise.all([
    supabase
      .from('exam_submissions')
      .select('*, student:profiles!student_id(full_name, avatar_url)')
      .eq('exam_id', id)
      .not('submitted_at', 'is', null)
      .order('score', { ascending: false }),
    supabase.from('questions').select('*').eq('exam_id', id).order('order_index', { ascending: true }),
  ])

  const list = submissions ?? []
  const avgPercentage = list.length
    ? Math.round(list.reduce((s, sub) => s + (sub.percentage ?? 0), 0) / list.length)
    : 0
  const passRate = list.length
    ? Math.round((list.filter((s) => s.passed).length / list.length) * 100)
    : 0

  const top3 = list.slice(0, 3)
  const podiumOrder = top3.length === 3 ? [1, 0, 2] : top3.map((_, i) => i)
  const podiumHeight = ['h-28', 'h-36', 'h-24']

  // ===== صعوبة كل سؤال (نسبة الإجابة الصحيحة) — للأسئلة القابلة للتصحيح الآلي فقط =====
  const gradableQuestions = (questions ?? []).filter((q) => q.question_type !== 'essay')
  const difficultyData = gradableQuestions.map((q, idx) => {
    const answeredList = list.filter((s) => s.answers && s.answers[q.id] !== undefined)
    const correctCount = answeredList.filter((s) => {
      const studentAnswer = s.answers[q.id]
      if (q.question_type === 'short_answer') {
        return typeof studentAnswer === 'string' && typeof q.correct_answer === 'string'
          && studentAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
      }
      return studentAnswer === q.correct_answer
    }).length
    const pct = list.length ? Math.round((correctCount / list.length) * 100) : 0
    return { label: `س${idx + 1}`, value: pct }
  })

  const exportRows = list.map((sub) => ({
    name: sub.student?.full_name ?? '—',
    score: sub.score ?? 0,
    total: sub.total_marks ?? 0,
    percentage: sub.percentage ?? 0,
    passed: !!sub.passed,
  }))

  return (
    <>
      <Header title={`نتائج: ${exam.title}`} />
      <main className="p-6 flex flex-col gap-6">
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-8">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-ruwad-lime/20 rounded-full blur-3xl" />

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-5">
              <p className="text-sm text-white/70">عدد المشاركين</p>
              <p className="text-3xl font-bold text-white mt-1">{list.length}</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-5">
              <p className="text-sm text-white/70">متوسط الدرجة</p>
              <p className="text-3xl font-bold text-white mt-1">{avgPercentage}%</p>
            </div>
            <div className="bg-ruwad-lime rounded-ruwad-sm p-5">
              <p className="text-sm text-ruwad-navy/70">نسبة النجاح</p>
              <p className="text-3xl font-bold text-ruwad-navy mt-1">{passRate}%</p>
            </div>
          </div>
        </div>

        {top3.length > 0 && (
          <div className="bg-white rounded-ruwad shadow-card p-8">
            <div className="flex items-end justify-center gap-4">
              {podiumOrder.map((rank) => {
                const sub = top3[rank]
                if (!sub) return null
                return (
                  <div key={sub.id} className="flex flex-col items-center gap-2 w-28">
                    <span className="text-3xl">{MEDALS[rank]}</span>
                    <p className="text-sm font-bold text-ruwad-navy text-center truncate w-full">{sub.student?.full_name ?? '—'}</p>
                    <p className="text-xs text-ruwad-navy/50">{sub.percentage}%</p>
                    <div
                      className={`w-full rounded-t-ruwad-sm ${podiumHeight[rank]} ${
                        rank === 0 ? 'bg-ruwad-lime' : 'bg-ruwad-blue/15'
                      }`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ===== تحليل صعوبة الأسئلة ===== */}
        {difficultyData.length > 0 && (
          <div className="bg-white rounded-ruwad shadow-card p-6">
            <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-ruwad-blue" /> نسبة الإجابة الصحيحة لكل سؤال
            </h2>
            <AnalyticsBarChart data={difficultyData} color="#3A4EFB" unit="%" />
            <p className="text-xs text-ruwad-navy/40 mt-2">الأسئلة المقالية مستثناة (تحتاج تصحيحاً يدوياً).</p>
          </div>
        )}

        <div className="bg-white rounded-ruwad shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ruwad-navy flex items-center gap-2">
              <Trophy size={20} className="text-ruwad-blue" /> الترتيب الكامل
            </h2>
            {list.length > 0 && <ExportResultsCsvButton rows={exportRows} fileName={`نتائج-${exam.title}`} />}
          </div>

          {list.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد نتائج بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-ruwad-navy/50 border-b border-ruwad-gray/60">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2">الطالب</th>
                    <th className="py-2">الدرجة</th>
                    <th className="py-2">النسبة</th>
                    <th className="py-2">الحالة</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((sub, idx) => (
                    <tr key={sub.id} className="border-b border-ruwad-gray/30">
                      <td className="py-3 pr-2 font-bold text-ruwad-navy">
                        {MEDALS[idx] ?? idx + 1}
                      </td>
                      <td className="py-3 text-ruwad-navy">{sub.student?.full_name ?? '—'}</td>
                      <td className="py-3 text-ruwad-navy">{sub.score}/{sub.total_marks}</td>
                      <td className="py-3 text-ruwad-navy">{sub.percentage}%</td>
                      <td className="py-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            sub.passed ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {!sub.graded_at ? 'بانتظار التصحيح' : sub.passed ? 'ناجح' : 'غير ناجح'}
                        </span>
                      </td>
                      <td className="py-3 text-left">
                        <ResetAttemptButton submissionId={sub.id} studentName={sub.student?.full_name ?? 'الطالب'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
