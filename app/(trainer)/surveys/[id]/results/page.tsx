import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { SurveyResultsCharts } from '@/components/trainer/SurveyResultsCharts'
import type { SurveyQuestion } from '@/lib/types'

export default async function SurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: survey } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!survey) notFound()

  const { data: questions } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('survey_id', id)
    .order('order_index', { ascending: true })

  const { data: responses } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('survey_id', id)

  const totalResponses = responses?.length ?? 0

  const stats = (questions ?? []).map((q: SurveyQuestion) => {
    const allAnswers = (responses ?? []).map((r) => r.answers[q.id]).filter((a) => a !== undefined && a !== null && a !== '')

    if (q.question_type === 'rating' || q.question_type === 'scale') {
      const nums = allAnswers.map((a) => Number(a)).filter((n) => !isNaN(n))
      const max = q.question_type === 'rating' ? 5 : 10
      const distribution = Array.from({ length: max }, (_, i) => {
        const val = i + 1
        return { label: String(val), count: nums.filter((n) => n === val).length }
      })
      const average = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0
      return { id: q.id, text: q.question_text, type: q.question_type, average, distribution }
    }

    if (q.question_type === 'multiple_choice') {
      const distribution = q.options.map((opt) => ({
        label: opt,
        count: allAnswers.filter((a) => a === opt).length,
      }))
      return { id: q.id, text: q.question_text, type: q.question_type, distribution }
    }

    if (q.question_type === 'checkbox') {
      const distribution = q.options.map((opt) => ({
        label: opt,
        count: allAnswers.filter((a) => Array.isArray(a) && a.includes(opt)).length,
      }))
      return { id: q.id, text: q.question_text, type: q.question_type, distribution }
    }

    if (q.question_type === 'yes_no') {
      const distribution = ['نعم', 'لا'].map((opt) => ({
        label: opt,
        count: allAnswers.filter((a) => a === opt).length,
      }))
      return { id: q.id, text: q.question_text, type: q.question_type, distribution }
    }

    // text
    return {
      id: q.id,
      text: q.question_text,
      type: q.question_type,
      textAnswers: allAnswers as string[],
    }
  })

  return (
    <>
      <Header title={`نتائج: ${survey.title}`} />
      <main className="p-6 flex flex-col gap-6">
        <div className="bg-white rounded-ruwad shadow-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-ruwad-navy/60">إجمالي الردود</p>
            <p className="text-2xl font-bold text-ruwad-navy">{totalResponses}</p>
          </div>
          {survey.is_anonymous && (
            <span className="text-xs font-semibold bg-ruwad-gray/40 text-ruwad-navy/70 px-3 py-1.5 rounded-full">
              استبيان مجهول الهوية
            </span>
          )}
        </div>

        {totalResponses === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/60">
            لا توجد ردود بعد. شارك رابط الاستبيان للحصول على ردود.
          </div>
        ) : (
          <SurveyResultsCharts stats={stats} totalResponses={totalResponses} />
        )}
      </main>
    </>
  )
}
