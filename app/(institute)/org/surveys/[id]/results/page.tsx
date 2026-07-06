import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { SurveyResultsView } from '@/components/trainer/SurveyResultsView'
import type { SurveyQuestion } from '@/lib/types'

export default async function InstituteSurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user!.id).single()
  if (!institute) redirect('/org/dashboard')

  const { data: survey } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .single()

  if (!survey) notFound()

  const [{ data: questions }, { data: sections }, { data: responses }] = await Promise.all([
    supabase.from('survey_questions').select('*').eq('survey_id', id).order('order_index', { ascending: true }),
    supabase.from('survey_sections').select('*').eq('survey_id', id).order('order_index', { ascending: true }),
    supabase.from('survey_responses').select('*, respondent:profiles!respondent_id(full_name)').eq('survey_id', id).order('submitted_at', { ascending: false }),
  ])

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
      return { id: q.id, text: q.question_text, type: q.question_type, average, distribution, answeredCount: allAnswers.length, max }
    }

    if (q.question_type === 'multiple_choice') {
      const distribution = q.options.map((opt) => ({
        label: opt,
        count: allAnswers.filter((a) => a === opt).length,
      }))
      return { id: q.id, text: q.question_text, type: q.question_type, distribution, answeredCount: allAnswers.length }
    }

    if (q.question_type === 'checkbox') {
      const distribution = q.options.map((opt) => ({
        label: opt,
        count: allAnswers.filter((a) => Array.isArray(a) && a.includes(opt)).length,
      }))
      return { id: q.id, text: q.question_text, type: q.question_type, distribution, answeredCount: allAnswers.length }
    }

    if (q.question_type === 'yes_no') {
      const distribution = ['نعم', 'لا'].map((opt) => ({
        label: opt,
        count: allAnswers.filter((a) => a === opt).length,
      }))
      return { id: q.id, text: q.question_text, type: q.question_type, distribution, answeredCount: allAnswers.length }
    }

    if (q.question_type === 'text' && q.text_format === 'number') {
      const nums = allAnswers.map((a) => Number(a)).filter((n) => !isNaN(n))
      const average = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0
      const min = nums.length ? Math.min(...nums) : 0
      const max = nums.length ? Math.max(...nums) : 0
      return { id: q.id, text: q.question_text, type: q.question_type, textFormat: 'number', average, min, max, answeredCount: allAnswers.length, textAnswers: allAnswers.map(String) }
    }

    // text (free) أو date
    return {
      id: q.id,
      text: q.question_text,
      type: q.question_type,
      textFormat: q.text_format ?? 'text',
      answeredCount: allAnswers.length,
      textAnswers: allAnswers as string[],
    }
  })

  return (
    <>
      <Header title={`نتائج: ${survey.title}`} />
      <main className="p-6 flex flex-col gap-6">
        <div className="bg-white rounded-ruwad shadow-card p-6 flex items-center justify-between flex-wrap gap-3">
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
          <SurveyResultsView
            stats={stats}
            totalResponses={totalResponses}
            questions={questions ?? []}
            sections={sections ?? []}
            responses={responses ?? []}
            isAnonymous={survey.is_anonymous}
          />
        )}
      </main>
    </>
  )
}
