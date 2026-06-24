'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Challenge, ChallengeQuestion } from '@/lib/types'
import { Clock, Zap, Trophy } from 'lucide-react'

export function ChallengeTaker({
  challenge,
  questions,
}: {
  challenge: Challenge
  questions: ChallengeQuestion[]
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(
    challenge.time_limit_minutes ? challenge.time_limit_minutes * 60 : null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; percentage: number } | null>(null)
  const startTimeRef = useRef(Date.now())
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    let score = 0
    for (const q of questions) {
      const answer = answers[q.id]
      if (!answer) continue
      if (answer === q.correct_answer) score += q.marks
      else if (
        q.question_type === 'short_answer' &&
        typeof q.correct_answer === 'string' &&
        answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
      ) {
        score += q.marks
      }
    }
    const percentage = challenge.total_marks > 0 ? Math.round((score / challenge.total_marks) * 100) : 0

    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('challenge_submissions').insert({
      challenge_id: challenge.id,
      student_id: user!.id,
      answers,
      score,
      percentage,
    })

    setResult({ score, percentage })
    setIsSubmitting(false)
    router.refresh()
  }, [isSubmitting, questions, answers, challenge, supabase, router])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) { handleSubmit(); return }
    const timer = setInterval(() => setTimeLeft((t) => (t ?? 0) - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, handleSubmit])

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (result) {
    return (
      <div className="bg-ruwad-lime rounded-ruwad shadow-ruwad-lg p-10 flex flex-col items-center gap-4 text-center max-w-md mx-auto">
        <Trophy size={56} className="text-ruwad-navy" />
        <h2 className="text-2xl font-bold text-ruwad-navy">أحسنت!</h2>
        <p className="text-4xl font-bold text-ruwad-navy">{result.score}/{challenge.total_marks}</p>
        <p className="text-ruwad-navy/70">{result.percentage}%</p>
      </div>
    )
  }

  const question = questions[currentIndex]
  const answeredCount = Object.keys(answers).length

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-ruwad-navy rounded-ruwad shadow-card p-4 flex items-center justify-between text-white">
        <div className="flex-1 flex items-center gap-2">
          <Zap size={18} className="text-ruwad-lime" />
          <div className="flex-1">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-ruwad-lime h-2 rounded-full transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
            </div>
          </div>
        </div>
        {timeLeft !== null && (
          <div className="flex items-center gap-1.5 font-bold mr-4">
            <Clock size={18} className={timeLeft < 30 ? 'text-red-400' : 'text-ruwad-lime'} />
            <span className={timeLeft < 30 ? 'text-red-400' : ''}>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {question && (
        <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 border-r-4 border-ruwad-lime">
          <p className="text-sm text-ruwad-navy/50">سؤال {currentIndex + 1} من {questions.length} · {question.marks} نقطة</p>
          <p className="text-lg font-medium text-ruwad-navy">{question.question_text}</p>

          {question.question_type === 'multiple_choice' && (
            <div className="flex flex-col gap-2">
              {question.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswer(opt.id)}
                  className={`flex items-center gap-3 p-3 rounded-ruwad-sm border-2 text-right transition ${
                    answers[question.id] === opt.id ? 'border-ruwad-lime bg-ruwad-lime/15' : 'border-ruwad-gray/60'
                  }`}
                >
                  <span className="text-ruwad-navy">{opt.text}</span>
                </button>
              ))}
            </div>
          )}

          {question.question_type === 'true_false' && (
            <div className="grid grid-cols-2 gap-3">
              {[{ id: 'true', label: 'صحيح' }, { id: 'false', label: 'خطأ' }].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswer(opt.id)}
                  className={`py-3 rounded-ruwad-sm font-semibold border-2 transition ${
                    answers[question.id] === opt.id ? 'bg-ruwad-lime text-ruwad-navy border-ruwad-lime' : 'bg-white text-ruwad-navy border-ruwad-gray'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {question.question_type === 'short_answer' && (
            <input
              value={answers[question.id] ?? ''}
              onChange={(e) => setAnswer(e.target.value)}
              className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-lime transition"
              placeholder="اكتب إجابتك"
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
          <button onClick={() => setCurrentIndex((i) => i + 1)} className="px-5 py-2.5 rounded-ruwad-sm font-bold bg-ruwad-navy text-white hover:opacity-90 transition">
            التالي
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-ruwad-sm font-bold bg-ruwad-lime text-ruwad-navy hover:opacity-90 transition shadow-ruwad flex items-center gap-2"
          >
            <Zap size={18} /> {isSubmitting ? 'جارٍ الإرسال...' : 'إنهاء التحدي'}
          </button>
        )}
      </div>
    </div>
  )
}
