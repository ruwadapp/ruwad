'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Survey, SurveyQuestion, SurveySection } from '@/lib/types'
import { CheckCircle2, Layers } from 'lucide-react'

// يتحقق إن كان سؤال يجب أن يظهر الآن بناءً على إجابة السؤال الذي يشترطه (إن وجد)
function isVisible(q: SurveyQuestion, answers: Record<string, string | string[]>): boolean {
  if (!q.condition_question_id || !q.condition_value) return true
  const parentAnswer = answers[q.condition_question_id]
  if (Array.isArray(parentAnswer)) return parentAnswer.includes(q.condition_value)
  return parentAnswer === q.condition_value
}

export function SurveyResponseForm({
  survey,
  questions,
  sections,
}: {
  survey: Survey
  questions: SurveyQuestion[]
  sections: SurveySection[]
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function setAnswer(questionId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function toggleCheckbox(questionId: string, option: string) {
    const current = (answers[questionId] as string[]) ?? []
    const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option]
    setAnswer(questionId, next)
  }

  // الأسئلة الظاهرة فعلياً الآن (باستبعاد الأسئلة الشرطية غير المتحققة)
  const visibleQuestions = useMemo(() => questions.filter((q) => isVisible(q, answers)), [questions, answers])

  // تجميع الأسئلة الظاهرة حسب القسم، بترتيب ظهور الأقسام كما أُنشئت، ثم الأسئلة بلا قسم في النهاية
  const groups = useMemo(() => {
    const bySection = new Map<string, SurveyQuestion[]>()
    const noSection: SurveyQuestion[] = []
    for (const q of visibleQuestions) {
      if (q.section_id) {
        if (!bySection.has(q.section_id)) bySection.set(q.section_id, [])
        bySection.get(q.section_id)!.push(q)
      } else {
        noSection.push(q)
      }
    }
    const ordered: { title: string | null; questions: SurveyQuestion[] }[] = []
    for (const s of sections) {
      const qs = bySection.get(s.id)
      if (qs && qs.length > 0) ordered.push({ title: s.title, questions: qs })
    }
    if (noSection.length > 0) ordered.push({ title: null, questions: noSection })
    return ordered
  }, [visibleQuestions, sections])

  let globalIndex = 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const missing = visibleQuestions.find((q) => q.is_required && !answers[q.id])
    if (missing) {
      setError('يرجى الإجابة على جميع الأسئلة الإلزامية')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    // نُرسل فقط إجابات الأسئلة الظاهرة فعلياً (لا نُرسل إجابات أسئلة شرطية أُخفيت لاحقاً بعد تغيير الإجابة الأصلية)
    const visibleIds = new Set(visibleQuestions.map((q) => q.id))
    const cleanAnswers = Object.fromEntries(Object.entries(answers).filter(([qId]) => visibleIds.has(qId)))

    const { error: insertError } = await supabase.from('survey_responses').insert({
      survey_id: survey.id,
      respondent_id: survey.is_anonymous ? null : user?.id ?? null,
      answers: cleanAnswers,
    })

    if (insertError) {
      setError('حدث خطأ أثناء إرسال الرد، حاول مرة أخرى')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-4 text-center max-w-md mx-auto">
        <CheckCircle2 size={56} className="text-ruwad-blue" />
        <h2 className="text-xl font-bold text-ruwad-navy">شكراً لك!</h2>
        <p className="text-ruwad-navy/60 text-sm">تم إرسال ردّك بنجاح.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="bg-white rounded-ruwad shadow-card p-6 text-center">
        {survey.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={survey.logo_url} alt="" className="h-14 mx-auto mb-3 object-contain" />
        )}
        <h1 className="text-xl font-bold text-ruwad-navy">{survey.title}</h1>
        {survey.description && <p className="text-ruwad-navy/60 text-sm mt-2">{survey.description}</p>}
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-4">
          {group.title && (
            <div className="flex items-center gap-2 px-1 mt-2">
              <Layers size={16} className="text-ruwad-blue" />
              <h2 className="font-bold text-ruwad-navy">{group.title}</h2>
            </div>
          )}

          {group.questions.map((q) => {
            globalIndex += 1
            const idx = globalIndex
            return (
              <div key={q.id} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3">
                <p className="font-medium text-ruwad-navy">
                  {idx}. {q.question_text} {q.is_required && <span className="text-red-500">*</span>}
                </p>

                {q.question_type === 'rating' && (
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswer(q.id, String(n))}
                        className={`text-2xl transition ${Number(answers[q.id]) >= n ? 'text-yellow-400' : 'text-ruwad-gray'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                )}

                {q.question_type === 'scale' && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswer(q.id, String(n))}
                        className={`w-9 h-9 rounded-ruwad-sm font-semibold text-sm border-2 transition ${
                          answers[q.id] === String(n) ? 'bg-ruwad-blue text-white border-ruwad-blue' : 'bg-white text-ruwad-navy border-ruwad-gray'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}

                {q.question_type === 'multiple_choice' && (
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt) => (
                      <label key={opt} className={`flex items-center gap-3 p-3 rounded-ruwad-sm border-2 cursor-pointer transition ${
                        answers[q.id] === opt ? 'border-ruwad-blue bg-ruwad-blue/5' : 'border-ruwad-gray/60'
                      }`}>
                        <input type="radio" name={q.id} checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} className="accent-ruwad-blue" />
                        <span className="text-ruwad-navy">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.question_type === 'checkbox' && (
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt) => {
                      const checked = ((answers[q.id] as string[]) ?? []).includes(opt)
                      return (
                        <label key={opt} className={`flex items-center gap-3 p-3 rounded-ruwad-sm border-2 cursor-pointer transition ${
                          checked ? 'border-ruwad-blue bg-ruwad-blue/5' : 'border-ruwad-gray/60'
                        }`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleCheckbox(q.id, opt)} className="accent-ruwad-blue" />
                          <span className="text-ruwad-navy">{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {q.question_type === 'yes_no' && (
                  <div className="grid grid-cols-2 gap-3">
                    {['نعم', 'لا'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswer(q.id, opt)}
                        className={`py-3 rounded-ruwad-sm font-semibold border-2 transition ${
                          answers[q.id] === opt ? 'bg-ruwad-blue text-white border-ruwad-blue' : 'bg-white text-ruwad-navy border-ruwad-gray'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {q.question_type === 'text' && q.text_format === 'number' && (
                  <input
                    type="number"
                    value={(answers[q.id] as string) ?? ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
                    dir="ltr"
                  />
                )}

                {q.question_type === 'text' && q.text_format === 'date' && (
                  <input
                    type="date"
                    value={(answers[q.id] as string) ?? ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
                    dir="ltr"
                  />
                )}

                {q.question_type === 'text' && (!q.text_format || q.text_format === 'text') && (
                  <textarea
                    value={(answers[q.id] as string) ?? ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    rows={3}
                    className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none"
                  />
                )}
              </div>
            )
          })}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50"
      >
        {loading ? 'جارٍ الإرسال...' : 'إرسال الردّ'}
      </button>
    </form>
  )
}
