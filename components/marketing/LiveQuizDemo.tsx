'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Flame, Trophy } from 'lucide-react'
import { useLang } from './LangProvider'

const SHAPES = ['▲', '◆', '●', '■']
const TILE_COLORS = ['bg-red-500', 'bg-ruwad-blue', 'bg-amber-400', 'bg-ruwad-lime']

interface Player { id: string; score: number }

export function LiveQuizDemo() {
  const { t, lang } = useLang()
  const DEMO_QUESTIONS = t.demo.questions
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  // نحفظ اللاعبين بمعرّفات ثابتة كي لا تتأثر النقاط بتبديل اللغة
  const [players, setPlayers] = useState<Player[]>([
    { id: 'you', score: 0 },
    { id: 'p1', score: 240 },
    { id: 'p2', score: 180 },
  ])
  const nameOf = (id: string) => id === 'you' ? t.demo.you : id === 'p1' ? t.demo.players[0] : t.demo.players[1]
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const question = DEMO_QUESTIONS[qIndex]

  const advance = useCallback(() => {
    setSelected(null)
    setQIndex((i) => (i + 1) % DEMO_QUESTIONS.length)
  }, [])

  const answer = useCallback((idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    if (idx === question.correct) {
      const gained = 80 + Math.floor(Math.random() * 60)
      setPlayers((prev) =>
        prev.map((p) => (p.id === 'you' ? { ...p, score: p.score + gained } : p)).sort((a, b) => b.score - a.score),
      )
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(advance, 1400)
  }, [selected, question, advance])

  // إعادة الضبط عند تبديل اللغة كي لا يبقى مؤشر خارج النطاق
  useEffect(() => { setQIndex(0); setSelected(null) }, [lang])

  // دورة تلقائية تُبقي البطاقة "حيّة" حتى بدون تفاعل الزائر
  useEffect(() => {
    if (selected !== null) return
    cycleRef.current = setTimeout(() => answer(question.correct), 5000)
    return () => { if (cycleRef.current) clearTimeout(cycleRef.current) }
  }, [qIndex, selected, question, answer])

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

  return (
    <div className="relative max-w-lg mx-auto">
      <div className="absolute -top-4 end-[-1rem] flex items-center gap-1.5 bg-gradient-to-r from-orange-600 via-red-500 to-orange-500 animate-fire-bg text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-ruwad-lg z-10">
        <Flame size={13} className="animate-flame-flicker" /> {t.demo.live}
      </div>

      <div className="bg-white rounded-ruwad p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ruwad-navy/40">{t.demo.question} {qIndex + 1} {t.demo.of} {DEMO_QUESTIONS.length}</span>
          <svg width="34" height="34" viewBox="0 0 80 80" className="text-ruwad-lime">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#DEE0ED" strokeWidth="8" />
            <circle
              key={qIndex}
              cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="8"
              strokeDasharray="226" strokeLinecap="round" transform="rotate(-90 40 40)"
              className={selected === null ? 'animate-ring-drain' : ''}
              style={selected !== null ? { strokeDashoffset: 226 } : undefined}
            />
          </svg>
        </div>

        <p className="text-lg sm:text-xl font-extrabold text-ruwad-navy leading-snug min-h-[3.5rem]">{question.text}</p>

        <div className="grid grid-cols-2 gap-3">
          {question.options.map((opt, idx) => {
            const isCorrect = idx === question.correct
            const isPicked = selected === idx
            const showState = selected !== null && (isCorrect || isPicked)
            return (
              <button
                key={idx}
                onClick={() => answer(idx)}
                disabled={selected !== null}
                className={`${TILE_COLORS[idx]} text-white rounded-ruwad-sm p-4 font-bold flex items-center justify-center gap-2 transition
                  ${showState ? 'animate-tile-pop' : ''}
                  ${selected !== null && !showState ? 'opacity-30' : ''}
                  ${selected !== null && isCorrect ? 'ring-4 ring-white shadow-ruwad-lg' : ''}
                `}
              >
                <span className="text-sm opacity-80">{SHAPES[idx]}</span> {opt}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between border-t border-ruwad-gray/60 pt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-ruwad-navy/50">
            <Trophy size={14} className="text-ruwad-lime" /> {t.demo.leaders}
          </div>
          <div className="flex items-center gap-3">
            {players.map((p) => (
              <div key={p.id} className="text-center">
                <p className={`text-xs font-bold ${p.id === 'you' ? 'text-ruwad-blue' : 'text-ruwad-navy/60'}`}>{nameOf(p.id)}</p>
                <p className={`text-sm font-extrabold text-ruwad-navy ${p.id === 'you' ? 'animate-score-pulse' : ''}`} key={p.score}>
                  {p.score}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
