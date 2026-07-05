'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChallengeSession } from '@/lib/types'
import { CheckCircle2, XCircle, Clock, Trophy } from 'lucide-react'

const SHAPE_COLORS = ['bg-red-500 active:bg-red-600', 'bg-ruwad-blue active:opacity-90', 'bg-amber-400 active:opacity-90', 'bg-ruwad-lime active:opacity-90']
const SHAPES = ['▲', '◆', '●', '■']

interface LiveQuestion {
  id: string
  question_text: string
  question_type: string
  options: { id: string; text: string }[]
  marks: number
  time_limit_seconds: number
  order_index: number
}

interface LeaderboardRow { student_id: string; score: number; full_name: string }

export function ChallengePlayerLiveView({ session: initialSession }: { session: ChallengeSession }) {
  const [session, setSession] = useState(initialSession)
  const [question, setQuestion] = useState<LiveQuestion | null>(null)
  const [myAnswer, setMyAnswer] = useState<string | null>(null)
  const [myResult, setMyResult] = useState<{ is_correct: boolean; points_earned: number } | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [myTotalScore, setMyTotalScore] = useState(0)
  const supabase = createClient()
  const questionStartRef = useRef<number>(0)
  const loadedQuestionIndex = useRef<number>(-1)

  const loadQuestion = useCallback(async (sess: ChallengeSession) => {
    if (loadedQuestionIndex.current === sess.current_question_index) return
    loadedQuestionIndex.current = sess.current_question_index
    setMyAnswer(null)
    setMyResult(null)
    const { data } = await supabase.rpc('get_live_question', { p_session_id: sess.id })
    setQuestion(data?.[0] ?? null)
    questionStartRef.current = sess.question_started_at ? new Date(sess.question_started_at).getTime() : Date.now()
  }, [supabase])

  const loadLeaderboard = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('challenge_session_participants')
      .select('student_id, score, student:profiles!student_id(full_name)')
      .eq('session_id', session.id)
      .order('score', { ascending: false })
    if (data) {
      setLeaderboard(data.map((p) => ({
        student_id: p.student_id, score: p.score,
        full_name: (p.student as unknown as { full_name?: string })?.full_name ?? 'طالب',
      })))
      const mine = data.find((p) => p.student_id === user?.id)
      if (mine) setMyTotalScore(mine.score)
    }
  }, [session.id, supabase])

  useEffect(() => {
    if (session.status === 'question') loadQuestion(session)
    if (session.status === 'leaderboard' || session.status === 'ended') loadLeaderboard()
  }, [session, loadQuestion, loadLeaderboard])

  useEffect(() => {
    const channel = supabase
      .channel(`challenge-player:${session.id}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'challenge_sessions', filter: `id=eq.${session.id}` }, (payload) => {
        setSession(payload.new as ChallengeSession)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session.id, supabase])

  useEffect(() => {
    if (session.status !== 'question' || !question) return
    const tick = () => {
      const elapsed = Date.now() - questionStartRef.current
      setTimeLeft(Math.max(0, Math.ceil((question.time_limit_seconds * 1000 - elapsed) / 1000)))
    }
    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [session.status, question])

  async function submitAnswer(optionId: string) {
    if (myAnswer || !question) return
    setMyAnswer(optionId)
    const timeTaken = Math.min(question.time_limit_seconds * 1000, Date.now() - questionStartRef.current)
    const { data } = await supabase.rpc('submit_challenge_answer', {
      p_session_id: session.id, p_question_id: question.id, p_option_id: optionId, p_time_taken_ms: Math.round(timeTaken),
    })
    if (data?.[0]) setMyResult(data[0])
  }

  if (session.status === 'lobby') {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
        <Clock size={48} className="text-ruwad-lime animate-pulse" />
        <h2 className="font-bold text-ruwad-navy">بانتظار بدء المدرب التحدي...</h2>
        <p className="text-sm text-ruwad-navy/50">استعد!</p>
      </div>
    )
  }

  if (session.status === 'question' && question) {
    return (
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ruwad-navy/40">سؤال {question.order_index + 1}</span>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
            timeLeft <= 5 ? 'bg-red-500' : 'bg-ruwad-blue'
          }`}>
            {timeLeft}
          </div>
        </div>

        <h2 className="text-xl font-bold text-ruwad-navy text-center">{question.question_text}</h2>

        {myAnswer ? (
          <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col items-center gap-2 text-center">
            {myResult ? (
              myResult.is_correct ? (
                <>
                  <CheckCircle2 size={48} className="text-ruwad-blue" />
                  <p className="font-bold text-ruwad-navy">إجابة صحيحة! +{myResult.points_earned}</p>
                </>
              ) : (
                <>
                  <XCircle size={48} className="text-red-400" />
                  <p className="font-bold text-ruwad-navy">إجابة خاطئة</p>
                </>
              )
            ) : (
              <p className="text-ruwad-navy/50">جارٍ التحقق...</p>
            )}
            <p className="text-xs text-ruwad-navy/40 mt-1">بانتظار باقي الطلاب...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((opt, idx) => (
              <button
                key={opt.id}
                onClick={() => submitAnswer(opt.id)}
                className={`${SHAPE_COLORS[idx % 4]} text-white rounded-ruwad p-6 flex flex-col items-center gap-2 font-bold transition shadow-card`}
              >
                <span className="text-2xl">{SHAPES[idx % 4]}</span> {opt.text}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (session.status === 'leaderboard' || session.status === 'ended') {
    const myRank = leaderboard.findIndex((p) => p.score === myTotalScore) + 1
    const top5 = leaderboard.slice(0, 5)

    return (
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-6 text-center text-white">
          <p className="text-sm opacity-80">{session.status === 'ended' ? 'نتيجتك النهائية' : 'نقاطك الحالية'}</p>
          <p className="text-4xl font-extrabold mt-1">{myTotalScore}</p>
          {myRank > 0 && <p className="text-sm opacity-70 mt-1">ترتيبك: #{myRank}</p>}
        </div>

        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-sm font-bold text-ruwad-navy mb-3 flex items-center gap-1.5">
            <Trophy size={16} className="text-ruwad-lime" /> {session.status === 'ended' ? 'النتيجة النهائية' : 'الترتيب الحالي'}
          </h2>
          <div className="flex flex-col gap-2">
            {top5.map((p, idx) => (
              <div key={p.student_id} className="flex items-center gap-3 p-2.5 rounded-ruwad-sm bg-ruwad-gray/10 text-sm">
                <span className="w-6 h-6 rounded-full bg-ruwad-blue text-white text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                <span className="flex-1 text-ruwad-navy font-medium">{p.full_name}</span>
                <span className="font-bold text-ruwad-navy">{p.score}</span>
              </div>
            ))}
          </div>
        </div>

        {session.status === 'leaderboard' && (
          <p className="text-center text-sm text-ruwad-navy/50">بانتظار السؤال التالي من المدرب...</p>
        )}
        {session.status === 'ended' && (
          <p className="text-center text-lg font-bold text-ruwad-navy">🎉 شكراً لمشاركتك!</p>
        )}
      </div>
    )
  }

  return null
}
