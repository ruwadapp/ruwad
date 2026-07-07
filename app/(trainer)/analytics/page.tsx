import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AnalyticsBarChart } from '@/components/trainer/AnalyticsBarChart'
import { Users, BookOpen, FileText, Trophy, Award } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const { data: courses } = await supabase.from('courses').select('id, title').eq('trainer_id', uid)
  const courseIds = (courses ?? []).map((c) => c.id)

  const { data: exams } = await supabase.from('exams').select('id, title').eq('trainer_id', uid)
  const examIds = (exams ?? []).map((e) => e.id)

  const [{ data: enrollmentsRaw }, { data: submissions }] = await Promise.all([
    courseIds.length
      ? supabase.from('enrollments').select('student_id, course_id').in('course_id', courseIds).eq('status', 'approved')
      : Promise.resolve({ data: [] }),
    examIds.length
      ? supabase
          .from('exam_submissions')
          .select('exam_id, student_id, percentage, student:profiles!student_id(full_name)')
          .in('exam_id', examIds)
          .not('submitted_at', 'is', null)
      : Promise.resolve({ data: [] }),
  ])

  const enrollments = enrollmentsRaw ?? []
  const totalStudents = new Set(enrollments.map((e) => e.student_id)).size
  const studentIds = Array.from(new Set(enrollments.map((e) => e.student_id)))

  const { count: badgesEarnedCount } = studentIds.length
    ? await supabase.from('student_badges').select('id', { count: 'exact', head: true }).in('student_id', studentIds)
    : { count: 0 }

  const popularityData = (courses ?? []).map((c) => ({
    label: c.title.slice(0, 14),
    value: enrollments.filter((e) => e.course_id === c.id).length,
  }))

  const examAvgMap = new Map<string, { sum: number; count: number; title: string }>()
  const studentAvgMap = new Map<string, { sum: number; count: number; name: string }>()
  let overallSum = 0
  let overallCount = 0

  for (const s of submissions ?? []) {
    const pct = s.percentage ?? 0
    overallSum += pct
    overallCount += 1

    const examTitle = (exams ?? []).find((e) => e.id === s.exam_id)?.title ?? '—'
    const examEntry = examAvgMap.get(s.exam_id) ?? { sum: 0, count: 0, title: examTitle }
    examEntry.sum += pct
    examEntry.count += 1
    examAvgMap.set(s.exam_id, examEntry)

    const studentName = (s.student as { full_name?: string } | null)?.full_name ?? 'طالب'
    const studentEntry = studentAvgMap.get(s.student_id) ?? { sum: 0, count: 0, name: studentName }
    studentEntry.sum += pct
    studentEntry.count += 1
    studentAvgMap.set(s.student_id, studentEntry)
  }

  const examAvgData = Array.from(examAvgMap.values()).map((e) => ({
    label: e.title.slice(0, 14),
    value: Math.round(e.sum / e.count),
  }))

  const leaderboard = Array.from(studentAvgMap.values())
    .map((s) => ({ name: s.name, avg: Math.round(s.sum / s.count), count: s.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5)

  const overallAvg = overallCount > 0 ? Math.round(overallSum / overallCount) : 0

  return (
    <>
      <Header title="التحليلات" />
      <main className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <Users size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">إجمالي الطلاب</p>
            <p className="text-2xl font-bold text-ruwad-navy">{totalStudents}</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <BookOpen size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">تدريبات</p>
            <p className="text-2xl font-bold text-ruwad-navy">{courses?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <FileText size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">متوسط درجات الامتحانات</p>
            <p className="text-2xl font-bold text-ruwad-navy">{overallAvg}%</p>
          </div>
          <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-5 flex flex-col gap-2 text-white">
            <Award size={20} />
            <p className="text-xs opacity-80">شارات مُنحت لطلابك</p>
            <p className="text-2xl font-bold">{badgesEarnedCount ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-ruwad shadow-card p-6">
            <h2 className="text-lg font-bold text-ruwad-navy mb-4">شعبية التدريبات (عدد الطلاب المقبولين)</h2>
            <AnalyticsBarChart data={popularityData} color="#3A4EFB" />
          </section>

          <section className="bg-white rounded-ruwad shadow-card p-6">
            <h2 className="text-lg font-bold text-ruwad-navy mb-4">متوسط الدرجة لكل امتحان</h2>
            <AnalyticsBarChart data={examAvgData} color="#E3FF3B" unit="%" />
          </section>
        </div>

        <section className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-ruwad-blue" /> أفضل 5 طلاب (متوسط درجات الامتحانات)
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد بيانات كافية بعد.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {leaderboard.map((s, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60">
                  <span className="w-7 h-7 rounded-full bg-ruwad-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-ruwad-navy font-medium">{s.name}</span>
                  <span className="text-xs text-ruwad-navy/50">{s.count} امتحان</span>
                  <span className="font-bold text-ruwad-navy">{s.avg}%</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
