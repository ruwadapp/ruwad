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
    const passed = score >= exam.passing_marks

    await supabase
      .from('exam_submissions')
      .update({
        answers, score, total_marks: exam.total_marks,
        percentage, passed, submitted_at: new Date().toISOString(),
        time_spent_seconds: timeSpent,
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
      <div className="bg-white rounded-ruwad shadow-card p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex-1">
          <div className="w-full bg-ruwad-gray/40 rounded-full h-2">
            <div
              className="bg-ruwad-blue h-2 rounded-full transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-ruwad-navy/50 mt-1.5">
            {answeredCount} من {questions.length} مُجاب
          </p>
        </div>
        {timeLeft !== null && (
          <div className="flex items-center gap-1.5 text-ruwad-navy font-bold mr-4">
            <Clock size={18} className={timeLeft < 60 ? 'text-red-500' : 'text-ruwad-blue'} />
            <span className={timeLeft < 60 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {question && (
        <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
          <p className="text-sm text-ruwad-navy/50">
            سؤال {currentIndex + 1} من {questions.length} · {question.marks} درجة
          </p>
          <p className="text-lg font-medium text-ruwad-navy">{question.question_text}</p>

          {question.question_type === 'multiple_choice' && (
            <div className="flex flex-col gap-2">
              {question.options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-ruwad-sm border-2 cursor-pointer transition ${
                    answers[question.id] === opt.id ? 'border-ruwad-blue bg-ruwad-blue/5' : 'border-ruwad-gray/60'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === opt.id}
                    onChange={() => setAnswer(opt.id)}
                    className="accent-ruwad-blue"
                  />
                  <span className="text-ruwad-navy">{opt.text}</span>
                </label>
              ))}
            </div>
          )}

          {question.question_type === 'true_false' && (
            <div className="grid grid-cols-2 gap-3">
              {[{ id: 'true', label: 'صحيح' }, { id: 'false', label: 'خطأ' }].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAnswer(opt.id)}
                  className={`py-3 rounded-ruwad-sm font-semibold border-2 transition ${
                    answers[question.id] === opt.id
                      ? 'bg-ruwad-blue text-white border-ruwad-blue'
                      : 'bg-white text-ruwad-navy border-ruwad-gray'
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
