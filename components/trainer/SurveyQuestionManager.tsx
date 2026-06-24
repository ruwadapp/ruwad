'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SurveyQuestion, SurveyQuestionType } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'

const TYPE_LABELS: Record<SurveyQuestionType, string> = {
  rating: 'تقييم (1-5)',
  scale: 'مقياس (1-10)',
  multiple_choice: 'اختيار واحد',
  checkbox: 'اختيار متعدد',
  yes_no: 'نعم / لا',
  text: 'نص حر',
}

const NEEDS_OPTIONS: SurveyQuestionType[] = ['multiple_choice', 'checkbox']

export function SurveyQuestionManager({ surveyId, questions }: { surveyId: string; questions: SurveyQuestion[] }) {
  const [items, setItems] = useState(questions)
  const [adding, setAdding] = useState(false)
  const [type, setType] = useState<SurveyQuestionType>('rating')
  const [text, setText] = useState('')
  const [options, setOptions] = useState(['', '', ''])
  const [isRequired, setIsRequired] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function resetForm() {
    setText('')
    setOptions(['', '', ''])
    setType('rating')
    setIsRequired(true)
    setAdding(false)
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) { setError('نص السؤال مطلوب'); return }

    let finalOptions: string[] = []
    if (NEEDS_OPTIONS.includes(type)) {
      finalOptions = options.map((o) => o.trim()).filter(Boolean)
      if (finalOptions.length < 2) { setError('أضف خيارين على الأقل'); return }
    }

    setLoading(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('survey_questions')
      .insert({
        survey_id: surveyId,
        question_text: text,
        question_type: type,
        options: finalOptions,
        is_required: isRequired,
        order_index: items.length,
      })
      .select()
      .single()

    if (insertError || !data) { setError('حدث خطأ أثناء حفظ السؤال'); setLoading(false); return }

    setItems((prev) => [...prev, data])
    resetForm()
    setLoading(false)
    router.refresh()
  }

  async function deleteQuestion(id: string) {
    if (!confirm('حذف هذا السؤال نهائياً؟')) return
    const { error: delError } = await supabase.from('survey_questions').delete().eq('id', id)
    if (!delError) {
      setItems((prev) => prev.filter((q) => q.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ruwad-navy">أسئلة الاستبيان</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition flex items-center gap-1.5"
          >
            <Plus size={16} /> سؤال جديد
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={addQuestion} className="flex flex-col gap-3 border border-ruwad-gray/60 rounded-ruwad-sm p-4 mb-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-3 py-2">{error}</div>}

          <select
            value={type}
            onChange={(e) => setType(e.target.value as SurveyQuestionType)}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue"
          >
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="نص السؤال"
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue resize-none"
          />

          {NEEDS_OPTIONS.includes(type) && (
            <div className="flex flex-col gap-2">
              {options.map((opt, idx) => (
                <input
                  key={idx}
                  value={opt}
                  onChange={(e) => {
                    const next = [...options]
                    next[idx] = e.target.value
                    setOptions(next)
                  }}
                  placeholder={`خيار ${idx + 1}`}
                  className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue text-sm"
                />
              ))}
              <button
                type="button"
                onClick={() => setOptions((prev) => [...prev, ''])}
                className="text-xs text-ruwad-blue font-semibold w-fit"
              >
                + إضافة خيار آخر
              </button>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-ruwad-navy">
            <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="accent-ruwad-blue" />
            سؤال إلزامي
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-ruwad-blue text-white px-5 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'جارٍ الحفظ...' : 'إضافة السؤال'}
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2 rounded-ruwad-sm text-sm font-semibold text-ruwad-navy/60 hover:bg-ruwad-gray/30 transition">
              إلغاء
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد أسئلة بعد.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((q, idx) => (
            <div key={q.id} className="flex items-start gap-3 p-4 rounded-ruwad-sm border border-ruwad-gray/60">
              <span className="w-6 h-6 rounded-full bg-ruwad-gray/40 text-ruwad-navy text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ruwad-navy">{q.question_text}</p>
                <p className="text-xs text-ruwad-navy/50 mt-1">
                  {TYPE_LABELS[q.question_type]} {q.is_required && '· إلزامي'}
                </p>
              </div>
              <button onClick={() => deleteQuestion(q.id)} aria-label="حذف السؤال" className="text-red-500 hover:bg-red-50 p-2 rounded-ruwad-sm transition shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
