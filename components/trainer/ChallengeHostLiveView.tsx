'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChallengeQuestion, ChallengeSession } from '@/lib/types'
import { Copy, Check, Users, Zap, Trophy, ArrowLeft, Link2 } from 'lucide-react'

const SHAPE_COLORS = ['bg-red-500', 'bg-ruwad-blue', 'bg-amber-400', 'bg-ruwad-lime']
const SHAPES = ['▲', '◆', '●', '■']

interface Participant { student_id: string; score: number; full_name: string }

export function ChallengeHostLiveView({
  session: initialSession,
  questions,
}: {
  session: ChallengeSession
  questions: ChallengeQuestion[]
}) {
  const [session, setSession] = useState(initialSession)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [answeredCount, setAnsweredCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const supabase = createClient()
  const autoAdvanceRef = useRef(false)

  const currentQuestion = questions[session.current_question_index]
  const isLastQuestion = session.current_question_index >= questions.length - 1

  const loadParticipants = useCallback(async () => {
    const { data } = await supabase
      .from('challenge_session_participants')
      .select('student_id, score, student:profiles!student_id(full_name)')
      .eq('session_id', session.id)
      .order('score', { ascending: false })
    if (data) {
      setParticipants(data.map((p) => ({
        student_id: p.student_id, score: p.score,
        full_name: (p.student as unknown as { full_name?: string })?.full_name ?? 'طالب',
      })))
    }
  }, [session.id, supabase])

  const loadAnsweredCount = useCallback(async () => {
    if (!currentQuestion) return
    const { count } = await supabase
      .from('challenge_live_answers')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id)
      .eq('question_id', currentQuestion.id)
    setAnsweredCount(count ?? 0)
  }, [session.id, currentQuestion, supabase])

  useEffect(() => {
    loadParticipants()
    loadAnsweredCount()

    const channel = supabase
      .channel(`challenge-host:${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_session_participants', filter: `session_id=eq.${session.id}` }, () => loadParticipants())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'challenge_live_answers', filter: `session_id=eq.${session.id}` }, () => loadAnsweredCount())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.id, loadParticipants, loadAnsweredCount, supabase])

  useEffect(() => {
    if (session.status !== 'question' || !session.question_started_at || !currentQuestion) return
    autoAdvanceRef.current = false

    const tick = () => {
      const elapsed = Date.now() - new Date(session.question_started_at!).getTime()
      const remaining = Math.max(0, currentQuestion.time_limit_seconds * 1000 - elapsed)
      setTimeLeft(Math.ceil(remaining / 1000))
      if (remaining <= 0 && !autoAdvanceRef.current) {
        autoAdvanceRef.current = true
        moveToLeaderboard()
      }
    }
    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status, session.question_started_at, currentQuestion?.id])

  function copyCode() {
    navigator.clipboard.writeText(session.session_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyLink() {
    const url = `${window.location.origin}/my-challenges/join/${session.session_code}`
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  async function startQuiz() {
    const { data } = await supabase
      .from('challenge_sessions')
      .update({ status: 'question', current_question_index: 0, question_started_at: new Date().toISOString() })
      .eq('id', session.id)
      .select()
      .single()
    if (data) setSession(data)
  }

  async function moveToLeaderboard() {
    const { data } = await supabase
      .from('challenge_sessions')
      .update({ status: 'leaderboard' })
      .eq('id', session.id)
      .select()
      .single()
    if (data) setSession(data)
  }

  async function nextQuestion() {
    if (isLastQuestion) { await endChallenge(); return }
    const nextIndex = session.current_question_index + 1
    const { data } = await supabase
      .from('challenge_sessions')
      .update({ status: 'question', current_question_index: nextIndex, question_started_at: new Date().toISOString() })
      .eq('id', session.id)
      .select()
      .single()
    if (data) setSession(data)
  }

  async function endChallenge() {
    await loadParticipants()
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0) * 100

    await Promise.all(
      participants.map((p) =>
        supabase.from('challenge_submissions').upsert(
          {
            challenge_id: session.challenge_id,
            student_id: p.student_id,
            answers: {},
            score: p.score,
            percentage: totalMarks > 0 ? Math.round((p.score / totalMarks) * 100) : 0,
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'challenge_id,student_id' }
        )
      )
    )

    const { data } = await supabase
      .from('challenge_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', session.id)
      .select()
      .single()
    if (data) setSession(data)
  }

  const top3 = participants.slice(0, 3)
  const podiumOrder = top3.length === 3 ? [1, 0, 2] : top3.map((_, i) => i)
  const podiumHeight = ['h-24', 'h-32', 'h-20']
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-ruwad-navy rounded-ruwad shadow-card p-4 flex items-center justify-between text-white flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-70">كود الانضمام</span>
          <span className="text-2xl font-mono font-bold tracking-widest">{session.session_code}</span>
          <button onClick={copyCode} aria-label="نسخ">{copied ? <Check size={18} /> : <Copy size={18} />}</button>
        </div>
        <span className="flex items-center gap-1.5 text-sm"><Users size={16} className="text-ruwad-lime" /> {participants.length} منضم</span>
        <button onClick={copyLink} className="flex items-center gap-1.5 text-sm font-semibold bg-white/10 px-3 py-1.5 rounded-ruwad-sm hover:bg-white/20 transition">
          <Link2 size={15} /> {linkCopied ? 'تم النسخ ✓' : 'نسخ رابط الانضمام'}
        </button>
      </div>

      {session.status === 'lobby' && (
        <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-6 text-center">
          <Zap size={48} className="text-ruwad-lime" />
          <h2 className="text-xl font-bold text-ruwad-navy">بانتظار انضمام الطلاب...</h2>
          <div className="flex flex-wrap gap-2 justify-center max-w-lg">
            {participants.map((p) => (
              <span key={p.student_id} className="bg-ruwad-lime/20 text-ruwad-navy text-sm font-semibold px-4 py-2 rounded-full">{p.full_name}</span>
            ))}
          </div>
          <button onClick={startQuiz} className="bg-ruwad-lime text-ruwad-navy px-8 py-4 rounded-ruwad-sm font-bold text-lg hover:opacity-90 transition shadow-ruwad-lg">
            🚀 بدء التحدي
          </button>
        </div>
      )}

      {session.status === 'question' && currentQuestion && (
        <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col items-center gap-6">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold text-white transition-colors ${
              timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-ruwad-blue'
            }`}
          >
            {timeLeft}
          </div>
          <p className="text-xs text-ruwad-navy/40">سؤال {session.current_question_index + 1} من {questions.length}</p>
          <h2 className="text-2xl font-bold text-ruwad-navy text-center max-w-2xl">{currentQuestion.question_text}</h2>

          <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
            {currentQuestion.options.map((opt, idx) => (
              <div key={opt.id} className={`${SHAPE_COLORS[idx % 4]} text-white rounded-ruwad-sm p-4 flex items-center gap-3 font-bold`}>
                <span className="text-xl">{SHAPES[idx % 4]}</span> {opt.text}
              </div>
            ))}
          </div>

          <p className="text-sm text-ruwad-navy/50">{answeredCount} من {participants.length} أجابوا</p>
          <button onClick={moveToLeaderboard} className="text-sm font-semibold text-ruwad-navy/60 hover:text-ruwad-navy underline">
            إظهار النتيجة الآن
          </button>
        </div>
      )}

      {session.status === 'leaderboard' && (
        <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ruwad-navy flex items-center gap-2"><Trophy size={20} className="text-ruwad-lime" /> الترتيب الحالي</h2>
          <div className="flex flex-col gap-2">
            {participants.slice(0, 8).map((p, idx) => (
              <div key={p.student_id} className="flex items-center gap-3 p-3 rounded-ruwad-sm bg-ruwad-gray/10">
                <span className="w-7 h-7 rounded-full bg-ruwad-blue text-white text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                <span className="flex-1 font-medium text-ruwad-navy">{p.full_name}</span>
                <span className="font-bold text-ruwad-navy">{p.score}</span>
              </div>
            ))}
          </div>
          <button onClick={nextQuestion} className="bg-ruwad-blue text-white py-3 rounded-ruwad-sm font-bold hover:opacity-90 transition flex items-center justify-center gap-2 mt-2">
            {isLastQuestion ? 'إنهاء التحدي وعرض النتيجة النهائية' : 'السؤال التالي'} <ArrowLeft size={18} />
          </button>
        </div>
      )}

      {session.status === 'ended' && (
        <div className="bg-white rounded-ruwad shadow-ruwad-lg p-8 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-ruwad-navy text-center">🎉 انتهى التحدي!</h2>
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-4">
              {podiumOrder.map((rank) => {
                const p = top3[rank]
                if (!p) return null
                return (
                  <div key={p.student_id} className="flex flex-col items-center gap-2 w-28">
                    <span className="text-3xl">{medals[rank]}</span>
                    <p className="text-sm font-bold text-ruwad-navy text-center truncate w-full">{p.full_name}</p>
                    <p className="text-xs text-ruwad-navy/50">{p.score} نقطة</p>
                    <div className={`w-full rounded-t-ruwad-sm ${podiumHeight[rank]} ${rank === 0 ? 'bg-ruwad-lime' : 'bg-ruwad-blue/15'}`} />
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex flex-col gap-2">
            {participants.slice(3).map((p, idx) => (
              <div key={p.student_id} className="flex items-center gap-3 p-2.5 rounded-ruwad-sm bg-ruwad-gray/10 text-sm">
                <span className="w-6 h-6 rounded-full bg-ruwad-gray/40 text-ruwad-navy text-xs font-bold flex items-center justify-center shrink-0">{idx + 4}</span>
                <span className="flex-1 text-ruwad-navy">{p.full_name}</span>
                <span className="font-bold text-ruwad-navy">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
