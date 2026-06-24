import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { StatsCard } from '@/components/shared/StatsCard'
import { BookOpen, FileText, Award, CalendarCheck } from 'lucide-react'

export default async function StudentHomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [coursesRes, examsRes] = await Promise.all([
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('student_id', user!.id),
    supabase
      .from('exam_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user!.id)
      .not('submitted_at', 'is', null),
  ])

  const stats = [
    { title: 'كورساتي', value: coursesRes.count ?? 0, icon: <BookOpen />, variant: 'blue' as const },
    { title: 'امتحانات مكتملة', value: examsRes.count ?? 0, icon: <FileText />, variant: 'white' as const },
    { title: 'الشارات', value: 0, icon: <Award />, variant: 'lime' as const },
    { title: 'نسبة حضوري', value: '—', icon: <CalendarCheck />, variant: 'white' as const },
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
          <p className="text-ruwad-navy/50 text-sm">لم تسجّل في أي كورس بعد.</p>
        </div>
      </main>
    </>
  )
}
