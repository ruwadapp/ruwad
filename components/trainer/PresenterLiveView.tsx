'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PresentationSlide, PresentationSession } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ChevronRight, ChevronLeft, Copy, Check, Square, Users } from 'lucide-react'

export function PresenterLiveView({
  session: initialSession,
  slides,
}: {
  session: PresentationSession
  slides: PresentationSlide[]
}) {
  const [session, setSession] = useState(initialSession)
  const [responses, setResponses] = useState<{ slide_id: string; answer: { optionId?: string; text?: string } }[]>([])
  const [participantCount, setParticipantCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const currentSlide = slides[session.current_slide_index]

  const loadResponses = useCallback(async () => {
    const { data } = await supabase
      .from('presentation_responses')
      .select('slide_id, answer')
      .eq('session_id', session.id)
    if (data) setResponses(data)
  }, [session.id, supabase])

  const loadParticipants = useCallback(async () => {
    const { count } = await supabase
      .from('presentation_participants')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id)
    setParticipantCount(count ?? 0)
  }, [session.id, supabase])

  useEffect(() => {
    loadResponses()
    loadParticipants()

    const channel = supabase
      .channel(`present-host:${session.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'presentation_responses', filter: `session_id=eq.${session.id}` }, () => loadResponses())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'presentation_participants', filter: `session_id=eq.${session.id}` }, () => loadParticipants())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.id, loadResponses, loadParticipants, supabase])

  async function goTo(index: number) {
    if (index < 0 || index >= slides.length) return
    await supabase.from('presentation_sessions').update({ current_slide_index: index }).eq('id', session.id)
    setSession((prev) => ({ ...prev, current_slide_index: index }))
  }

  async function endSession() {
    if (!confirm('هل تريد إنهاء الجلسة؟')) return
    await supabase.from('presentation_sessions').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', session.id)
    setSession((prev) => ({ ...prev, is_active: false }))
  }

  function copyCode() {
    navigator.clipboard.writeText(session.session_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const slideResponses = responses.filter((r) => r.slide_id === currentSlide?.id)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-ruwad-navy rounded-ruwad shadow-card p-4 flex items-center justify-between text-white flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-70">كود الانضمام</span>
          <span className="text-2xl font-mono font-bold tracking-widest">{session.session_code}</span>
          <button onClick={copyCode} aria-label="نسخ">{copied ? <Check size={18} /> : <Copy size={18} />}</button>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm"><Users size={16} className="text-ruwad-lime" /> {participantCount} منضم</span>
          {session.is_active ? (
            <button onClick={endSession} className="flex items-center gap-1.5 bg-red-500 px-4 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition">
              <Square size={14} /> إنهاء الجلسة
            </button>
          ) : (
            <span className="text-sm bg-white/10 px-3 py-1.5 rounded-full">انتهت الجلسة</span>
          )}
        </div>
      </div>

      {currentSlide && (
        <div className="bg-white rounded-ruwad shadow-card p-8 min-h-[280px] flex flex-col gap-4">
          <p className="text-xs text-ruwad-navy/40">شريحة {session.current_slide_index + 1} من {slides.length}</p>
          <h2 className="text-2xl font-bold text-ruwad-navy">{currentSlide.title}</h2>

          {currentSlide.slide_type === 'text' && (
            <p className="text-ruwad-navy/80 text-lg leading-relaxed whitespace-pre-wrap">{currentSlide.body}</p>
          )}

          {currentSlide.slide_type === 'stat' && (
            currentSlide.options.length === 1 ? (
              <p className="text-6xl font-bold text-ruwad-blue text-center py-6">{currentSlide.options[0].value}</p>
            ) : (
              <div className="h-64" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentSlide.options.map((o) => ({ label: o.label, value: o.value }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3A4EFB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          )}

          {currentSlide.slide_type === 'poll' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ruwad-navy/50">{slideResponses.length} صوت</p>
              {currentSlide.options.map((opt) => {
                const count = slideResponses.filter((r) => r.answer.optionId === opt.id).length
                const pct = slideResponses.length ? Math.round((count / slideResponses.length) * 100) : 0
                return (
                  <div key={opt.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ruwad-navy font-medium">{opt.text}</span>
                      <span className="text-ruwad-navy/60">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-ruwad-gray/30 rounded-full h-4">
                      <div className="bg-ruwad-blue h-4 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {currentSlide.slide_type === 'open_text' && (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              <p className="text-sm text-ruwad-navy/50 mb-1">{slideResponses.length} إجابة</p>
              {slideResponses.length === 0 ? (
                <p className="text-ruwad-navy/40 text-sm">في انتظار إجابات الطلاب...</p>
              ) : (
                slideResponses.map((r, i) => (
                  <p key={i} className="bg-ruwad-blue/5 text-ruwad-navy rounded-ruwad-sm px-4 py-2.5">{r.answer.text}</p>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => goTo(session.current_slide_index - 1)} disabled={session.current_slide_index === 0}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-ruwad-sm font-semibold text-ruwad-navy border-2 border-ruwad-gray disabled:opacity-40 transition">
          <ChevronRight size={18} /> السابقة
        </button>
        <button onClick={() => goTo(session.current_slide_index + 1)} disabled={session.current_slide_index >= slides.length - 1}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-ruwad-sm font-bold bg-ruwad-blue text-white disabled:opacity-40 hover:opacity-90 transition">
          التالية <ChevronLeft size={18} />
        </button>
      </div>
    </div>
  )
}
