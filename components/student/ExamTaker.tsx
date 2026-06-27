'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { gradeExam } from '@/lib/utils/gradeExam'
import type { Exam, Question } from '@/lib/types'
import { Clock } from 'lucide-react'

interface ExamTakerProps {
  exam: Exam
  questions: Question[]
  submissionId: string
}

export function ExamTaker({ exam, questions, submissionId }: ExamTakerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(
    exam.duration_minutes ? exam.duration_minutes * 60 : null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const startTimeRef = useRef(Date.now())
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const key = `exam_answers_${submissionId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try { setAnswers(JSON.parse(saved)) } catch {}
    }
  }, [submissionId])

  useEffect(() => {
    localStorage.setItem(`exam_answers_${submissionId}`, JSON.stringify(answers))
  }, [answers, submissionId])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000)
    const { score } = gradeExam(questions, answers)
    const percentage = exam.total_marks > 0 ? (score / exam.total_marks) * 100 : 0
    // درجة النجاح تُقارَن كنسبة مئوية، لا كعلامة خام — تبقى صحيحة دائماً بغض النظر عن إجمالي علامات الامتحان
    const passed = percentage >= exam.passing_marks
    // إن وُجدت أسئلة مقالية، تبقى النتيجة معلَّقة (graded_at = NULL) حتى يصحّحها المدرب يدوياً
    const hasEssay = questions.some((q) => q.question_type === 'essay')
    const now = new Date().toISOString()

    await supabase
      .from('exam_submissions')
      .update({
        answers, score, total_marks: exam.total_marks,
        percentage, passed, submitted_at: now,
        time_spent_seconds: timeSpent,
        graded_at: hasEssay ? null : now,
      })
      .eq('id', submissionId)

    localStorage.removeItem(`exam_answers_${submissionId}`)
    router.refresh()
  }, [isSubmitting, questions, answers, exam, submissionId, supabase, router])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) { handleSubmit(); return }
    const timer = setInterval(() => setTimeLeft((t) => (t ?? 0) - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, handleSubmit])

  const question = questions[currentIndex]
  const answeredCount = Object.keys(answers).length

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex-1">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-ruwad-lime h-2 rounded-full transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-white/70 mt-1.5">
            {answeredCount} من {questions.length} مُجاب
          </p>
        </div>
        {timeLeft !== null && (
          <div className="relative flex items-center gap-1.5 text-white font-bold mr-4">
            <Clock size={18} className={timeLeft < 60 ? 'text-red-300' : 'text-ruwad-lime'} />
            <span className={timeLeft < 60 ? 'text-red-300' : ''}>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* ===== ملاح سريع بين الأسئلة ===== */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined
          const isCurrent = idx === currentIndex
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-full text-xs font-bold shrink-0 transition-all ${
                isCurrent
                  ? 'bg-ruwad-blue text-white scale-110 shadow-ruwad'
                  : isAnswered
                  ? 'bg-ruwad-lime text-ruwad-navy'
                  : 'bg-white border-2 border-ruwad-gray text-ruwad-navy/50'
              }`}
            >
              {idx + 1}
            </button>
          )
        })}
      </div>

      {question && (
        <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 border-r-4 border-ruwad-blue">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-ruwad-gradient text-white text-sm font-bold flex items-center justify-center shrink-0">
              {currentIndex + 1}
            </span>
            <p className="text-sm text-ruwad-navy/50">
              من {questions.length} · {question.marks} درجة
            </p>
          </div>
          <p className="text-lg font-medium text-ruwad-navy">{question.question_text}</p>
          {question.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={question.image_url} alt="صورة السؤال" className="rounded-ruwad-sm max-h-72 w-auto object-contain border border-ruwad-gray/40" />
          )}

          {question.question_type === 'multiple_choice' && (
            <div className="flex flex-col gap-2">
              {question.options.map((opt, optIdx) => {
                const letterColors = ['bg-red-500', 'bg-ruwad-blue', 'bg-amber-500', 'bg-ruwad-lime']
                const selected = answers[question.id] === opt.id
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-ruwad-sm border-2 cursor-pointer transition ${
                      selected ? 'border-ruwad-blue bg-ruwad-blue/5' : 'border-ruwad-gray/60 hover:border-ruwad-gray'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${letterColors[optIdx % 4]}`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <input
                      type="radio"
                      name={question.id}
                      checked={selected}
                      onChange={() => setAnswer(opt.id)}
                      className="accent-ruwad-blue"
                    />
                    <span className="text-ruwad-navy">{opt.text}</span>
                  </label>
                )
              })}
            </div>
          )}

          {question.question_type === 'true_false' && (
            <div className="grid grid-cols-2 gap-3">
              {[{ id: 'true', label: 'صحيح', color: 'bg-ruwad-lime text-ruwad-navy border-ruwad-lime' }, { id: 'false', label: 'خطأ', color: 'bg-red-400 text-white border-red-400' }].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAnswer(opt.id)}
                  className={`py-3 rounded-ruwad-sm font-bold border-2 transition ${
                    answers[question.id] === opt.id
                      ? opt.color
                      : 'bg-white text-ruwad-navy border-ruwad-gray hover:border-ruwad-gray/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {(question.question_type === 'short_answer' || question.question_type === 'essay') && (
            <textarea
              value={answers[question.id] ?? ''}
              onChange={(e) => setAnswer(e.target.value)}
              rows={question.question_type === 'essay' ? 6 : 2}
              className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none"
              placeholder="اكتب إجابتك هنا"
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
          className="px-5 py-2.5 rounded-ruwad-sm font-semibold text-ruwad-navy border-2 border-ruwad-gray disabled:opacity-40 transition"
        >
          السابق
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="px-5 py-2.5 rounded-ruwad-sm font-semibold bg-ruwad-blue text-white hover:opacity-90 transition"
          >
            التالي
          </button>
        ) : (
          <button
            onClick={() => setConfirmOpen(true)}
            className="px-6 py-2.5 rounded-ruwad-sm font-semibold bg-ruwad-lime text-ruwad-navy hover:opacity-90 transition shadow-ruwad"
          >
            تسليم الامتحان
          </button>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-ruwad p-6 max-w-sm w-full flex flex-col gap-4">
            <h3 className="font-bold text-ruwad-navy text-lg">تأكيد التسليم</h3>
            <p className="text-sm text-ruwad-navy/70">
              أجبت على {answeredCount} من {questions.length} سؤال. لا يمكن التعديل بعد التسليم. هل تريد المتابعة؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-ruwad-blue text-white py-2.5 rounded-ruwad-sm font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'جارٍ التسليم...' : 'تأكيد التسليم'}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 border-2 border-ruwad-gray text-ruwad-navy py-2.5 rounded-ruwad-sm font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
