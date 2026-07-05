'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Survey, SurveyQuestion, SurveySection } from '@/lib/types'
import { CheckCircle2, Layers, Sparkles, ArrowLeft, ClipboardList, Rocket } from 'lucide-react'

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
  const answeredCount = visibleQuestions.filter((q) => {
    const a = answers[q.id]
    return a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0)
  }).length
  const progressPct = visibleQuestions.length > 0 ? Math.round((answeredCount / visibleQuestions.length) * 100) : 0

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

  const TopBrandBar = (
    <div className="flex items-center justify-between max-w-2xl mx-auto mb-5 px-3 py-2.5 rounded-full bg-ruwad-navy shadow-card">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-ruwad-sm bg-ruwad-lime flex items-center justify-center font-extrabold text-ruwad-navy text-sm shrink-0">ر</div>
        <span className="text-white font-bold tracking-tight">رُوّاد</span>
      </div>
      <Link
        href="/register"
        className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-full backdrop-blur transition"
      >
        أنشئ حسابك <ArrowLeft size={13} />
      </Link>
    </div>
  )

  if (submitted) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center">
        {TopBrandBar}
        <div className="max-w-md mx-auto flex flex-col gap-5 animate-fade-slide-up">
          <div className="bg-white rounded-ruwad shadow-ruwad-lg p-10 flex flex-col items-center gap-4 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-ruwad-lime/20 rounded-full blur-2xl" />
            <div className="relative w-16 h-16 rounded-full bg-ruwad-gradient flex items-center justify-center shadow-ruwad">
              <CheckCircle2 size={34} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-ruwad-navy relative">شكراً لك!</h2>
            <p className="text-ruwad-navy/60 text-sm relative">تم إرسال ردّك بنجاح.</p>
          </div>

          <div className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg p-6 text-white flex flex-col items-center gap-3 text-center" style={{ backgroundImage: 'linear-gradient(135deg, #3A4EFB 0%, #33A4FA 100%)' }}>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-ruwad-lime/25 rounded-full blur-2xl" />
            <Rocket size={26} className="relative" />
            <p className="font-bold relative">هل تعرف رُوّاد؟</p>
            <p className="text-sm text-white/80 relative leading-relaxed">
              منصة تعليمية متكاملة لإنشاء الكورسات والامتحانات والاستبيانات وتتبّع الطلاب — كل ذلك في مكان واحد.
            </p>
            <Link
              href="/register"
              className="relative bg-ruwad-lime text-ruwad-navy font-bold px-6 py-3 rounded-ruwad-sm hover:opacity-90 transition mt-1 flex items-center gap-2"
            >
              أنشئ حسابك مجاناً <ArrowLeft size={16} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-10">
      {TopBrandBar}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl mx-auto">
        {/* ===== هيدر الاستبيان ===== */}
        <div className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg animate-fade-slide-up">
          <div className="relative p-7 text-center text-white" style={{ backgroundImage: 'linear-gradient(135deg, #3A4EFB 0%, #33A4FA 100%)' }}>
            <div className="absolute -top-12 -left-12 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-16 right-1/4 w-40 h-40 bg-ruwad-lime/20 rounded-full blur-2xl" />
            <span className="relative inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/15 px-3 py-1 rounded-full mb-3">
              <ClipboardList size={12} /> استبيان عبر رُوّاد
            </span>
            {survey.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={survey.logo_url} alt="" className="relative h-14 mx-auto mb-3 object-contain" />
            )}
            <h1 className="relative text-2xl font-bold">{survey.title}</h1>
            {survey.description && <p className="relative text-white/80 text-sm mt-2 leading-relaxed">{survey.description}</p>}
          </div>

          {/* شريط تقدّم حيّ — العنصر المائز في هذه الصفحة */}
          <div className="bg-white px-6 py-4 flex items-center gap-3">
            <div className="flex-1 bg-ruwad-gray/40 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-ruwad-gradient transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-ruwad-navy whitespace-nowrap flex items-center gap-1">
              <Sparkles size={12} className="text-ruwad-blue" /> {answeredCount}/{visibleQuestions.length}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-ruwad-sm px-4 py-3 animate-fade-slide-up">{error}</div>
        )}

        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-4">
            {group.title && (
              <div className="flex items-center gap-2 px-1 mt-2">
                <span className="w-7 h-7 rounded-full bg-ruwad-navy text-white flex items-center justify-center shrink-0">
                  <Layers size={13} />
                </span>
                <h2 className="font-bold text-ruwad-navy">{group.title}</h2>
              </div>
            )}

            {group.questions.map((q) => {
              globalIndex += 1
              const idx = globalIndex
              const answered = answers[q.id] !== undefined && answers[q.id] !== '' && !(Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0)
              return (
                <div
                  key={q.id}
                  style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                  className={`bg-white rounded-ruwad shadow-card hover:shadow-ruwad p-6 flex flex-col gap-3 border-2 transition-colors animate-fade-slide-up ${
                    answered ? 'border-ruwad-blue/25' : 'border-transparent'
                  }`}
                >
                  <p className="font-medium text-ruwad-navy flex items-start gap-2">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      answered ? 'bg-ruwad-blue text-white' : 'bg-ruwad-gray/40 text-ruwad-navy'
                    }`}>
                      {answered ? '✓' : idx}
                    </span>
                    <span>{q.question_text} {q.is_required && <span className="text-red-500">*</span>}</span>
                  </p>

                  {q.question_type === 'rating' && (
                    <div className="flex gap-2 justify-center py-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setAnswer(q.id, String(n))}
                          className={`text-3xl transition-transform hover:scale-110 ${Number(answers[q.id]) >= n ? 'text-yellow-400' : 'text-ruwad-gray'}`}
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
                            answers[q.id] === String(n) ? 'bg-ruwad-blue text-white border-ruwad-blue scale-105' : 'bg-white text-ruwad-navy border-ruwad-gray hover:border-ruwad-blue/50'
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
                          answers[q.id] === opt ? 'border-ruwad-blue bg-ruwad-blue/5' : 'border-ruwad-gray/60 hover:border-ruwad-blue/30'
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
                            checked ? 'border-ruwad-blue bg-ruwad-blue/5' : 'border-ruwad-gray/60 hover:border-ruwad-blue/30'
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
                            answers[q.id] === opt ? 'bg-ruwad-blue text-white border-ruwad-blue' : 'bg-white text-ruwad-navy border-ruwad-gray hover:border-ruwad-blue/30'
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
          className="bg-ruwad-gradient text-white px-6 py-4 rounded-ruwad font-bold hover:opacity-90 transition shadow-ruwad-lg disabled:opacity-50 flex items-center justify-center gap-2 text-base"
        >
          {loading ? 'جارٍ الإرسال...' : 'إرسال الردّ'}
        </button>

        <p className="text-center text-xs text-ruwad-navy/50">
          مدعوم بواسطة <span className="font-bold text-ruwad-navy">رُوّاد</span> — منصة تعليمية متكاملة ·{' '}
          <Link href="/register" className="underline text-ruwad-blue hover:text-ruwad-navy transition">أنشئ استبيانك الخاص</Link>
        </p>
      </form>
    </div>
  )
}
