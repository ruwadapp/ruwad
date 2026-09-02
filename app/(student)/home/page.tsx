import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import {
  BookOpen, Award, CalendarCheck, PlayCircle, Radio, FileText,
  FileCheck, ScanLine, KeyRound, ArrowLeft, Flame,
} from 'lucide-react'
import { FireChallengeBadge, FireCardFrame } from '@/components/shared/FireChallengeBadge'
import { PointsCard, type PointsBreakdown } from '@/components/shared/PointsCard'
import { DismissNotifButton } from '@/components/student/DismissNotifButton'

export default async function StudentHomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [{ data: profile }, { data: enrollments }, { count: badgesCount }, attendanceStatsArr, { data: recentBadge }, pointsArr] =
    await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', uid).single(),
      supabase.from('enrollments').select('*, course:courses(title, trainer_id)').eq('student_id', uid).eq('status', 'approved').order('progress', { ascending: false }),
      supabase.from('student_badges').select('id', { count: 'exact', head: true }).eq('student_id', uid),
      supabase.rpc('get_student_attendance_stats', { p_student_id: uid }),
      supabase.from('student_badges').select('earned_at, badge:badges(name, icon)').eq('student_id', uid).order('earned_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.rpc('student_points', { p_student_id: uid }),
    ])

  const attendance = attendanceStatsArr.data?.[0] as { attendance_rate: number } | undefined
  const points = (pointsArr.data?.[0] ?? null) as PointsBreakdown | null
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

  // ===== أحدث فرصة عمل لم يشاهدها الطالب بعد =====
  const { data: latestJobs } = await supabase
    .from('job_opportunities')
    .select('id, position_title, employer_name, deadline, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  let newJob: { id: string; position_title: string; employer_name: string } | null = null
  {
    const today = new Date(new Date().toDateString())
    const activeJobs = (latestJobs ?? []).filter((j) => !j.deadline || new Date(j.deadline) >= today)
    if (activeJobs.length) {
      const { data: seen } = await supabase
        .from('job_opportunity_views')
        .select('opportunity_id')
        .eq('student_id', uid)
        .in('opportunity_id', activeJobs.map((j) => j.id))
      const seenSet = new Set((seen ?? []).map((v) => v.opportunity_id))
      newJob = activeJobs.find((j) => !seenSet.has(j.id)) ?? null
    }
  }

  // ===== دعايات كورسات موجّهة لك (غير مقروءة) =====
  const { data: promoNotifs } = await supabase
    .from('notifications')
    .select('id, message, reference_id, created_at')
    .eq('user_id', uid)
    .eq('type', 'course_promo')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(2)
  let promoCards: { notifId: string; message: string; courseId: string; title: string; description: string | null; code: string | null }[] = []
  if (promoNotifs && promoNotifs.length > 0) {
    const ids = promoNotifs.map((n) => n.reference_id).filter(Boolean) as string[]
    const { data: promoCourses } = ids.length
      ? await supabase.from('courses').select('id, title, description, course_code').in('id', ids)
      : { data: [] }
    promoCards = promoNotifs.flatMap((n) => {
      const c = (promoCourses ?? []).find((x) => x.id === n.reference_id)
      return c ? [{ notifId: n.id, message: n.message, courseId: c.id, title: c.title, description: c.description, code: c.course_code }] : []
    })
  }

  // ===== جلسة حضور مفتوحة الآن لكورسات الطالب (ولم يسجّل فيها بعد) =====
  let openAttendance: { session_code: string; title: string; courseTitle: string } | null = null
  if (courseIds.length) {
    const { data: openSessions } = await supabase
      .from('attendance_sessions')
      .select('id, title, session_code, course_id')
      .in('course_id', courseIds)
      .eq('is_active', true)
      .is('closed_at', null)
      .order('activated_at', { ascending: false })
    if (openSessions && openSessions.length > 0) {
      const { data: myRecs } = await supabase
        .from('attendance_records')
        .select('session_id')
        .eq('student_id', uid)
        .in('session_id', openSessions.map((x) => x.id))
      const done = new Set((myRecs ?? []).map((r) => r.session_id))
      const first = openSessions.find((x) => !done.has(x.id))
      if (first) {
        openAttendance = {
          session_code: first.session_code,
          title: first.title,
          courseTitle: (enrollments ?? []).find((e) => e.course_id === first.course_id)?.course?.title ?? '',
        }
      }
    }
  }

  // ===== استبيانات نشطة من مدربي كورساتك لم تُجب عنها =====
  const trainerIdsOfMyCourses = [...new Set((enrollments ?? []).map((e) => e.course?.trainer_id).filter(Boolean))] as string[]
  let pendingSurveys: { id: string; title: string; share_token: string }[] = []
  if (trainerIdsOfMyCourses.length) {
    const { data: activeSurveys } = await supabase
      .from('surveys')
      .select('id, title, share_token, ends_at')
      .in('trainer_id', trainerIdsOfMyCourses)
      .eq('is_active', true)
    const notEnded = (activeSurveys ?? []).filter((x) => !x.ends_at || new Date(x.ends_at) > new Date())
    if (notEnded.length) {
      const { data: myResponses } = await supabase
        .from('survey_responses')
        .select('survey_id')
        .eq('respondent_id', uid)
        .in('survey_id', notEnded.map((x) => x.id))
      const answered = new Set((myResponses ?? []).map((r) => r.survey_id))
      pendingSurveys = notEnded.filter((x) => !answered.has(x.id)).slice(0, 2)
    }
  }


  return (
    <>
      <Header title="الرئيسية" />
      <main className="p-6 flex flex-col gap-6">
        {points && points.total > 0 && (
          <Link href="/profile" className="block transition hover:-translate-y-0.5">
            <PointsCard points={points} compact />
          </Link>
        )}

        {/* ===== ترحيب مدمج: سطر واحد مع إحصاءات كحبوب ===== */}
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-ruwad-lime/20 rounded-full blur-2xl" />
          <h1 className="relative text-lg font-extrabold text-white">مرحباً {profile?.full_name?.split(' ')[0] ?? ''} 👋</h1>
          <div className="relative flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1.5 text-white text-xs font-bold">
              <BookOpen size={13} /> {enrollments?.length ?? 0} كورس
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1.5 text-white text-xs font-bold">
              <Award size={13} /> {badgesCount ?? 0} شارة
            </span>
            <span className="flex items-center gap-1.5 bg-ruwad-lime rounded-full px-3 py-1.5 text-ruwad-navy text-xs font-bold">
              <CalendarCheck size={13} /> {attendance ? `${attendance.attendance_rate}%` : '—'} حضور
            </span>
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

        {/* ===== فرصة عمل جديدة ===== */}
        {newJob && (
          <Link
            href="/opportunities"
            className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg bg-ruwad-navy p-4 flex items-center gap-3 text-white hover:-translate-y-0.5 transition-transform"
          >
            <div className="absolute -top-8 -left-8 w-28 h-28 bg-ruwad-lime/25 rounded-full blur-2xl" />
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-ruwad-lime/50 animate-ping" />
              <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-ruwad-lime text-ruwad-navy text-lg">💼</span>
            </span>
            <span className="relative flex-1 min-w-0">
              <span className="block font-bold text-sm">فرصة عمل جديدة! <span className="text-ruwad-lime">{newJob.position_title}</span></span>
              <span className="block text-xs text-white/70 truncate mt-0.5">لدى {newJob.employer_name} — اضغط للتفاصيل والتقديم</span>
            </span>
            <ArrowLeft size={16} className="relative shrink-0 text-ruwad-lime" />
          </Link>
        )}

        {/* ===== كورس مقترح لك (دعاية) ===== */}
        {promoCards.map((pc) => (
          <div key={pc.notifId} className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg p-[2px] bg-gradient-to-l from-ruwad-lime via-ruwad-blue-light to-ruwad-blue">
            <div className="relative bg-white rounded-[10px] p-5 overflow-hidden">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-ruwad-blue/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-ruwad-lime/30 rounded-full blur-2xl" />
              <div className="relative flex items-start gap-3">
                <span className="w-12 h-12 rounded-ruwad-sm bg-ruwad-gradient text-white flex items-center justify-center shrink-0 text-xl shadow-ruwad">✨</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-ruwad-blue bg-ruwad-blue/10 rounded-full px-2.5 py-0.5 inline-block">كورس مقترح لك بالقرب منك</p>
                  <h3 className="font-extrabold text-ruwad-navy mt-1.5 leading-snug">{pc.title}</h3>
                  {pc.description && <p className="text-xs text-ruwad-navy/55 line-clamp-2 mt-1 leading-relaxed">{pc.description}</p>}
                  <p className="text-[11px] text-ruwad-navy/40 mt-1.5">{pc.message}</p>
                </div>
              </div>
              <div className="relative flex items-center gap-2 mt-4">
                {pc.code && (
                  <Link href={`/qr/${pc.code}`} className="flex-1 text-center bg-ruwad-blue text-white font-bold text-sm px-4 py-2.5 rounded-ruwad-sm hover:opacity-90 transition shadow-ruwad">
                    اطّلع على الكورس وانضم
                  </Link>
                )}
                <DismissNotifButton notifId={pc.notifId} />
              </div>
            </div>
          </div>
        ))}

        {/* ===== جلسة حضور مفتوحة الآن ===== */}
        {openAttendance && (
          <div className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg p-[2px]" style={{ background: 'linear-gradient(120deg,#16a34a,#4ade80,#16a34a)' }}>
            <div className="relative bg-gradient-to-l from-green-600 via-emerald-500 to-green-500 rounded-[10px] p-5 flex items-center justify-between gap-4 text-white overflow-hidden">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-3 min-w-0">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white/40 animate-ping" />
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur"><CalendarCheck size={24} /></span>
                </span>
                <div className="min-w-0">
                  <p className="font-bold flex items-center gap-1.5">جلسة حضور مفتوحة الآن <Radio size={15} className="animate-pulse" /></p>
                  <p className="text-sm opacity-90 truncate">{openAttendance.title}{openAttendance.courseTitle ? ` — ${openAttendance.courseTitle}` : ''}</p>
                </div>
              </div>
              <Link href={`/qr/${openAttendance.session_code}`} className="bg-white text-green-600 font-bold px-4 py-2 rounded-ruwad-sm text-sm shrink-0 hover:opacity-90 transition">
                سجّل حضورك
              </Link>
            </div>
          </div>
        )}

        {/* ===== امتحانات نشطة بانتظارك ===== */}
        {unfinishedExams.map((e) => (
          <div key={e.id} className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg bg-gradient-to-l from-ruwad-blue via-indigo-500 to-ruwad-blue-light p-5 flex items-center justify-between gap-4 text-white">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-ruwad-lime/20 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3 min-w-0">
              <span className="w-12 h-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center shrink-0"><FileText size={22} /></span>
              <div className="min-w-0">
                <p className="font-bold">امتحان نشط بانتظارك ✍️</p>
                <p className="text-sm opacity-90 truncate">{e.title}</p>
              </div>
            </div>
            <Link href={`/my-exams/${e.id}`} className="relative bg-white text-ruwad-blue font-bold px-4 py-2 rounded-ruwad-sm text-sm shrink-0 hover:opacity-90 transition">
              ابدأ الآن
            </Link>
          </div>
        ))}

        {/* ===== استبيانات تنتظر رأيك ===== */}
        {pendingSurveys.map((sv) => (
          <div key={sv.id} className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg bg-ruwad-navy p-5 flex items-center justify-between gap-4 text-white">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-ruwad-lime/25 rounded-full blur-3xl" />
            <div className="relative flex items-center gap-3 min-w-0">
              <span className="w-12 h-12 rounded-full bg-ruwad-lime text-ruwad-navy flex items-center justify-center shrink-0 text-xl">📋</span>
              <div className="min-w-0">
                <p className="font-bold">استبيان يحتاج رأيك</p>
                <p className="text-sm opacity-80 truncate">{sv.title}</p>
              </div>
            </div>
            <Link href={`/survey/${sv.share_token}`} className="relative bg-ruwad-lime text-ruwad-navy font-bold px-4 py-2 rounded-ruwad-sm text-sm shrink-0 hover:opacity-90 transition">
              شارك برأيك
            </Link>
          </div>
        ))}

        {/* ===== مهامك (الواجبات) ===== */}
        {pendingAssignments.length > 0 && (
          <div className="bg-white rounded-ruwad shadow-card p-6">
            <h2 className="text-lg font-bold text-ruwad-navy mb-1 flex items-center gap-2">
              <FileCheck size={20} className="text-ruwad-blue" /> مهامك
            </h2>
            <p className="text-xs text-ruwad-navy/45 mb-4">واجبات بانتظار تسليمك — أنجزها واكسب نقاطك ✅</p>
            <div className="flex flex-col gap-2.5">
              {pendingAssignments.map((a, i) => {
                const overdue = a.due_date && new Date(a.due_date) < new Date()
                const dueSoon = a.due_date && !overdue && new Date(a.due_date).getTime() - Date.now() < 3 * 86400_000
                return (
                  <Link
                    key={a.id}
                    href="/my-assignments"
                    className={`flex items-center gap-3 p-3.5 rounded-ruwad-sm border-2 transition hover:-translate-y-0.5 hover:shadow-card ${
                      overdue ? 'border-red-200 bg-red-50/50' : dueSoon ? 'border-amber-200 bg-amber-50/50' : 'border-ruwad-gray/50 bg-[#FAFBFF]'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-extrabold shrink-0 ${
                      overdue ? 'border-red-400 text-red-500' : 'border-ruwad-blue text-ruwad-blue'
                    }`}>{i + 1}</span>
                    <span className="flex-1 text-sm font-bold text-ruwad-navy truncate">{a.title}</span>
                    {a.due_date && (
                      <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 shrink-0 ${
                        overdue ? 'bg-red-100 text-red-600' : dueSoon ? 'bg-amber-100 text-amber-600' : 'bg-ruwad-blue/10 text-ruwad-blue'
                      }`}>
                        {overdue ? 'متأخر!' : new Date(a.due_date).toLocaleDateString('ar', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <ArrowLeft size={15} className="text-ruwad-navy/30 shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
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


        {/* ===== آخر إنجاز + إجراءات سريعة ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recentBadge ? (
            <Link href="/my-achievements?tab=badges" className="bg-ruwad-lime/20 rounded-ruwad shadow-card p-5 flex items-center gap-3 hover:shadow-ruwad transition">
              <span className="text-3xl">{(recentBadge.badge as unknown as { icon?: string })?.icon ?? '🏆'}</span>
              <div>
                <p className="text-xs text-ruwad-navy/50">آخر إنجاز</p>
                <p className="font-bold text-ruwad-navy text-sm">{(recentBadge.badge as unknown as { name?: string })?.name}</p>
              </div>
            </Link>
          ) : (
            <Link href="/my-achievements?tab=badges" className="bg-ruwad-gray/20 rounded-ruwad shadow-card p-5 flex items-center gap-3 hover:shadow-card transition">
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
