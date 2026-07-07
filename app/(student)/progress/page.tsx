import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ExamProgressChart } from '@/components/student/ExamProgressChart'
import { Award, BookOpen, FileText, CalendarCheck, Trophy, FileCheck } from 'lucide-react'

export default async function ProgressPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [
    { data: examSubmissions },
    { data: enrollments },
    { data: challengeSubmissions },
    { data: assignmentSubmissions },
    { data: attendanceStatsArr },
    { data: earnedCount },
    { data: allBadgesCount },
  ] = await Promise.all([
    supabase.from('exam_submissions')
      .select('*, exam:exams(title, total_marks)')
      .eq('student_id', uid).not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: true }),
    supabase.from('enrollments').select('*, course:courses(title)').eq('student_id', uid).eq('status', 'approved'),
    supabase.from('challenge_submissions').select('*, challenge:challenges(title)').eq('student_id', uid),
    supabase.from('assignment_submissions').select('*, assignment:assignments(title, total_marks)').eq('student_id', uid),
    supabase.rpc('get_student_attendance_stats', { p_student_id: uid }),
    supabase.from('student_badges').select('id', { count: 'exact', head: true }).eq('student_id', uid),
    supabase.from('badges').select('id', { count: 'exact', head: true }),
  ])

  const attendance = attendanceStatsArr?.[0] as { total_sessions: number; attended: number; attendance_rate: number } | undefined
  const examChartData = (examSubmissions ?? []).map((s, i) => ({
    label: s.exam?.title?.slice(0, 12) || `امتحان ${i + 1}`,
    percentage: Math.round(s.percentage ?? 0),
  }))
  const examsAvg = examChartData.length
    ? Math.round(examChartData.reduce((sum, e) => sum + e.percentage, 0) / examChartData.length)
    : 0
  const coursesAvgProgress = enrollments?.length
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0) / enrollments.length)
    : 0

  return (
    <>
      <Header title="تقدّمي" />
      <main className="p-6 flex flex-col gap-6">

        {/* ===== ملخّص سريع ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <FileText size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">متوسط الامتحانات</p>
            <p className="text-2xl font-bold text-ruwad-navy">{examsAvg}%</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <BookOpen size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">إتمام الكورسات</p>
            <p className="text-2xl font-bold text-ruwad-navy">{coursesAvgProgress}%</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <CalendarCheck size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">نسبة الحضور</p>
            <p className="text-2xl font-bold text-ruwad-navy">{attendance?.attendance_rate ?? 0}%</p>
          </div>
          <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-5 flex flex-col gap-2 text-white">
            <Award size={20} />
            <p className="text-xs opacity-80">الشارات</p>
            <p className="text-2xl font-bold">{earnedCount?.length ?? 0} / {allBadgesCount?.length ?? 0}</p>
          </div>
        </div>

        {/* ===== مخطط الأداء في الامتحانات ===== */}
        <section className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">مخطط الأداء في الامتحانات</h2>
          <ExamProgressChart data={examChartData} />
        </section>

        {/* ===== تقدّم الكورسات ===== */}
        <section className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-ruwad-blue" /> تقدّم الكورسات
          </h2>
          {!enrollments || enrollments.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-4 text-center">لم تلتحق بأي كورس بعد.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {enrollments.map((e) => (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="text-sm text-ruwad-navy flex-1 truncate">{e.course?.title}</span>
                  <div className="flex-1 bg-ruwad-gray/30 rounded-full h-2">
                    <div className="bg-ruwad-blue h-2 rounded-full" style={{ width: `${e.progress ?? 0}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-ruwad-navy w-10 text-left">{e.progress ?? 0}%</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== التحديات والواجبات ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section className="bg-white rounded-ruwad shadow-card p-6">
            <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-ruwad-lime" /> التحديات ({challengeSubmissions?.length ?? 0})
            </h2>
            {!challengeSubmissions || challengeSubmissions.length === 0 ? (
              <p className="text-ruwad-navy/50 text-sm py-4 text-center">لم تخض أي تحدٍ بعد.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {challengeSubmissions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-ruwad-navy truncate">{c.challenge?.title}</span>
                    <span className="font-semibold text-ruwad-navy">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-ruwad shadow-card p-6">
            <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
              <FileCheck size={20} className="text-ruwad-blue" /> الواجبات ({assignmentSubmissions?.length ?? 0})
            </h2>
            {!assignmentSubmissions || assignmentSubmissions.length === 0 ? (
              <p className="text-ruwad-navy/50 text-sm py-4 text-center">لم تسلّم أي واجب بعد.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {assignmentSubmissions.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-ruwad-navy truncate">{a.assignment?.title}</span>
                    <span className="font-semibold text-ruwad-navy">
                      {a.graded_at ? `${a.score}/${a.assignment?.total_marks}` : 'بانتظار التصحيح'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
