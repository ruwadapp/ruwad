'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ChallengeQuestion } from '@/lib/types'
import { Plus, Trash2, Zap, Pencil } from 'lucide-react'

type CQType = 'multiple_choice' | 'true_false' | 'short_answer'
const TYPE_LABELS: Record<CQType, string> = {
  multiple_choice: 'اختيار من متعدد',
  true_false: 'صح أو خطأ',
  short_answer: 'إجابة قصيرة',
}

export function ChallengeQuestionManager({ challengeId, questions }: { challengeId: string; questions: ChallengeQuestion[] }) {
  const [items, setItems] = useState(questions)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [type, setType] = useState<CQType>('multiple_choice')
  const [text, setText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctOption, setCorrectOption] = useState('A')
  const [correctTrueFalse, setCorrectTrueFalse] = useState('true')
  const [correctShortAnswer, setCorrectShortAnswer] = useState('')
  const [marks, setMarks] = useState('10')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function syncTotalMarks(newQuestions: ChallengeQuestion[]) {
    const total = newQuestions.reduce((s, q) => s + q.marks, 0)
    await supabase.from('challenges').update({ total_marks: total }).eq('id', challengeId)
  }

  function resetForm() {
    setText(''); setOptions(['', '', '', '']); setCorrectOption('A')
    setCorrectTrueFalse('true'); setCorrectShortAnswer(''); setMarks('10')
    setFormOpen(false); setEditingId(null)
  }

  function startEdit(q: ChallengeQuestion) {
    setEditingId(q.id)
    setText(q.question_text)
    setType(q.question_type)
    setMarks(q.marks.toString())
    if (q.question_type === 'multiple_choice') {
      const letters = ['A', 'B', 'C', 'D']
      setOptions(letters.map((l) => q.options.find((o) => o.id === l)?.text ?? ''))
      setCorrectOption(typeof q.correct_answer === 'string' ? q.correct_answer : 'A')
    } else if (q.question_type === 'true_false') {
      setCorrectTrueFalse(typeof q.correct_answer === 'string' ? q.correct_answer : 'true')
    } else {
      setCorrectShortAnswer(typeof q.correct_answer === 'string' ? q.correct_answer : '')
    }
    setFormOpen(true)
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) { setError('نص السؤال مطلوب'); return }
    setLoading(true)
    setError(null)

    let questionOptions: { id: string; text: string }[] = []
    let correctAnswer: string | null = null

    if (type === 'multiple_choice') {
      const letters = ['A', 'B', 'C', 'D']
      questionOptions = options.map((opt, idx) => ({ id: letters[idx], text: opt })).filter((o) => o.text.trim() !== '')
      if (questionOptions.length < 2) { setError('أضف خيارين على الأقل'); setLoading(false); return }
      correctAnswer = correctOption
    } else if (type === 'true_false') {
      questionOptions = [{ id: 'true', text: 'صحيح' }, { id: 'false', text: 'خطأ' }]
      correctAnswer = correctTrueFalse
    } else {
      correctAnswer = correctShortAnswer || null
    }

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from('challenge_questions')
        .update({
          question_text: text, question_type: type, options: questionOptions,
          correct_answer: correctAnswer, marks: Number(marks) || 10,
        })
        .eq('id', editingId)
        .select()
        .single()

      if (updateError || !data) { setError('حدث خطأ أثناء حفظ التعديلات'); setLoading(false); return }
      const updated = items.map((q) => (q.id === editingId ? data : q))
      setItems(updated)
      await syncTotalMarks(updated)
      resetForm()
      setLoading(false)
      router.refresh()
      return
    }

    const { data, error: insertError } = await supabase
      .from('challenge_questions')
      .insert({
        challenge_id: challengeId, question_text: text, question_type: type,
        options: questionOptions, correct_answer: correctAnswer,
        marks: Number(marks) || 10, order_index: items.length,
      })
      .select()
      .single()

    if (insertError || !data) { setError('حدث خطأ أثناء حفظ السؤال'); setLoading(false); return }

    const updated = [...items, data]
    setItems(updated)
    await syncTotalMarks(updated)
    resetForm()
    setLoading(false)
    router.refresh()
  }

  async function deleteQuestion(id: string) {
    if (!confirm('حذف هذا السؤال نهائياً؟')) return
    const { error: delError } = await supabase.from('challenge_questions').delete().eq('id', id)
    if (!delError) {
      const updated = items.filter((q) => q.id !== id)
      setItems(updated)
      await syncTotalMarks(updated)
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6 border-t-4 border-ruwad-lime">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ruwad-navy flex items-center gap-2">
          <Zap size={20} className="text-ruwad-navy" />
          أسئلة التحدي <span className="text-sm text-ruwad-navy/50 font-normal">({items.reduce((s, q) => s + q.marks, 0)} نقطة)</span>
        </h2>
        {!formOpen && (
          <button onClick={() => setFormOpen(true)} className="bg-ruwad-lime text-ruwad-navy px-4 py-2 rounded-ruwad-sm text-sm font-bold hover:opacity-90 transition flex items-center gap-1.5">
            <Plus size={16} /> سؤال جديد
          </button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={saveQuestion} className="flex flex-col gap-3 border-2 border-ruwad-lime/60 rounded-ruwad-sm p-4 mb-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-3 py-2">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value as CQType)}
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-lime">
              {Object.entries(TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
            <input type="number" min={1} value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="النقاط"
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-lime" />
          </div>

          <textarea required value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="نص السؤال"
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-lime resize-none" />

          {type === 'multiple_choice' && (
            <div className="flex flex-col gap-2">
              {['A', 'B', 'C', 'D'].map((letter, idx) => (
                <div key={letter} className="flex items-center gap-2">
                  <input type="radio" name="correct" checked={correctOption === letter} onChange={() => setCorrectOption(letter)} className="accent-ruwad-lime" />
                  <span className="text-sm font-medium text-ruwad-navy w-5">{letter}</span>
                  <input value={options[idx]} onChange={(e) => { const n = [...options]; n[idx] = e.target.value; setOptions(n) }}
                    placeholder={`الخيار ${letter}`} className="flex-1 border border-ruwad-gray rounded-ruwad-sm px-3 py-1.5 outline-none focus:border-ruwad-lime text-sm" />
                </div>
              ))}
            </div>
          )}

          {type === 'true_false' && (
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm"><input type="radio" checked={correctTrueFalse === 'true'} onChange={() => setCorrectTrueFalse('true')} className="accent-ruwad-lime" /> صحيح</label>
              <label className="flex items-center gap-1.5 text-sm"><input type="radio" checked={correctTrueFalse === 'false'} onChange={() => setCorrectTrueFalse('false')} className="accent-ruwad-lime" /> خطأ</label>
            </div>
          )}

          {type === 'short_answer' && (
            <input value={correctShortAnswer} onChange={(e) => setCorrectShortAnswer(e.target.value)} placeholder="الإجابة الصحيحة"
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-lime" />
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-ruwad-lime text-ruwad-navy px-5 py-2 rounded-ruwad-sm text-sm font-bold hover:opacity-90 transition disabled:opacity-50">
              {loading ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة السؤال'}
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2 rounded-ruwad-sm text-sm font-semibold text-ruwad-navy/60 hover:bg-ruwad-gray/30 transition">إلغاء</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد أسئلة بعد.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((q, idx) => (
            <div key={q.id} className="flex items-start gap-3 p-4 rounded-ruwad-sm border border-ruwad-lime/40 bg-ruwad-lime/5">
              <span className="w-6 h-6 rounded-full bg-ruwad-lime text-ruwad-navy text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ruwad-navy">{q.question_text}</p>
                <p className="text-xs text-ruwad-navy/50 mt-1">{TYPE_LABELS[q.question_type]} · {q.marks} نقطة</p>
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
  )
}
