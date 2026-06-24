import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Trophy } from 'lucide-react'

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

  const { data: submissions } = await supabase
    .from('exam_submissions')
    .select('*, student:profiles(full_name, avatar_url)')
    .eq('exam_id', id)
    .not('submitted_at', 'is', null)
    .order('score', { ascending: false })

  const list = submissions ?? []
  const avgPercentage = list.length
    ? Math.round(list.reduce((s, sub) => s + (sub.percentage ?? 0), 0) / list.length)
    : 0
  const passRate = list.length
    ? Math.round((list.filter((s) => s.passed).length / list.length) * 100)
    : 0

  return (
    <>
      <Header title={`نتائج: ${exam.title}`} />
      <main className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-ruwad shadow-card p-6">
            <p className="text-sm text-ruwad-navy/60">عدد المشاركين</p>
            <p className="text-2xl font-bold text-ruwad-navy mt-1">{list.length}</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-6">
            <p className="text-sm text-ruwad-navy/60">متوسط الدرجة</p>
            <p className="text-2xl font-bold text-ruwad-navy mt-1">{avgPercentage}%</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-6">
            <p className="text-sm text-ruwad-navy/60">نسبة النجاح</p>
            <p className="text-2xl font-bold text-ruwad-navy mt-1">{passRate}%</p>
          </div>
        </div>

        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-ruwad-blue" /> الترتيب
          </h2>

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
                          {sub.passed ? 'ناجح' : 'غير ناجح'}
                        </span>
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
