'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, X } from 'lucide-react'

interface PointEvent {
  id: string
  points: number
  reason: string
  category: string
}

const CATEGORY_EMOJI: Record<string, string> = {
  exams: '📝', challenges: '🔥', assignments: '✅',
  certificates: '🎓', attendance: '📅', badges: '🏅',
}

// نافذة احتفالية منبثقة تظهر فور كسب الطالب نقاطاً:
// "+180 نقطة 🎉 — أنجزت امتحان كذا". تعتمد سجلّ النقاط الدائم + بث لحظي.
export function PointsToast() {
  const [queue, setQueue] = useState<PointEvent[]>([])
  const supabase = createClient()

  const markSeen = useCallback(async (ids: string[]) => {
    if (ids.length) await supabase.from('point_events').update({ seen: true }).in('id', ids)
  }, [supabase])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || cancelled) return

      // أحداث غير مُشاهدة خلال آخر 24 ساعة (لو كسبها والتطبيق مغلق)
      supabase
        .from('point_events')
        .select('id, points, reason, category')
        .eq('student_id', session.user.id)
        .eq('seen', false)
        .gt('created_at', new Date(Date.now() - 86400_000).toISOString())
        .order('created_at', { ascending: true })
        .limit(4)
        .then(({ data }) => { if (data?.length && !cancelled) setQueue((q) => [...q, ...data]) })

      supabase.realtime.setAuth(session.access_token)
      channel = supabase
        .channel(`points:${session.user.id}:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'point_events', filter: `student_id=eq.${session.user.id}` }, (payload) => {
          const ev = payload.new as PointEvent & { seen: boolean }
          if (!ev.seen) setQueue((q) => (q.some((x) => x.id === ev.id) ? q : [...q, ev]))
        })
        .subscribe()
    })

    return () => { cancelled = true; if (channel) supabase.removeChannel(channel) }
  }, [supabase])

  // أظهر حدثاً واحداً في كل مرة، ثم علّمه مُشاهداً وانتقل للتالي
  const current = queue[0]
  useEffect(() => {
    if (!current) return
    const t = setTimeout(() => dismiss(), 5000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  function dismiss() {
    if (!current) return
    markSeen([current.id])
    setQueue((q) => q.slice(1))
  }

  if (!current) return null

  return (
    <div className="fixed top-4 inset-x-4 md:inset-x-auto md:left-6 md:w-96 z-[100] animate-count-pop" dir="rtl">
      <div className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg p-[2px] bg-gradient-to-l from-ruwad-lime via-ruwad-blue-light to-ruwad-blue">
        <div className="relative bg-ruwad-navy rounded-[10px] p-4 flex items-center gap-3 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-l from-transparent via-white/10 to-transparent animate-points-shine" />
          </div>
          <span className="relative w-12 h-12 rounded-full bg-ruwad-lime text-2xl flex items-center justify-center shrink-0 animate-badge-float">
            {CATEGORY_EMOJI[current.category] ?? '⭐'}
          </span>
          <div className="relative flex-1 min-w-0">
            <p className="flex items-center gap-1.5 font-black text-ruwad-lime text-lg leading-tight">
              <Sparkles size={16} /> +{current.points.toLocaleString('ar')} نقطة 🎉
            </p>
            <p className="text-white/85 text-sm truncate mt-0.5">{current.reason}</p>
          </div>
          <button onClick={dismiss} aria-label="إغلاق" className="relative text-white/50 hover:text-white p-1.5 shrink-0 transition">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
