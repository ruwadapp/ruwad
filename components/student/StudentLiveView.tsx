'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PresentationSlide, PresentationSession } from '@/lib/types'
import { CheckCircle2, Clock } from 'lucide-react'

export function StudentLiveView({
  session: initialSession,
  slides,
}: {
  session: PresentationSession
  slides: PresentationSlide[]
}) {
  const [session, setSession] = useState(initialSession)
  const [textAnswer, setTextAnswer] = useState('')
  const [myAnswer, setMyAnswer] = useState<{ optionId?: string; text?: string } | null>(null)
  const [slideResponses, setSlideResponses] = useState<{ answer: { optionId?: string; text?: string } }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const currentSlide = slides[session.current_slide_index]

  const loadMyAnswerAndResponses = useCallback(async (slideId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: mine } = await supabase
      .from('presentation_responses')
      .select('answer')
      .eq('session_id', session.id)
      .eq('slide_id', slideId)
      .eq('student_id', user!.id)
      .maybeSingle()
    setMyAnswer(mine?.answer ?? null)
    setTextAnswer('')

    const { data: all } = await supabase
      .from('presentation_responses')
      .select('answer')
      .eq('session_id', session.id)
      .eq('slide_id', slideId)
    setSlideResponses(all ?? [])
  }, [session.id, supabase])

  useEffect(() => {
    if (currentSlide) loadMyAnswerAndResponses(currentSlide.id)
  }, [currentSlide?.id, loadMyAnswerAndResponses])

  useEffect(() => {
    const channel = supabase
      .channel(`present-student:${session.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'presentation_sessions', filter: `id=eq.${session.id}` }, (payload) => {
        setSession(payload.new as PresentationSession)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'presentation_responses', filter: `session_id=eq.${session.id}` }, (payload) => {
        const row = payload.new as { slide_id: string; answer: { optionId?: string; text?: string } }
        if (row.slide_id === currentSlide?.id) {
          setSlideResponses((prev) => [...prev, { answer: row.answer }])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.id, currentSlide?.id, supabase])

  async function submitAnswer(answer: { optionId?: string; text?: string }) {
    if (!currentSlide || submitting) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('presentation_responses').insert({
      session_id: session.id, slide_id: currentSlide.id, student_id: user!.id, answer,
    })
    if (!error) setMyAnswer(answer)
    setSubmitting(false)
  }

  if (!session.is_active) {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
        <Clock size={48} className="text-ruwad-navy/30" />
        <h2 className="font-bold text-ruwad-navy">انتهت هذه الجلسة</h2>
        <p className="text-sm text-ruwad-navy/60">شكراً لمشاركتك!</p>
      </div>
    )
  }

  if (!currentSlide) {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
        <Clock size={48} className="text-ruwad-blue animate-pulse" />
        <h2 className="font-bold text-ruwad-navy">في انتظار بدء المدرب العرض...</h2>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
        <p className="text-xs text-ruwad-navy/40">شريحة {session.current_slide_index + 1} من {slides.length}</p>
        <h2 className="text-xl font-bold text-ruwad-navy">{currentSlide.title}</h2>

        {currentSlide.slide_type === 'text' && (
          <p className="text-ruwad-navy/80 leading-relaxed whitespace-pre-wrap">{currentSlide.body}</p>
        )}

        {currentSlide.slide_type === 'stat' && (
          currentSlide.options.length === 1 ? (
            <p className="text-5xl font-bold text-ruwad-blue text-center py-6">{currentSlide.options[0].value}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {currentSlide.options.map((o, i) => (
                <div key={i} className="flex justify-between text-sm bg-ruwad-gray/20 rounded-ruwad-sm px-4 py-2.5">
                  <span className="text-ruwad-navy">{o.label}</span>
                  <span className="font-bold text-ruwad-navy">{o.value}</span>
                </div>
              ))}
            </div>
          )
        )}

        {currentSlide.slide_type === 'poll' && (
          myAnswer ? (
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-1.5 text-sm text-ruwad-blue font-semibold"><CheckCircle2 size={16} /> تم تسجيل إجابتك</p>
              {currentSlide.options.map((opt) => {
                const count = slideResponses.filter((r) => r.answer.optionId === opt.id).length
                const pct = slideResponses.length ? Math.round((count / slideResponses.length) * 100) : 0
                const isMine = myAnswer.optionId === opt.id
                return (
                  <div key={opt.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`font-medium ${isMine ? 'text-ruwad-blue' : 'text-ruwad-navy'}`}>{opt.text} {isMine && '✓'}</span>
                      <span className="text-ruwad-navy/60">{pct}%</span>
                    </div>
                    <div className="w-full bg-ruwad-gray/30 rounded-full h-3">
                      <div className={`h-3 rounded-full transition-all ${isMine ? 'bg-ruwad-blue' : 'bg-ruwad-gray/60'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {currentSlide.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => submitAnswer({ optionId: opt.id })}
                  disabled={submitting}
                  className="p-3 rounded-ruwad-sm border-2 border-ruwad-gray text-ruwad-navy font-medium hover:border-ruwad-blue hover:bg-ruwad-blue/5 transition text-right disabled:opacity-50"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )
        )}

        {currentSlide.slide_type === 'open_text' && (
          myAnswer ? (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-1.5 text-sm text-ruwad-blue font-semibold mb-1"><CheckCircle2 size={16} /> تم إرسال إجابتك</p>
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {slideResponses.map((r, i) => (
                  <p key={i} className={`rounded-ruwad-sm px-4 py-2.5 ${r.answer.text === myAnswer.text ? 'bg-ruwad-blue/10 text-ruwad-blue font-medium' : 'bg-ruwad-gray/20 text-ruwad-navy'}`}>
                    {r.answer.text}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                rows={3}
                placeholder="اكتب إجابتك هنا"
                className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none"
              />
              <button
                onClick={() => submitAnswer({ text: textAnswer })}
                disabled={!textAnswer.trim() || submitting}
                className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition disabled:opacity-50 w-fit"
              >
                {submitting ? 'جارٍ الإرسال...' : 'إرسال'}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
