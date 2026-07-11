'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Zap, Timer } from 'lucide-react'

const SHAPE_COLORS = ['bg-red-500 active:bg-red-600', 'bg-ruwad-blue active:opacity-90', 'bg-amber-400 active:opacity-90', 'bg-ruwad-lime active:opacity-90']
const SHAPES = ['▲', '◆', '●', '■']

interface RunQuestion {
  question_id: string
  question_text: string
  options: { id: string; text: string }[]
  time_remaining_ms: number
  finished: boolean
  correct_count: number
  wrong_count: number
}

export function ChallengeSprintPlayer({ challengeId, title }: { challengeId: string; title: string }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'finished'>('intro')
  const [runId, setRunId] = useState<string | null>(null)
  const [question, setQuestion] = useState<RunQuestion | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [counts, setCounts] = useState({ correct: 0, wrong: 0 })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const busyRef = useRef(false)

  const fetchNextQuestion = useCallback(async (id: string) => {
    const { data, error: rpcError } = await supabase.rpc('get_run_current_question', { p_run_id: id })
    const row = data?.[0]
    if (rpcError || !row) { setPhase('finished'); return }
    setCounts({ correct: row.correct_count, wrong: row.wrong_count })
    if (row.finished) { setPhase('finished'); return }
    setQuestion(row)
    setFeedback(null)
    setTimeLeft(row.time_remaining_ms)
  }, [supabase])

  async function start() {
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('start_challenge_run', { p_challenge_id: challengeId })
    setLoading(false)
    if (rpcError || !data) { setError('تعذّر بدء السباق — تأكد من وجود أسئلة ووقت محدد للتحدي'); return }
    setRunId(data.id)
    setPhase('playing')
    fetchNextQuestion(data.id)
  }

  async function answer(optionId: string) {
    if (!runId || !question || busyRef.current) return
    busyRef.current = true
    setFeedback(null)
    const { data } = await supabase.rpc('submit_run_answer', {
      p_run_id: runId, p_question_id: question.question_id, p_option_id: optionId,
    })
    const result = data?.[0]
    if (result) {
      setFeedback(result.is_correct ? 'correct' : 'wrong')
      setCounts({ correct: result.correct_count, wrong: result.wrong_count })
      setTimeout(() => {
        busyRef.current = false
        if (result.finished) setPhase('finished')
        else fetchNextQuestion(runId)
      }, 500)
    } else {
      busyRef.current = false
    }
  }

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1000) {
          if (runId) fetchNextQuestion(runId)
          return 0
        }
        return t - 1000
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, runId, fetchNextQuestion])

  if (phase === 'intro') {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col items-center gap-4 text-center max-w-md mx-auto">
        <Zap size={40} className="text-ruwad-lime" />
        <h2 className="text-xl font-bold text-ruwad-navy">{title}</h2>
        <p className="text-sm text-ruwad-navy/60">
          أجب على أكبر عدد ممكن من الأسئلة قبل انتهاء الوقت. كل إجابة صحيحة تُحسب لك — لا تنتظر أحداً، ابدأ بالسرعة التي تناسبك.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={start} disabled={loading}
          className="bg-ruwad-lime text-ruwad-navy px-8 py-3 rounded-ruwad-sm font-bold hover:opacity-90 transition shadow-ruwad disabled:opacity-50">
          {loading ? 'جارٍ التجهيز...' : 'ابدأ السباق'}
        </button>
      </div>
    )
  }

  if (phase === 'finished') {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col items-center gap-3 text-center max-w-md mx-auto">
        <Timer size={40} className="text-ruwad-navy/40" />
        <h2 className="text-xl font-bold text-ruwad-navy">انتهى الوقت!</h2>
        <div className="flex gap-6 mt-2">
          <div>
            <p className="text-3xl font-extrabold text-ruwad-lime">{counts.correct}</p>
            <p className="text-xs text-ruwad-navy/50">إجابة صحيحة</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-red-400">{counts.wrong}</p>
            <p className="text-xs text-ruwad-navy/50">إجابة خاطئة</p>
          </div>
        </div>
        <p className="text-xs text-ruwad-navy/40 mt-2">شاهد ترتيبك الكامل من صفحة نتائج التحدي.</p>
      </div>
    )
  }

  if (!question) {
    return <div className="text-center text-ruwad-navy/50 py-10">جارٍ تحميل السؤال...</div>
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between bg-white rounded-ruwad-sm shadow-card px-4 py-2.5">
        <span className="text-sm font-bold text-ruwad-navy flex items-center gap-1.5">
          <CheckCircle2 size={16} className="text-ruwad-lime" /> {counts.correct}
          <XCircle size={16} className="text-red-400 mr-2" /> {counts.wrong}
        </span>
        <span className="text-sm font-bold text-ruwad-navy flex items-center gap-1.5">
          <Timer size={16} /> {Math.ceil(timeLeft / 1000)} ث
        </span>
      </div>

      <div className="bg-ruwad-gradient text-white rounded-ruwad shadow-ruwad p-6 text-center">
        <p className="text-lg font-bold">{question.question_text}</p>
      </div>

      {feedback && (
        <div className={`text-center font-bold text-lg ${feedback === 'correct' ? 'text-ruwad-lime' : 'text-red-500'}`}>
          {feedback === 'correct' ? '✓ إجابة صحيحة!' : '✗ إجابة خاطئة'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {question.options.map((opt, idx) => (
          <button
            key={opt.id}
            onClick={() => answer(opt.id)}
            disabled={!!feedback}
            className={`${SHAPE_COLORS[idx % 4]} text-white rounded-ruwad-sm p-5 font-bold text-lg flex items-center justify-center gap-2 transition disabled:opacity-50`}
          >
            <span>{SHAPES[idx % 4]}</span> {opt.text}
          </button>
        ))}
      </div>
    </div>
  )
}
