'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Question, QuestionType } from '@/lib/types'
import { Plus, Trash2, Pencil, ListChecks, ToggleLeft, Type, PenLine, Upload } from 'lucide-react'

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'اختيار من متعدد',
  true_false: 'صح أو خطأ',
  short_answer: 'إجابة قصيرة',
  essay: 'مقالي',
}

const TYPE_STYLE: Record<QuestionType, { icon: typeof ListChecks; color: string; bg: string; border: string }> = {
  multiple_choice: { icon: ListChecks, color: 'text-ruwad-blue', bg: 'bg-ruwad-blue/5', border: 'border-ruwad-blue/30' },
  true_false: { icon: ToggleLeft, color: 'text-ruwad-navy', bg: 'bg-ruwad-lime/15', border: 'border-ruwad-lime/50' },
  short_answer: { icon: Type, color: 'text-ruwad-navy', bg: 'bg-ruwad-navy/5', border: 'border-ruwad-navy/20' },
  essay: { icon: PenLine, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300' },
}

export function QuestionManager({ examId, questions }: { examId: string; questions: Question[] }) {
  const [items, setItems] = useState(questions)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [type, setType] = useState<QuestionType>('multiple_choice')
  const [text, setText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctOption, setCorrectOption] = useState('A')
  const [correctTrueFalse, setCorrectTrueFalse] = useState('true')
  const [correctShortAnswer, setCorrectShortAnswer] = useState('')
  const [marks, setMarks] = useState('1')
  const [explanation, setExplanation] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSummary, setImportSummary] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  async function syncExamTotalMarks(newQuestions: Question[]) {
    const total = newQuestions.reduce((sum, q) => sum + q.marks, 0)
    await supabase.from('exams').update({ total_marks: total }).eq('id', examId)
  }

  // ===== استيراد أسئلة الاختيار من متعدد عبر JSON أو CSV =====
  // لا يؤثر على بقية أنواع الأسئلة (صح/خطأ، إجابة قصيرة، مقالي) — يضيف فقط أسئلة اختيار من متعدد جديدة
  type ImportedRow = {
    text: string
    options: { id: string; text: string }[]
    correct: string
    marks: number
    explanation: string | null
  }

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

  function parseCsvLine(line: string): string[] {
    const cells: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
        else if (ch === '"') { inQuotes = false }
        else { cur += ch }
      } else {
        if (ch === '"') inQuotes = true
        else if (ch === ',') { cells.push(cur); cur = '' }
        else cur += ch
      }
    }
    cells.push(cur)
    return cells.map((c) => c.trim())
  }

  function parseCsv(content: string): ImportedRow[] {
    const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '')
    if (lines.length < 2) throw new Error('الملف لا يحتوي بيانات كافية')
    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
    const idx = (name: string) => header.indexOf(name)
    const qIdx = idx('question') !== -1 ? idx('question') : idx('question_text')
    if (qIdx === -1) throw new Error('يجب أن يحتوي الملف على عمود "question"')
    const correctIdx = idx('correct') !== -1 ? idx('correct') : idx('correct_answer')
    const marksIdx = idx('marks')
    const explanationIdx = idx('explanation')
    const optionIdxs = LETTERS
      .map((l, i) => idx(`option_${l.toLowerCase()}`) !== -1 ? idx(`option_${l.toLowerCase()}`) : idx(`option${i + 1}`))
      .filter((i) => i !== -1)

    return lines.slice(1).map((line, rowNum) => {
      const cells = parseCsvLine(line)
      const text = cells[qIdx]?.trim() ?? ''
      if (!text) throw new Error(`السطر ${rowNum + 2}: نص السؤال مفقود`)
      const options = optionIdxs
        .map((oi, i) => ({ id: LETTERS[i], text: (cells[oi] ?? '').trim() }))
        .filter((o) => o.text !== '')
      if (options.length < 2) throw new Error(`السطر ${rowNum + 2}: يجب توفير خيارين على الأقل`)
      const rawCorrect = (correctIdx !== -1 ? cells[correctIdx] : '')?.trim().toUpperCase() ?? ''
      const correct = options.find((o) => o.id === rawCorrect)
        ? rawCorrect
        : options.find((o) => o.text.toLowerCase() === rawCorrect.toLowerCase())?.id ?? ''
      if (!correct) throw new Error(`السطر ${rowNum + 2}: الإجابة الصحيحة "${rawCorrect}" غير مطابقة لأي خيار`)
      const marks = marksIdx !== -1 && cells[marksIdx] ? Number(cells[marksIdx]) : 1
      const explanation = explanationIdx !== -1 ? (cells[explanationIdx]?.trim() || null) : null
      return { text, options, correct, marks: Number.isFinite(marks) && marks > 0 ? marks : 1, explanation }
    })
  }

  function parseJson(content: string): ImportedRow[] {
    let raw: unknown
    try { raw = JSON.parse(content) } catch { throw new Error('الملف ليس JSON صالحاً') }
    const arr = Array.isArray(raw) ? raw : (raw as { questions?: unknown[] })?.questions
    if (!Array.isArray(arr)) throw new Error('يجب أن يكون الملف مصفوفة أسئلة أو يحتوي على مفتاح "questions"')

    return arr.map((item, rowNum) => {
      const obj = item as Record<string, unknown>
      const text = String(obj.question ?? obj.question_text ?? '').trim()
      if (!text) throw new Error(`العنصر ${rowNum + 1}: نص السؤال مفقود`)

      let options: { id: string; text: string }[] = []
      const rawOptions = obj.options
      if (Array.isArray(rawOptions)) {
        options = rawOptions.map((o, i) => {
          if (typeof o === 'string') return { id: LETTERS[i], text: o.trim() }
          const oo = o as { id?: string; text?: string }
          return { id: (oo.id ?? LETTERS[i]).toString().toUpperCase(), text: String(oo.text ?? '').trim() }
        }).filter((o) => o.text !== '')
      } else if (rawOptions && typeof rawOptions === 'object') {
        options = Object.entries(rawOptions as Record<string, string>)
          .map(([id, text]) => ({ id: id.toUpperCase(), text: String(text).trim() }))
          .filter((o) => o.text !== '')
      }
      if (options.length < 2) throw new Error(`العنصر ${rowNum + 1}: يجب توفير خيارين على الأقل`)

      const rawCorrect = String(obj.correct ?? obj.correct_answer ?? '').trim().toUpperCase()
      const correct = options.find((o) => o.id === rawCorrect)
        ? rawCorrect
        : options.find((o) => o.text.toLowerCase() === rawCorrect.toLowerCase())?.id ?? ''
      if (!correct) throw new Error(`العنصر ${rowNum + 1}: الإجابة الصحيحة غير مطابقة لأي خيار`)

      const marksNum = Number(obj.marks)
      const explanation = obj.explanation ? String(obj.explanation).trim() : null
      return { text, options, correct, marks: Number.isFinite(marksNum) && marksNum > 0 ? marksNum : 1, explanation }
    })
  }

  async function handleImportFile(file: File) {
    setImportError(null)
    setImportSummary(null)
    setImporting(true)
    try {
      const content = await file.text()
      const isJson = file.name.toLowerCase().endsWith('.json')
      const rows = isJson ? parseJson(content) : parseCsv(content)
      if (rows.length === 0) throw new Error('لم يتم العثور على أسئلة في الملف')

      const payload = rows.map((r, i) => ({
        exam_id: examId,
        question_text: r.text,
        question_type: 'multiple_choice' as QuestionType,
        options: r.options,
        correct_answer: r.correct,
        marks: r.marks,
        explanation: r.explanation,
        order_index: items.length + i,
      }))

      const { data, error: insertError } = await supabase.from('questions').insert(payload).select()
      if (insertError || !data) throw new Error('حدث خطأ أثناء حفظ الأسئلة في قاعدة البيانات')

      const updated = [...items, ...data]
      setItems(updated)
      await syncExamTotalMarks(updated)
      setImportSummary(`تم استيراد ${data.length} سؤال اختيار من متعدد بنجاح ✓`)
      router.refresh()
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع أثناء الاستيراد')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function resetForm() {
    setText('')
    setOptions(['', '', '', ''])
    setCorrectOption('A')
    setCorrectTrueFalse('true')
    setCorrectShortAnswer('')
    setMarks('1')
    setExplanation('')
    setImageUrl('')
    setType('multiple_choice')
    setFormOpen(false)
    setEditingId(null)
  }

  function startEdit(q: Question) {
    setEditingId(q.id)
    setText(q.question_text)
    setType(q.question_type)
    setMarks(q.marks.toString())
    setExplanation(q.explanation ?? '')
    setImageUrl(q.image_url ?? '')
    if (q.question_type === 'multiple_choice') {
      const letters = ['A', 'B', 'C', 'D']
      setOptions(letters.map((l) => q.options.find((o) => o.id === l)?.text ?? ''))
      setCorrectOption(typeof q.correct_answer === 'string' ? q.correct_answer : 'A')
    } else if (q.question_type === 'true_false') {
      setCorrectTrueFalse(typeof q.correct_answer === 'string' ? q.correct_answer : 'true')
    } else if (q.question_type === 'short_answer') {
      setCorrectShortAnswer(typeof q.correct_answer === 'string' ? q.correct_answer : '')
    }
    setFormOpen(true)
  }

  function buildPayload() {
    let questionOptions: { id: string; text: string }[] = []
    let correctAnswer: string | null = null

    if (type === 'multiple_choice') {
      const letters = ['A', 'B', 'C', 'D']
      questionOptions = options
        .map((opt, idx) => ({ id: letters[idx], text: opt }))
        .filter((o) => o.text.trim() !== '')
      correctAnswer = correctOption
    } else if (type === 'true_false') {
      questionOptions = [
        { id: 'true', text: 'صحيح' },
        { id: 'false', text: 'خطأ' },
      ]
      correctAnswer = correctTrueFalse
    } else if (type === 'short_answer') {
      correctAnswer = correctShortAnswer || null
    }

    return { questionOptions, correctAnswer }
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      setError('نص السؤال مطلوب')
      return
    }
    const { questionOptions, correctAnswer } = buildPayload()
    if (type === 'multiple_choice' && questionOptions.length < 2) {
      setError('أضف خيارين على الأقل')
      return
    }
    setLoading(true)
    setError(null)

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from('questions')
        .update({
          question_text: text,
          question_type: type,
          options: questionOptions,
          correct_answer: correctAnswer,
          marks: Number(marks) || 1,
          explanation: explanation || null,
          image_url: imageUrl || null,
        })
        .eq('id', editingId)
        .select()
        .single()

      if (updateError || !data) { setError('حدث خطأ أثناء حفظ التعديلات'); setLoading(false); return }

      const updated = items.map((q) => (q.id === editingId ? data : q))
      setItems(updated)
      await syncExamTotalMarks(updated)
      resetForm()
      setLoading(false)
      router.refresh()
      return
    }

    const { data, error: insertError } = await supabase
      .from('questions')
      .insert({
        exam_id: examId,
        question_text: text,
        question_type: type,
        options: questionOptions,
        correct_answer: correctAnswer,
        marks: Number(marks) || 1,
        explanation: explanation || null,
        image_url: imageUrl || null,
        order_index: items.length,
      })
      .select()
      .single()

    if (insertError || !data) {
      setError('حدث خطأ أثناء حفظ السؤال')
      setLoading(false)
      return
    }

    const updated = [...items, data]
    setItems(updated)
    await syncExamTotalMarks(updated)
    resetForm()
    setLoading(false)
    router.refresh()
  }

  async function deleteQuestion(id: string) {
    if (!confirm('حذف هذا السؤال نهائياً؟')) return
    const { error: delError } = await supabase.from('questions').delete().eq('id', id)
    if (!delError) {
      const updated = items.filter((q) => q.id !== id)
      setItems(updated)
      await syncExamTotalMarks(updated)
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-ruwad-navy">
          الأسئلة <span className="text-sm text-ruwad-navy/50 font-normal">({items.reduce((s, q) => s + q.marks, 0)} درجة)</span>
        </h2>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f) }}
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="border border-ruwad-blue text-ruwad-blue px-4 py-2 rounded-ruwad-sm text-sm font-semibold hover:bg-ruwad-blue/5 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Upload size={16} /> {importing ? 'جارٍ الاستيراد...' : 'استيراد من JSON / CSV'}
          </button>
          {!formOpen && (
            <button
              onClick={() => setFormOpen(true)}
              className="bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition flex items-center gap-1.5"
            >
              <Plus size={16} /> سؤال جديد
            </button>
          )}
        </div>
      </div>

      <div className="text-xs text-ruwad-navy/50 -mt-2 mb-3 flex items-start gap-1.5">
        <span>الاستيراد يضيف فقط أسئلة اختيار من متعدد ولا يؤثر على الأنواع الأخرى.</span>
      </div>

      {importError && (
        <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3 mb-4 flex items-start gap-2">
          <span>{importError}</span>
        </div>
      )}
      {importSummary && (
        <div className="bg-ruwad-lime/15 text-ruwad-navy text-sm rounded-ruwad-sm px-4 py-3 mb-4">{importSummary}</div>
      )}

      {formOpen && (
        <form onSubmit={saveQuestion} className="flex flex-col gap-3 border border-ruwad-gray/60 rounded-ruwad-sm p-4 mb-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-3 py-2">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as QuestionType)}
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue"
            >
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              placeholder="الدرجة"
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue"
            />
          </div>

          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="نص السؤال"
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue resize-none"
          />

          {type === 'multiple_choice' && (
            <div className="flex flex-col gap-2">
              {['A', 'B', 'C', 'D'].map((letter, idx) => (
                <div key={letter} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={correctOption === letter}
                    onChange={() => setCorrectOption(letter)}
                    className="accent-ruwad-blue"
                  />
                  <span className="text-sm font-medium text-ruwad-navy w-5">{letter}</span>
                  <input
                    value={options[idx]}
                    onChange={(e) => {
                      const next = [...options]
                      next[idx] = e.target.value
                      setOptions(next)
                    }}
                    placeholder={`الخيار ${letter}`}
                    className="flex-1 border border-ruwad-gray rounded-ruwad-sm px-3 py-1.5 outline-none focus:border-ruwad-blue text-sm"
                  />
                </div>
              ))}
              <p className="text-xs text-ruwad-navy/50">اختر الدائرة بجانب الإجابة الصحيحة</p>
            </div>
          )}

          {type === 'true_false' && (
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" checked={correctTrueFalse === 'true'} onChange={() => setCorrectTrueFalse('true')} className="accent-ruwad-blue" />
                صحيح
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" checked={correctTrueFalse === 'false'} onChange={() => setCorrectTrueFalse('false')} className="accent-ruwad-blue" />
                خطأ
              </label>
            </div>
          )}

          {type === 'short_answer' && (
            <input
              value={correctShortAnswer}
              onChange={(e) => setCorrectShortAnswer(e.target.value)}
              placeholder="الإجابة الصحيحة"
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue"
            />
          )}

          {type === 'essay' && (
            <p className="text-xs text-ruwad-navy/50">الأسئلة المقالية تحتاج تصحيحاً يدوياً من المدرب.</p>
          )}

          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="رابط صورة للسؤال (اختياري)"
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue text-sm"
          />

          <input
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="شرح الإجابة الصحيحة (اختياري)"
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue text-sm"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-ruwad-blue text-white px-5 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة السؤال'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 rounded-ruwad-sm text-sm font-semibold text-ruwad-navy/60 hover:bg-ruwad-gray/30 transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد أسئلة بعد.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((q, idx) => {
            const style = TYPE_STYLE[q.question_type]
            const TypeIcon = style.icon
            return (
              <div key={q.id} className={`flex items-start gap-3 p-4 rounded-ruwad-sm border ${style.border} ${style.bg}`}>
                <span className="w-6 h-6 rounded-full bg-white text-ruwad-navy text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  {idx + 1}
                </span>
                <TypeIcon size={18} className={`${style.color} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ruwad-navy">{q.question_text}</p>
                  <p className={`text-xs mt-1 font-semibold ${style.color}`}>
                    {TYPE_LABELS[q.question_type]} · {q.marks} درجة
                  </p>
                </div>
                <button
                  onClick={() => startEdit(q)}
                  aria-label="تعديل السؤال"
                  className="text-ruwad-blue hover:bg-white p-2 rounded-ruwad-sm transition shrink-0"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  aria-label="حذف السؤال"
                  className="text-red-500 hover:bg-white p-2 rounded-ruwad-sm transition shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
