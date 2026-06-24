import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { BadgeCard } from '@/components/shared/BadgeCard'
import { BadgeShareCard } from '@/components/student/BadgeShareCard'
import { ExamProgressChart } from '@/components/student/ExamProgressChart'
import type { Badge, BadgeRarity } from '@/lib/types'
import { Award, BookOpen, FileText, CalendarCheck, Trophy, FileCheck } from 'lucide-react'

const RARITY_ORDER: BadgeRarity[] = ['legendary', 'epic', 'rare', 'common']
const RARITY_TITLES: Record<BadgeRarity, string> = {
  legendary: '🏆 فريدة',
  epic: '💎 أسطورية',
  rare: '⭐ نادرة',
  common: '🔰 عادية',
}

export default async function ProgressPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [
    { data: profile },
    { data: allBadges },
    { data: earned },
    { data: examSubmissions },
    { data: enrollments },
    { data: challengeSubmissions },
    { data: assignmentSubmissions },
    { data: attendanceStatsArr },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', uid).single(),
    supabase.from('badges').select('*').order('condition_value', { ascending: true }),
    supabase.from('student_badges').select('badge_id').eq('student_id', uid),
    supabase.from('exam_submissions')
      .select('*, exam:exams(title, total_marks)')
      .eq('student_id', uid).not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: true }),
    supabase.from('enrollments').select('*, course:courses(title)').eq('student_id', uid).eq('status', 'approved'),
    supabase.from('challenge_submissions').select('*, challenge:challenges(title)').eq('student_id', uid),
    supabase.from('assignment_submissions').select('*, assignment:assignments(title, total_marks)').eq('student_id', uid),
    supabase.rpc('get_student_attendance_stats', { p_student_id: uid }),
  ])

  const earnedIds = new Set((earned ?? []).map((e) => e.badge_id))
  const limitedBadgeIds = (allBadges ?? []).filter((b) => b.max_winners).map((b) => b.id)
  const countsMap = new Map<string, number>()
  if (limitedBadgeIds.length > 0) {
    const { data: counts } = await supabase.from('student_badges').select('badge_id').in('badge_id', limitedBadgeIds)
    for (const row of counts ?? []) countsMap.set(row.badge_id, (countsMap.get(row.badge_id) ?? 0) + 1)
  }

  const grouped: Record<BadgeRarity, Badge[]> = { legendary: [], epic: [], rare: [], common: [] }
  for (const badge of allBadges ?? []) grouped[badge.rarity as BadgeRarity].push(badge)

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
      <Header title="تقدّمي والشارات" />
      <main className="p-6 flex flex-col gap-8">
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
            <p className="text-2xl font-bold">{earnedIds.size} / {allBadges?.length ?? 0}</p>
          </div>
        </div>

        {/* ===== أداء الامتحانات عبر الزمن ===== */}
        <section className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">أداء الامتحانات عبر الزمن</h2>
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

        {/* ===== الشارات ===== */}
        {RARITY_ORDER.map((rarity) => (
          grouped[rarity].length > 0 && (
            <section key={rarity}>
              <h2 className="text-lg font-bold text-ruwad-navy mb-4">{RARITY_TITLES[rarity]}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {grouped[rarity].map((badge) => {
                  const earnedThis = earnedIds.has(badge.id)
                  return (
                    <div key={badge.id} className="flex flex-col gap-2">
                      <BadgeCard badge={badge} earned={earnedThis} earnedCount={countsMap.get(badge.id)} />
                      {earnedThis && <BadgeShareCard badge={badge} studentName={profile?.full_name ?? 'طالب رُوّاد'} />}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        ))}
      </main>
    </>
  )
}
