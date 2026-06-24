import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CreateSessionForm } from '@/components/trainer/CreateSessionForm'
import { CalendarCheck, Circle } from 'lucide-react'

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

  return (
    <>
      <Header title="الحضور" />
      <main className="p-6 flex flex-col gap-6">
        <CreateSessionForm courses={courses ?? []} />

        {!sessions || sessions.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <CalendarCheck className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد جلسات حضور حتى الآن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/attendance/${session.id}`}
                className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad transition"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{session.title}</h3>
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      session.is_active ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-ruwad-gray/50 text-ruwad-navy/60'
                    }`}
                  >
                    <Circle size={8} className={session.is_active ? 'fill-current' : ''} />
                    {session.is_active ? 'نشطة' : session.closed_at ? 'مغلقة' : 'لم تُفعَّل'}
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-ruwad-blue tracking-widest">
                  {session.session_code}
                </p>
                <p className="text-xs text-ruwad-navy/50">
                  {session.attendance_records?.[0]?.count ?? 0} مسجّل
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
