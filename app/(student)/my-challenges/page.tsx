import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ChallengeCodeJoin } from '@/components/student/ChallengeCodeJoin'
import { FireChallengeBadge, FireCardFrame } from '@/components/shared/FireChallengeBadge'
import { Trophy, Zap, Flame } from 'lucide-react'

export default async function MyChallengesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // التحديات المرتبطة بكورسات الطالب — تظهر تلقائياً بدون كود
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', user!.id)
    .eq('status', 'approved')

  const courseIds = (enrollments ?? []).map((e) => e.course_id)

  const { data: courseChallenges } = courseIds.length
    ? await supabase
        .from('challenges')
        .select('id, title, challenge_type, course:courses(title)')
        .in('course_id', courseIds)
        .eq('is_active', true)
    : { data: [] }

  const quizChallengeIds = (courseChallenges ?? []).filter((c) => c.challenge_type === 'quiz').map((c) => c.id)
  const { data: activeSessions } = quizChallengeIds.length
    ? await supabase
        .from('challenge_sessions')
        .select('id, challenge_id, status')
        .in('challenge_id', quizChallengeIds)
        .neq('status', 'ended')
    : { data: [] }

  const sessionByChallenge = new Map((activeSessions ?? []).map((s) => [s.challenge_id, s]))

  const { data: submissions } = await supabase
    .from('challenge_submissions')
    .select('score, percentage, submitted_at, challenge:challenges(title)')
    .eq('student_id', user!.id)
    .order('submitted_at', { ascending: false })

  return (
    <>
      <Header title="التحديات" />
      <main className="p-6 flex flex-col gap-6">
        {/* ===== تحديات التدريبات ===== */}
        {courseChallenges && courseChallenges.length > 0 && (
          <div className="bg-white rounded-ruwad shadow-card p-6">
            <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
              <Zap size={20} className="text-ruwad-lime" /> تحديات التدريبات
            </h2>
            <div className="flex flex-col gap-2">
              {courseChallenges.map((c) => {
                const courseTitle = (c.course as unknown as { title?: string } | null)?.title ?? ''
                const session = sessionByChallenge.get(c.id)
                const row = (
                  <div className={`flex items-center gap-3 p-4 rounded-ruwad-sm ${session ? 'bg-gradient-to-l from-orange-50 via-ruwad-lime/10 to-white' : 'border border-ruwad-gray/60'}`}>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {session && <FireChallengeBadge size="sm" />}
                      <div className="min-w-0">
                        <p className="font-medium text-ruwad-navy truncate">{c.title}</p>
                        <p className="text-xs text-ruwad-navy/50 truncate">{courseTitle}</p>
                      </div>
                    </div>
                    {c.challenge_type === 'sprint' ? (
                      <Link href={`/my-challenges/sprint/${c.id}`} className="flex items-center gap-1.5 text-sm font-bold bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm hover:opacity-90 transition shrink-0">
                        ابدأ السباق
                      </Link>
                    ) : session ? (
                      <Link href={`/my-challenges/live/${session.id}`} className="flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded-ruwad-sm shrink-0 bg-gradient-to-r from-orange-600 via-red-500 to-orange-500 animate-fire-bg shadow-ruwad">
                        <Flame size={14} className="animate-flame-flicker" /> مشتعل الآن — انضم
                      </Link>
                    ) : (
                      <span className="text-xs text-ruwad-navy/40 shrink-0">لا توجد جلسة مباشرة الآن</span>
                    )}
                  </div>
                )
                return <div key={c.id}>{session ? <FireCardFrame>{row}</FireCardFrame> : row}</div>
              })}
            </div>
          </div>
        )}

        {/* ===== الانضمام بكود (للتحديات غير المرتبطة بكورس) ===== */}
        <ChallengeCodeJoin />

        {/* ===== سجل النتائج ===== */}
        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-ruwad-lime" /> سجل تحدياتي السابقة
          </h2>
          {!submissions || submissions.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-4 text-center">لم تخض أي تحدٍ مباشر بعد.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {submissions.map((s, idx) => {
                const challengeTitle = (s.challenge as unknown as { title?: string } | null)?.title ?? ''
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-ruwad-sm border border-ruwad-gray/60">
                    <div>
                      <p className="font-medium text-ruwad-navy">{challengeTitle}</p>
                      <p className="text-xs text-ruwad-navy/50">{new Date(s.submitted_at).toLocaleDateString('ar')}</p>
                    </div>
                    <span className="text-sm font-bold bg-ruwad-lime/20 text-ruwad-navy px-3 py-1.5 rounded-full">
                      {s.score} نقطة · {s.percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
