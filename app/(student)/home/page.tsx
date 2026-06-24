import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { StatsCard } from '@/components/shared/StatsCard'
import { BookOpen, FileText, Award, CalendarCheck } from 'lucide-react'

export default async function StudentHomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [coursesRes, examsRes, badgesRes, attendanceStatsArr, enrollments] = await Promise.all([
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('student_id', uid).eq('status', 'approved'),
    supabase.from('exam_submissions').select('id', { count: 'exact', head: true }).eq('student_id', uid).not('submitted_at', 'is', null),
    supabase.from('student_badges').select('id', { count: 'exact', head: true }).eq('student_id', uid),
    supabase.rpc('get_student_attendance_stats', { p_student_id: uid }),
    supabase.from('enrollments').select('*, course:courses(title)').eq('student_id', uid).eq('status', 'approved').order('enrolled_at', { ascending: false }).limit(5),
  ])

  const attendance = attendanceStatsArr.data?.[0] as { attendance_rate: number } | undefined

  const stats = [
    { title: 'كورساتي', value: coursesRes.count ?? 0, icon: <BookOpen />, variant: 'blue' as const },
    { title: 'امتحانات مكتملة', value: examsRes.count ?? 0, icon: <FileText />, variant: 'white' as const },
    { title: 'الشارات', value: badgesRes.count ?? 0, icon: <Award />, variant: 'lime' as const },
    { title: 'نسبة حضوري', value: attendance ? `${attendance.attendance_rate}%` : '—', icon: <CalendarCheck />, variant: 'white' as const },
  ]

  return (
    <>
      <Header title="مرحباً بك" />
      <main className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatsCard key={s.title} {...s} />
          ))}
        </div>

        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">كورساتي الحالية</h2>
          {!enrollments.data || enrollments.data.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm">لم تنضمّ لأي كورس بعد. تصفّح الكورسات المتاحة من صفحة "كورساتي".</p>
          ) : (
            <div className="flex flex-col gap-3">
              {enrollments.data.map((e) => (
                <Link
                  key={e.id}
                  href={`/my-courses/${e.course_id}`}
                  className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60 hover:bg-ruwad-gray/10 transition"
                >
                  <span className="flex-1 text-sm font-medium text-ruwad-navy truncate">{e.course?.title}</span>
                  <div className="w-24 bg-ruwad-gray/30 rounded-full h-2">
                    <div className="bg-ruwad-blue h-2 rounded-full" style={{ width: `${e.progress ?? 0}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-ruwad-navy w-10 text-left">{e.progress ?? 0}%</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
