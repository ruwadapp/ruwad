'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ChallengeQuestion } from '@/lib/types'
import { Plus, Trash2, Zap, Pencil, Timer, Upload } from 'lucide-react'

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
  const [timeLimit, setTimeLimit] = useState('20')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSummary, setImportSummary] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // ===== استيراد أسئلة اختيار من متعدد عبر JSON أو CSV (نفس صيغة ملفات الامتحانات) =====
  // حقول إضافية اختيارية خاصة بالتحدي: marks/points (افتراضي 10) و time/time_limit بالثواني (افتراضي 20)
  type ImportedRow = {
    text: string
    options: { id: string; text: string }[]
    correct: string
    marks: number
    timeLimit: number
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

  function normalizeRow(rowNum: string, text: string, options: { id: string; text: string }[], rawCorrect: string, marksRaw: unknown, timeRaw: unknown): ImportedRow {
    if (!text) throw new Error(`${rowNum}: نص السؤال مفقود`)
    if (options.length < 2) throw new Error(`${rowNum}: يجب توفير خيارين على الأقل`)
    const up = rawCorrect.trim().toUpperCase()
    const correct = options.find((o) => o.id === up)
      ? up
      : options.find((o) => o.text.toLowerCase() === rawCorrect.trim().toLowerCase())?.id ?? ''
    if (!correct) throw new Error(`${rowNum}: الإجابة الصحيحة "${rawCorrect}" غير مطابقة لأي خيار`)
    const marksNum = Number(marksRaw)
    const timeNum = Number(timeRaw)
    return {
      text,
      options,
      correct,
      marks: Number.isFinite(marksNum) && marksNum > 0 ? marksNum : 10,
      timeLimit: Number.isFinite(timeNum) && timeNum >= 5 ? timeNum : 20,
    }
  }

  function parseCsv(content: string): ImportedRow[] {
    const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '')
    if (lines.length < 2) throw new Error('الملف لا يحتوي بيانات كافية')
    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
    const idx = (name: string) => header.indexOf(name)
    const qIdx = idx('question') !== -1 ? idx('question') : idx('question_text')
    if (qIdx === -1) throw new Error('يجب أن يحتوي الملف على عمود "question"')
    const correctIdx = idx('correct') !== -1 ? idx('correct') : idx('correct_answer')
    const marksIdx = idx('marks') !== -1 ? idx('marks') : idx('points')
    const timeIdx = idx('time') !== -1 ? idx('time') : idx('time_limit')
    const optionIdxs = LETTERS
      .map((l, i) => idx(`option_${l.toLowerCase()}`) !== -1 ? idx(`option_${l.toLowerCase()}`) : idx(`option${i + 1}`))
      .filter((i) => i !== -1)

    return lines.slice(1).map((line, rowNum) => {
      const cells = parseCsvLine(line)
      const options = optionIdxs
        .map((oi, i) => ({ id: LETTERS[i], text: (cells[oi] ?? '').trim() }))
        .filter((o) => o.text !== '')
      return normalizeRow(`السطر ${rowNum + 2}`, cells[qIdx]?.trim() ?? '', options,
        (correctIdx !== -1 ? cells[correctIdx] : '') ?? '',
        marksIdx !== -1 ? cells[marksIdx] : undefined,
        timeIdx !== -1 ? cells[timeIdx] : undefined)
    })
  }

  function parseJson(content: string): ImportedRow[] {
    let raw: unknown
    try { raw = JSON.parse(content) } catch { throw new Error('الملف ليس JSON صالحاً') }
    const arr = Array.isArray(raw) ? raw : (raw as { questions?: unknown[] })?.questions
    if (!Array.isArray(arr)) throw new Error('يجب أن يكون الملف مصفوفة أسئلة أو يحتوي على مفتاح "questions"')

    return arr.map((item, rowNum) => {
      const obj = item as Record<string, unknown>
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
      return normalizeRow(`العنصر ${rowNum + 1}`,
        String(obj.question ?? obj.question_text ?? '').trim(), options,
        String(obj.correct ?? obj.correct_answer ?? ''),
        obj.marks ?? obj.points, obj.time ?? obj.time_limit ?? obj.time_limit_seconds)
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
        challenge_id: challengeId,
        question_text: r.text,
        question_type: 'multiple_choice' as CQType,
        options: r.options,
        correct_answer: r.correct,
        marks: r.marks,
        time_limit_seconds: r.timeLimit,
        order_index: items.length + i,
      }))

      const { data, error: insertError } = await supabase.from('challenge_questions').insert(payload).select()
      if (insertError || !data) throw new Error('حدث خطأ أثناء حفظ الأسئلة في قاعدة البيانات')

      const updated = [...items, ...data]
      setItems(updated)
      await syncTotalMarks(updated)
      setImportSummary(`تم استيراد ${data.length} سؤال بنجاح ✓`)
      router.refresh()
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع أثناء الاستيراد')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function syncTotalMarks(newQuestions: ChallengeQuestion[]) {
    const total = newQuestions.reduce((s, q) => s + q.marks, 0)
    await supabase.from('challenges').update({ total_marks: total }).eq('id', challengeId)
  }

  function resetForm() {
    setText(''); setOptions(['', '', '', '']); setCorrectOption('A')
    setCorrectTrueFalse('true'); setCorrectShortAnswer(''); setMarks('10'); setTimeLimit('20')
    setFormOpen(false); setEditingId(null)
  }

  function startEdit(q: ChallengeQuestion) {
    setEditingId(q.id)
    setText(q.question_text)
    setType(q.question_type)
    setMarks(q.marks.toString())
    setTimeLimit((q.time_limit_seconds ?? 20).toString())
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

    const payload = {
      question_text: text, question_type: type, options: questionOptions,
      correct_answer: correctAnswer, marks: Number(marks) || 10,
      time_limit_seconds: Number(timeLimit) || 20,
    }

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from('challenge_questions')
        .update(payload)
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
      .insert({ challenge_id: challengeId, ...payload, order_index: items.length })
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
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f) }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="border-2 border-ruwad-lime text-ruwad-navy px-4 py-2 rounded-ruwad-sm text-sm font-bold hover:bg-ruwad-lime/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Upload size={16} /> {importing ? 'جارٍ الاستيراد...' : 'استيراد JSON / CSV'}
            </button>
            <button onClick={() => setFormOpen(true)} className="bg-ruwad-lime text-ruwad-navy px-4 py-2 rounded-ruwad-sm text-sm font-bold hover:opacity-90 transition flex items-center gap-1.5">
              <Plus size={16} /> سؤال جديد
            </button>
          </div>
        )}
      </div>

      {importError && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-2.5 mb-3">{importError}</div>}
      {importSummary && <div className="bg-green-50 text-green-600 text-sm rounded-ruwad-sm px-4 py-2.5 mb-3">{importSummary}</div>}

      {formOpen && (
        <form onSubmit={saveQuestion} className="flex flex-col gap-3 border-2 border-ruwad-lime/60 rounded-ruwad-sm p-4 mb-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-3 py-2">{error}</div>}

          <div className="grid grid-cols-3 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value as CQType)}
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-lime">
              {Object.entries(TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
            <input type="number" min={1} value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="النقاط"
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-lime" />
            <div className="relative">
              <Timer size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ruwad-navy/40" />
              <input type="number" min={5} max={120} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="الوقت (ثانية)"
                className="w-full border border-ruwad-gray rounded-ruwad-sm pr-9 pl-3 py-2 outline-none focus:border-ruwad-lime" />
            </div>
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
                <p className="text-xs text-ruwad-navy/50 mt-1">{TYPE_LABELS[q.question_type]} · {q.marks} نقطة · {q.time_limit_seconds ?? 20} ثانية</p>
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
