'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SurveyQuestion, SurveyQuestionType, SurveySection } from '@/lib/types'
import { Plus, Trash2, Pencil, Layers, GitBranch, X } from 'lucide-react'

const TYPE_LABELS: Record<SurveyQuestionType, string> = {
  rating: 'تقييم (1-5)',
  scale: 'مقياس (1-10)',
  multiple_choice: 'اختيار واحد',
  checkbox: 'اختيار متعدد',
  yes_no: 'نعم / لا',
  text: 'نص حر',
}

const NEEDS_OPTIONS: SurveyQuestionType[] = ['multiple_choice', 'checkbox']
// أنواع الأسئلة التي يمكن ربط سؤال شرطي بإجابتها (لها قيمة إجابة واحدة واضحة يمكن مطابقتها)
const CONDITIONABLE_TYPES: SurveyQuestionType[] = ['multiple_choice', 'yes_no']

function optionsForCondition(q: SurveyQuestion): string[] {
  if (q.question_type === 'yes_no') return ['نعم', 'لا']
  return q.options
}

export function SurveyQuestionManager({
  surveyId,
  questions,
  initialSections,
}: {
  surveyId: string
  questions: SurveyQuestion[]
  initialSections: SurveySection[]
}) {
  const [items, setItems] = useState(questions)
  const [sections, setSections] = useState(initialSections)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [sectionLoading, setSectionLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [type, setType] = useState<SurveyQuestionType>('rating')
  const [text, setText] = useState('')
  const [options, setOptions] = useState(['', '', ''])
  const [isRequired, setIsRequired] = useState(true)
  const [sectionId, setSectionId] = useState<string>('')
  const [textFormat, setTextFormat] = useState<'text' | 'number' | 'date'>('text')
  const [conditionQuestionId, setConditionQuestionId] = useState<string>('')
  const [conditionValue, setConditionValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const sectionMap = new Map(sections.map((s) => [s.id, s.title]))
  const questionMap = new Map(items.map((q) => [q.id, q]))

  // ===== الأقسام =====
  async function addSection() {
    if (!newSectionTitle.trim()) return
    setSectionLoading(true)
    const { data, error: insErr } = await supabase
      .from('survey_sections')
      .insert({ survey_id: surveyId, title: newSectionTitle.trim(), order_index: sections.length })
      .select()
      .single()
    if (!insErr && data) {
      setSections((prev) => [...prev, data])
      setNewSectionTitle('')
      router.refresh()
    }
    setSectionLoading(false)
  }

  async function deleteSection(id: string) {
    if (!confirm('حذف القسم لن يحذف أسئلته، لكنها ستصبح بلا قسم. متابعة؟')) return
    const { error: delErr } = await supabase.from('survey_sections').delete().eq('id', id)
    if (!delErr) {
      setSections((prev) => prev.filter((s) => s.id !== id))
      setItems((prev) => prev.map((q) => (q.section_id === id ? { ...q, section_id: null } : q)))
      router.refresh()
    }
  }

  // ===== الأسئلة =====
  function resetForm() {
    setText('')
    setOptions(['', '', ''])
    setType('rating')
    setIsRequired(true)
    setSectionId('')
    setTextFormat('text')
    setConditionQuestionId('')
    setConditionValue('')
    setFormOpen(false)
    setEditingId(null)
    setError(null)
  }

  function startEdit(q: SurveyQuestion) {
    setEditingId(q.id)
    setText(q.question_text)
    setType(q.question_type)
    setIsRequired(q.is_required)
    setOptions(q.options.length ? [...q.options, '', '', ''].slice(0, Math.max(3, q.options.length)) : ['', '', ''])
    setSectionId(q.section_id ?? '')
    setTextFormat(q.text_format ?? 'text')
    setConditionQuestionId(q.condition_question_id ?? '')
    setConditionValue(q.condition_value ?? '')
    setFormOpen(true)
  }

  // أسئلة يمكن اختيارها كشرط: يجب أن تسبق هذا السؤال في الترتيب ومن نوع قابل للشرط
  const conditionCandidates = items.filter((q) => {
    if (!CONDITIONABLE_TYPES.includes(q.question_type)) return false
    if (editingId && q.id === editingId) return false
    if (editingId) {
      const editingIdx = items.findIndex((i) => i.id === editingId)
      const qIdx = items.findIndex((i) => i.id === q.id)
      return qIdx < editingIdx
    }
    return true
  })

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) { setError('نص السؤال مطلوب'); return }

    let finalOptions: string[] = []
    if (NEEDS_OPTIONS.includes(type)) {
      finalOptions = options.map((o) => o.trim()).filter(Boolean)
      if (finalOptions.length < 2) { setError('أضف خيارين على الأقل'); return }
    }

    if (conditionQuestionId && !conditionValue) {
      setError('اختر القيمة التي عند تحققها يظهر هذا السؤال')
      return
    }

    const payload = {
      question_text: text,
      question_type: type,
      options: finalOptions,
      is_required: isRequired,
      section_id: sectionId || null,
      text_format: type === 'text' ? textFormat : 'text',
      condition_question_id: conditionQuestionId || null,
      condition_value: conditionQuestionId ? conditionValue : null,
    }

    setLoading(true)
    setError(null)

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from('survey_questions')
        .update(payload)
        .eq('id', editingId)
        .select()
        .single()

      if (updateError || !data) { setError('حدث خطأ أثناء حفظ التعديلات'); setLoading(false); return }
      setItems((prev) => prev.map((q) => (q.id === editingId ? data : q)))
      resetForm()
      setLoading(false)
      router.refresh()
      return
    }

    const { data, error: insertError } = await supabase
      .from('survey_questions')
      .insert({ ...payload, survey_id: surveyId, order_index: items.length })
      .select()
      .single()

    if (insertError || !data) { setError('حدث خطأ أثناء حفظ السؤال'); setLoading(false); return }

    setItems((prev) => [...prev, data])
    resetForm()
    setLoading(false)
    router.refresh()
  }

  async function deleteQuestion(id: string) {
    if (!confirm('حذف هذا السؤال نهائياً؟ أي سؤال شرطي مرتبط به سيصبح ظاهراً دائماً.')) return
    const { error: delError } = await supabase.from('survey_questions').delete().eq('id', id)
    if (!delError) {
      setItems((prev) => prev.filter((q) => q.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ===== الأقسام ===== */}
      <div className="bg-white rounded-ruwad shadow-card p-6">
        <h2 className="text-lg font-bold text-ruwad-navy mb-3 flex items-center gap-2">
          <Layers size={18} className="text-ruwad-blue" /> أقسام الاستبيان
        </h2>
        <p className="text-xs text-ruwad-navy/50 mb-3">قسّم الاستبيان الطويل لأقسام مسمّاة، ثم اختر لكل سؤال قسمه أدناه.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {sections.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 bg-ruwad-blue/10 text-ruwad-blue text-sm font-semibold px-3 py-1.5 rounded-full">
              {s.title}
              <button onClick={() => deleteSection(s.id)} aria-label="حذف القسم"><X size={13} /></button>
            </span>
          ))}
          {sections.length === 0 && <p className="text-sm text-ruwad-navy/40">لا توجد أقسام حتى الآن — كل الأسئلة ستُعرض متتالية.</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="اسم القسم الجديد، مثل: بيانات عامة"
            className="flex-1 border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue"
          />
          <button
            onClick={addSection}
            disabled={sectionLoading || !newSectionTitle.trim()}
            className="bg-ruwad-navy text-white px-4 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            + إضافة قسم
          </button>
        </div>
      </div>

      {/* ===== الأسئلة ===== */}
      <div className="bg-white rounded-ruwad shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ruwad-navy">أسئلة الاستبيان</h2>
          {!formOpen && (
            <button
              onClick={() => setFormOpen(true)}
              className="bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition flex items-center gap-1.5"
            >
              <Plus size={16} /> سؤال جديد
            </button>
          )}
        </div>

        {formOpen && (
          <form onSubmit={saveQuestion} className="flex flex-col gap-3 border border-ruwad-gray/60 rounded-ruwad-sm p-4 mb-4">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-3 py-2">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SurveyQuestionType)}
                className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue"
              >
                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              {sections.length > 0 && (
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue"
                >
                  <option value="">بلا قسم</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              )}
            </div>

            <textarea
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="نص السؤال"
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue resize-none"
            />

            {type === 'text' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ruwad-navy/60">نوع الإجابة النصية</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 'text', l: 'نص' },
                    { v: 'number', l: 'رقم' },
                    { v: 'date', l: 'تاريخ' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setTextFormat(opt.v)}
                      className={`py-2 rounded-ruwad-sm text-sm font-semibold border-2 transition ${
                        textFormat === opt.v ? 'bg-ruwad-blue text-white border-ruwad-blue' : 'bg-white text-ruwad-navy border-ruwad-gray'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            {/* ===== السؤال الشرطي ===== */}
            {conditionCandidates.length > 0 && (
              <div className="flex flex-col gap-2 bg-ruwad-lime/10 rounded-ruwad-sm p-3">
                <label className="text-xs font-semibold text-ruwad-navy flex items-center gap-1.5">
                  <GitBranch size={13} /> إظهار هذا السؤال بشرط (اختياري)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={conditionQuestionId}
                    onChange={(e) => { setConditionQuestionId(e.target.value); setConditionValue('') }}
                    className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue"
                  >
                    <option value="">بلا شرط — يظهر دائماً</option>
                    {conditionCandidates.map((q) => (
                      <option key={q.id} value={q.id}>{q.question_text.slice(0, 40)}</option>
                    ))}
                  </select>
                  {conditionQuestionId && (
                    <select
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                      className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue"
                    >
                      <option value="">إذا كانت الإجابة...</option>
                      {optionsForCondition(questionMap.get(conditionQuestionId)!).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
                {conditionQuestionId && (
                  <p className="text-[11px] text-ruwad-navy/50">سيظهر هذا السؤال للمستجيب فقط إذا اختار "{conditionValue || '...'}" في السؤال المحدد.</p>
                )}
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
                {loading ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة السؤال'}
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
                  <p className="text-xs text-ruwad-navy/50 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{TYPE_LABELS[q.question_type]}{q.question_type === 'text' && q.text_format !== 'text' ? ` (${q.text_format === 'number' ? 'رقم' : 'تاريخ'})` : ''}</span>
                    {q.is_required && <span>· إلزامي</span>}
                    {q.section_id && sectionMap.has(q.section_id) && (
                      <span className="flex items-center gap-1 bg-ruwad-blue/10 text-ruwad-blue px-2 py-0.5 rounded-full"><Layers size={10} /> {sectionMap.get(q.section_id)}</span>
                    )}
                    {q.condition_question_id && (
                      <span className="flex items-center gap-1 bg-ruwad-lime/20 text-ruwad-navy px-2 py-0.5 rounded-full">
                        <GitBranch size={10} /> شرطي
                      </span>
                    )}
                  </p>
                </div>
                <button onClick={() => startEdit(q)} aria-label="تعديل السؤال" className="text-ruwad-blue hover:bg-ruwad-blue/10 p-2 rounded-ruwad-sm transition shrink-0">
                  <Pencil size={16} />
                </button>
                <button onClick={() => deleteQuestion(q.id)} aria-label="حذف السؤال" className="text-red-500 hover:bg-red-50 p-2 rounded-ruwad-sm transition shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
