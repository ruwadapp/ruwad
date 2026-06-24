import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { StatsCard } from '@/components/shared/StatsCard'
import { Users, BookOpen, FileText, CalendarCheck } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [coursesRes, examsRes, studentsRes] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('trainer_id', user!.id),
    supabase.from('exams').select('id', { count: 'exact', head: true }).eq('trainer_id', user!.id),
    supabase
      .from('enrollments')
      .select('student_id, courses!inner(trainer_id)', { count: 'exact', head: true })
      .eq('courses.trainer_id', user!.id),
  ])

  const stats = [
    { title: 'عدد الطلاب', value: studentsRes.count ?? 0, icon: <Users />, variant: 'blue' as const },
    { title: 'الكورسات', value: coursesRes.count ?? 0, icon: <BookOpen />, variant: 'white' as const },
    { title: 'الامتحانات', value: examsRes.count ?? 0, icon: <FileText />, variant: 'lime' as const },
    { title: 'نسبة الحضور', value: '—', icon: <CalendarCheck />, variant: 'white' as const },
  ]

  return (
    <>
      <Header title="لوحة التحكم" />
      <main className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatsCard key={s.title} {...s} />
          ))}
        </div>

        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">آخر النشاطات</h2>
          <p className="text-ruwad-navy/50 text-sm">
            لا توجد نشاطات حتى الآن. ابدأ بإنشاء كورس أو امتحان جديد.
          </p>
        </div>
      </main>
    </>
  )
}
