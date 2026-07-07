import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import {
  BookOpen, Award, CalendarCheck, PlayCircle, Radio, FileText,
  FileCheck, ScanLine, KeyRound, ArrowLeft, Sparkles, Flame,
} from 'lucide-react'
import { FireChallengeBadge, FireCardFrame } from '@/components/shared/FireChallengeBadge'

export default async function StudentHomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [{ data: profile }, { data: enrollments }, { count: badgesCount }, attendanceStatsArr, { data: recentBadge }] =
    await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', uid).single(),
      supabase.from('enrollments').select('*, course:courses(title)').eq('student_id', uid).eq('status', 'approved').order('progress', { ascending: false }),
      supabase.from('student_badges').select('id', { count: 'exact', head: true }).eq('student_id', uid),
      supabase.rpc('get_student_attendance_stats', { p_student_id: uid }),
      supabase.from('student_badges').select('earned_at, badge:badges(name, icon)').eq('student_id', uid).order('earned_at', { ascending: false }).limit(1).maybeSingle(),
    ])

  const attendance = attendanceStatsArr.data?.[0] as { attendance_rate: number } | undefined
  const courseIds = (enrollments ?? []).map((e) => e.course_id)

  // ===== الكورس الجاري حالياً + المحاضرة التالية =====
  const inProgress = (enrollments ?? []).find((e) => (e.progress ?? 0) > 0 && (e.progress ?? 0) < 100)
  let nextLecture: { id: string; title: string } | null = null
  if (inProgress) {
    const [{ data: lectures }, { data: progressRows }] = await Promise.all([
      supabase.from('lectures').select('id, title').eq('course_id', inProgress.course_id).eq('is_published', true).order('order_index', { ascending: true }),
      supabase.from('lecture_progress').select('lecture_id, completed').eq('student_id', uid).eq('completed', true),
    ])
    const doneIds = new Set((progressRows ?? []).map((p) => p.lecture_id))
    nextLecture = (lectures ?? []).find((l) => !doneIds.has(l.id)) ?? null
  }

  // ===== جلسات مباشرة الآن (تحديات + عروض تقديمية) =====
  const { data: liveChallenges } = courseIds.length
    ? await supabase.from('challenges').select('id, title, course_id').in('course_id', courseIds).eq('is_active', true)
    : { data: [] }

  let activeLiveItems: { sessionId: string; title: string }[] = []
  if (liveChallenges && liveChallenges.length > 0) {
    const { data: sessions } = await supabase
      .from('challenge_sessions').select('id, challenge_id').in('challenge_id', liveChallenges.map((c) => c.id)).neq('status', 'ended')
    activeLiveItems = (sessions ?? []).map((s) => ({
      sessionId: s.id,
      title: liveChallenges.find((c) => c.id === s.challenge_id)?.title ?? '',
    }))
  }

  // ===== امتحانات بانتظارك =====
  const { data: pendingExams } = courseIds.length
    ? await supabase.from('exams').select('id, title').in('course_id', courseIds).eq('is_active', true)
    : { data: [] }
  let unfinishedExams: { id: string; title: string }[] = []
  if (pendingExams && pendingExams.length > 0) {
    const { data: subs } = await supabase
      .from('exam_submissions').select('exam_id, submitted_at').eq('student_id', uid).in('exam_id', pendingExams.map((e) => e.id))
    const submittedIds = new Set((subs ?? []).filter((s) => s.submitted_at).map((s) => s.exam_id))
    unfinishedExams = pendingExams.filter((e) => !submittedIds.has(e.id)).slice(0, 3)
  }

  // ===== واجبات تستحق التسليم =====
  const { data: courseAssignments } = courseIds.length
    ? await supabase.from('assignments').select('id, title, due_date').in('course_id', courseIds).eq('is_active', true)
    : { data: [] }
  let pendingAssignments: { id: string; title: string; due_date: string | null }[] = []
  if (courseAssignments && courseAssignments.length > 0) {
    const { data: subs } = await supabase
      .from('assignment_submissions').select('assignment_id').eq('student_id', uid).in('assignment_id', courseAssignments.map((a) => a.id))
    const submittedIds = new Set((subs ?? []).map((s) => s.assignment_id))
    pendingAssignments = courseAssignments.filter((a) => !submittedIds.has(a.id)).slice(0, 3)
  }

  const needsAttentionCount = unfinishedExams.length + pendingAssignments.length

  return (
    <>
      <Header title="الرئيسية" />
      <main className="p-6 flex flex-col gap-6">
        {/* ===== الترحيب + إحصاءات مصغّرة ===== */}
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-7">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />
          <h1 className="relative text-2xl font-extrabold text-white">مرحباً {profile?.full_name?.split(' ')[0] ?? ''} 👋</h1>
          <p className="relative text-white/70 text-sm mt-1">استمر في رحلتك التعليمية اليوم</p>

          <div className="relative grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-3 text-center">
              <BookOpen size={18} className="text-white mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{enrollments?.length ?? 0}</p>
              <p className="text-[11px] text-white/70">كورس</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-3 text-center">
              <Award size={18} className="text-white mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{badgesCount ?? 0}</p>
              <p className="text-[11px] text-white/70">شارة</p>
            </div>
            <div className="bg-ruwad-lime rounded-ruwad-sm p-3 text-center">
              <CalendarCheck size={18} className="text-ruwad-navy mx-auto mb-1" />
              <p className="text-lg font-bold text-ruwad-navy">{attendance ? `${attendance.attendance_rate}%` : '—'}</p>
              <p className="text-[11px] text-ruwad-navy/70">حضور</p>
            </div>
          </div>
        </div>

        {/* ===== نشاط مباشر الآن ===== */}
        {activeLiveItems.length > 0 && (
          <FireCardFrame>
            <div className="bg-gradient-to-l from-orange-600 via-red-500 to-orange-500 animate-fire-bg rounded-[10px] p-5 flex items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3 min-w-0">
                <FireChallengeBadge />
                <div className="min-w-0">
                  <p className="font-bold flex items-center gap-1.5">تحدٍ مشتعل الآن <Flame size={16} className="animate-flame-flicker" /></p>
                  <p className="text-sm opacity-90 truncate">{activeLiveItems[0].title}</p>
                </div>
              </div>
              <Link href={`/my-challenges/live/${activeLiveItems[0].sessionId}`} className="bg-white text-orange-600 font-bold px-4 py-2 rounded-ruwad-sm text-sm shrink-0 hover:opacity-90 transition">
                انضم الآن
              </Link>
            </div>
          </FireCardFrame>
        )}

        {/* ===== استمر من حيث توقفت ===== */}
        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
            <PlayCircle size={20} className="text-ruwad-blue" /> استمر من حيث توقفت
          </h2>
          {inProgress && nextLecture ? (
            <Link
              href={`/my-courses/${inProgress.course_id}/lectures/${nextLecture.id}`}
              className="flex items-center gap-4 p-4 rounded-ruwad-sm bg-ruwad-blue/5 hover:bg-ruwad-blue/10 transition"
            >
              <div className="w-12 h-12 rounded-full bg-ruwad-blue text-white flex items-center justify-center shrink-0">
                <PlayCircle size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ruwad-navy/50">{inProgress.course?.title}</p>
                <p className="font-bold text-ruwad-navy truncate">{nextLecture.title}</p>
                <div className="w-full bg-ruwad-gray/30 rounded-full h-1.5 mt-1.5 max-w-[200px]">
                  <div className="bg-ruwad-blue h-1.5 rounded-full" style={{ width: `${inProgress.progress ?? 0}%` }} />
                </div>
              </div>
              <ArrowLeft size={18} className="text-ruwad-navy/40 shrink-0" />
            </Link>
          ) : (
            <div className="text-center py-4">
              <p className="text-ruwad-navy/50 text-sm mb-3">
                {enrollments?.length ? 'أنهيت كل محاضراتك الحالية، رائع! 🎉' : 'لم تنضمّ لأي كورس بعد.'}
              </p>
              <Link href="/my-courses" className="text-ruwad-blue text-sm font-semibold">تصفّح الكورسات →</Link>
            </div>
          )}
        </div>

        {/* ===== يحتاج اهتمامك ===== */}
        {needsAttentionCount > 0 && (
          <div className="bg-white rounded-ruwad shadow-card p-6">
            <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" /> يحتاج اهتمامك ({needsAttentionCount})
            </h2>
            <div className="flex flex-col gap-2">
              {unfinishedExams.map((e) => (
                <Link key={e.id} href={`/my-exams/${e.id}`} className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60 hover:bg-ruwad-gray/10 transition">
                  <FileText size={18} className="text-ruwad-blue shrink-0" />
                  <span className="flex-1 text-sm font-medium text-ruwad-navy truncate">{e.title}</span>
                  <span className="text-xs text-ruwad-navy/40 shrink-0">امتحان جديد</span>
                </Link>
              ))}
              {pendingAssignments.map((a) => (
                <Link key={a.id} href="/my-assignments" className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60 hover:bg-ruwad-gray/10 transition">
                  <FileCheck size={18} className="text-ruwad-navy shrink-0" />
                  <span className="flex-1 text-sm font-medium text-ruwad-navy truncate">{a.title}</span>
                  <span className="text-xs text-ruwad-navy/40 shrink-0">
                    {a.due_date ? `موعده ${new Date(a.due_date).toLocaleDateString('ar')}` : 'واجب'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ===== آخر إنجاز + إجراءات سريعة ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recentBadge ? (
            <Link href="/my-badges" className="bg-ruwad-lime/20 rounded-ruwad shadow-card p-5 flex items-center gap-3 hover:shadow-ruwad transition">
              <span className="text-3xl">{(recentBadge.badge as unknown as { icon?: string })?.icon ?? '🏆'}</span>
              <div>
                <p className="text-xs text-ruwad-navy/50">آخر إنجاز</p>
                <p className="font-bold text-ruwad-navy text-sm">{(recentBadge.badge as unknown as { name?: string })?.name}</p>
              </div>
            </Link>
          ) : (
            <Link href="/my-badges" className="bg-ruwad-gray/20 rounded-ruwad shadow-card p-5 flex items-center gap-3 hover:shadow-card transition">
              <Award size={28} className="text-ruwad-navy/30" />
              <div>
                <p className="text-xs text-ruwad-navy/50">لا توجد شارات بعد</p>
                <p className="font-semibold text-ruwad-navy text-sm">ابدأ لتكسب أولى شاراتك</p>
              </div>
            </Link>
          )}

          <Link href="/my-courses" className="bg-ruwad-navy rounded-ruwad shadow-card p-5 flex items-center gap-3 text-white hover:opacity-90 transition">
            <KeyRound size={26} className="text-ruwad-lime" />
            <div>
              <p className="text-xs text-white/60">لديك كود؟</p>
              <p className="font-semibold text-sm flex items-center gap-1">انضم لكورس أو معهد <ScanLine size={14} /></p>
            </div>
          </Link>
        </div>
      </main>
    </>
  )
}
