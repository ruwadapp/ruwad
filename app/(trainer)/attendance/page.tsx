import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CreateSessionForm } from '@/components/trainer/CreateSessionForm'
import { SessionToggle } from '@/components/trainer/SessionToggle'
import { CalendarCheck, Circle, BarChart3, BookOpen, Layers, Users } from 'lucide-react'

export default async function AttendancePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: sessions }, { data: courses }] = await Promise.all([
    supabase
      .from('attendance_sessions')
      .select('*, attendance_records(count)')
      .eq('trainer_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('courses').select('*').eq('trainer_id', user!.id),
  ])

  // ===== تجميع الجلسات في مجموعات لكل كورس =====
  const ACCENTS = [
    { bar: '#3A4EFB', soft: 'rgba(58,78,251,.10)', text: '#3A4EFB' },
    { bar: '#33A4FA', soft: 'rgba(51,164,250,.12)', text: '#1d84d8' },
    { bar: '#252943', soft: 'rgba(37,41,67,.08)', text: '#252943' },
    { bar: '#a8c40f', soft: 'rgba(227,255,59,.35)', text: '#7d920b' },
  ]
  const accentFor = (seed: string) => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
    return ACCENTS[h % ACCENTS.length]
  }

  type SessionRow = NonNullable<typeof sessions>[number]
  const groups: { key: string; title: string; sessions: SessionRow[] }[] = []
  const byCourse = new Map<string, SessionRow[]>()
  const generalSessions: SessionRow[] = []
  for (const sess of sessions ?? []) {
    if (sess.course_id) {
      if (!byCourse.has(sess.course_id)) byCourse.set(sess.course_id, [])
      byCourse.get(sess.course_id)!.push(sess)
    } else generalSessions.push(sess)
  }
  // ترتيب المجموعات حسب أحدث جلسة فيها (الجلسات أصلاً مرتبة من الأحدث)
  for (const [courseId, list] of byCourse) {
    groups.push({ key: courseId, title: (courses ?? []).find((c) => c.id === courseId)?.title ?? 'كورس', sessions: list })
  }
  if (generalSessions.length) groups.push({ key: 'general', title: 'جلسات عامة (بلا كورس)', sessions: generalSessions })

  const totalCheckins = (list: SessionRow[]) => list.reduce((sum, x) => sum + (x.attendance_records?.[0]?.count ?? 0), 0)

  return (
    <>
      <Header title="الحضور" />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <CreateSessionForm courses={courses ?? []} />
          <Link
            href="/attendance/analytics"
            className="bg-ruwad-navy text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
          >
            <BarChart3 size={18} /> إحصاءات الحضور الشاملة
          </Link>
        </div>

        {!sessions || sessions.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <CalendarCheck className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد جلسات حضور حتى الآن.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map((group) => {
              const accent = group.key === 'general' ? { bar: '#8A94B8', soft: 'rgba(138,148,184,.12)', text: '#5d6689' } : accentFor(group.key)
              const activeCount = group.sessions.filter((x) => x.is_active).length
              return (
                <section key={group.key}>
                  {/* ===== رأس مجموعة الكورس ===== */}
                  <div className="relative overflow-hidden bg-white rounded-ruwad shadow-card mb-4">
                    <div className="absolute inset-y-0 right-0 w-1.5" style={{ background: accent.bar }} />
                    <div className="flex flex-wrap items-center gap-3 p-4 pr-6">
                      <span className="w-11 h-11 rounded-ruwad-sm flex items-center justify-center shrink-0" style={{ background: accent.soft }}>
                        {group.key === 'general' ? <Layers size={20} style={{ color: accent.text }} /> : <BookOpen size={20} style={{ color: accent.text }} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-extrabold text-ruwad-navy leading-snug">{group.title}</h2>
                        <p className="text-[11px] text-ruwad-navy/45 mt-0.5">آخر جلسة: {new Date(group.sessions[0].created_at).toLocaleDateString('ar', { day: 'numeric', month: 'long' })}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeCount > 0 && (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold bg-green-50 text-green-600 rounded-full px-2.5 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {activeCount} نشطة الآن
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1" style={{ background: accent.soft, color: accent.text }}>
                          <CalendarCheck size={11} /> {group.sessions.length} جلسة
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-ruwad-navy/50 bg-[#F5F6FA] rounded-full px-2.5 py-1">
                          <Users size={11} /> {totalCheckins(group.sessions)} تسجيل
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ===== جلسات المجموعة ===== */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.sessions.map((session) => (
                      <Link
                        key={session.id}
                        href={`/attendance/${session.id}`}
                        className={`group bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2.5 hover:shadow-ruwad-lg hover:-translate-y-0.5 transition-all ${
                          session.is_active ? 'ring-2 ring-green-400/60' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-ruwad-navy leading-snug line-clamp-2 group-hover:text-ruwad-blue transition-colors flex-1">{session.title}</h3>
                          <SessionToggle sessionId={session.id} initialActive={session.is_active} />
                          <span
                            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                              session.is_active ? 'bg-green-50 text-green-600' : session.closed_at ? 'bg-ruwad-gray/40 text-ruwad-navy/50' : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${session.is_active ? 'bg-green-500 animate-pulse' : session.closed_at ? 'bg-ruwad-navy/30' : 'bg-amber-400'}`} />
                            {session.is_active ? 'نشطة الآن' : session.closed_at ? 'مغلقة' : 'لم تُفعَّل'}
                          </span>
                        </div>
                        <p className="text-xl font-mono font-bold tracking-widest" style={{ color: accent.text }}>
                          {session.session_code}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-ruwad-navy/45">
                          <span className="flex items-center gap-1"><Users size={11} /> {session.attendance_records?.[0]?.count ?? 0} مسجّل</span>
                          <span>{new Date(session.created_at).toLocaleDateString('ar', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
