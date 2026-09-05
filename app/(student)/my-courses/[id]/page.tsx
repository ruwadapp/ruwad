import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CheckCircle2, Circle, Video, FileText, Clock, XCircle, PlayCircle, Lock } from 'lucide-react'
import { CourseViewTabs } from '@/components/student/CourseViewTabs'
import { CourseJourneyMap, type JourneyNode } from '@/components/student/CourseJourneyMap'

export default async function StudentCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*, course:courses(*)')
    .eq('course_id', id)
    .eq('student_id', user!.id)
    .single()

  if (!enrollment || !enrollment.course) redirect('/my-courses')

  if (enrollment.status !== 'approved') {
    return (
      <>
        <Header title={enrollment.course.title} />
        <main className="p-6">
          <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
            {enrollment.status === 'pending' ? (
              <>
                <Clock size={48} className="text-ruwad-navy/40" />
                <h2 className="font-bold text-ruwad-navy">طلبك بانتظار موافقة المدرب</h2>
                <p className="text-sm text-ruwad-navy/60">ستظهر محتويات الكورس بعد قبول طلب التحاقك.</p>
              </>
            ) : (
              <>
                <XCircle size={48} className="text-red-400" />
                <h2 className="font-bold text-ruwad-navy">تم رفض طلب التحاقك بهذا الكورس</h2>
              </>
            )}
            <Link href="/my-courses" className="text-ruwad-blue text-sm font-semibold mt-2">رجوع للتدريبات</Link>
          </div>
        </main>
      </>
    )
  }

  const { data: lectures } = await supabase
    .from('lectures')
    .select('*')
    .eq('course_id', id)
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  const { data: progress } = await supabase
    .from('lecture_progress')
    .select('lecture_id, completed')
    .eq('student_id', user!.id)

  const { count: groupsCount } = await supabase
    .from('project_groups').select('id', { count: 'exact', head: true }).eq('course_id', id)

  const completedIds = new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lecture_id))
  const firstIncompleteIdx = (lectures ?? []).findIndex((l) => !completedIds.has(l.id))
  const courseProgress = enrollment.progress ?? 0

  // ===== بيانات رحلة الخريطة =====
  const [
    { data: courseExams }, { data: courseAssignments }, { data: courseChallenges },
    { data: examSubs }, { data: assignSubs }, { data: challengeSubs },
    { data: certificate }, { data: treasureRows }, { data: journeyOrder },
  ] = await Promise.all([
    supabase.from('exams').select('id, title').eq('course_id', id).eq('is_active', true).order('created_at'),
    supabase.from('assignments').select('id, title').eq('course_id', id).order('created_at'),
    supabase.from('challenges').select('id, title').eq('course_id', id).order('created_at'),
    supabase.from('exam_submissions').select('exam_id').eq('student_id', user!.id).not('submitted_at', 'is', null),
    supabase.from('assignment_submissions').select('assignment_id').eq('student_id', user!.id).not('submitted_at', 'is', null),
    supabase.from('challenge_submissions').select('challenge_id').eq('student_id', user!.id).not('submitted_at', 'is', null),
    supabase.from('certificates').select('id').eq('course_id', id).eq('student_id', user!.id).maybeSingle(),
    supabase.from('treasure_claims').select('node_index, item_id').eq('course_id', id).eq('student_id', user!.id),
    supabase.from('journey_items').select('id, item_type, item_id').eq('course_id', id).order('order_index'),
  ])
  const submittedExams = new Set((examSubs ?? []).map((x) => x.exam_id))
  const submittedAssigns = new Set((assignSubs ?? []).map((x) => x.assignment_id))
  const submittedChallenges = new Set((challengeSubs ?? []).map((x) => x.challenge_id))

  // مصانع العقد لكل نوع
  const nodeFor = {
    lecture: (l: { id: string; title: string }): JourneyNode => ({
      key: `lec-${l.id}`, kind: 'lecture', title: l.title,
      href: `/my-courses/${id}/lectures/${l.id}`, completed: completedIds.has(l.id),
    }),
    assignment: (a: { id: string; title: string }): JourneyNode => ({
      key: `asg-${a.id}`, kind: 'assignment', title: a.title,
      href: '/my-assignments', completed: submittedAssigns.has(a.id),
    }),
    challenge: (c: { id: string; title: string }): JourneyNode => ({
      key: `ch-${c.id}`, kind: 'challenge', title: c.title,
      href: '/my-challenges', completed: submittedChallenges.has(c.id),
    }),
    exam: (e: { id: string; title: string }): JourneyNode => ({
      key: `ex-${e.id}`, kind: 'exam', title: e.title,
      href: `/my-exams/${e.id}`, completed: submittedExams.has(e.id),
    }),
  }
  const summitNode: JourneyNode = {
    key: 'summit', kind: 'certificate', title: 'شهادة إتمام الكورس',
    href: '/my-achievements', completed: !!certificate,
  }

  const byId = {
    lecture: new Map((lectures ?? []).map((x) => [x.id, x])),
    assignment: new Map((courseAssignments ?? []).map((x) => [x.id, x])),
    challenge: new Map((courseChallenges ?? []).map((x) => [x.id, x])),
    exam: new Map((courseExams ?? []).map((x) => [x.id, x])),
  }

  const hasCustomOrder = (journeyOrder ?? []).length > 0
  let journeyNodes: JourneyNode[]
  if (hasCustomOrder) {
    // ===== الترتيب الذي نظّمه المدرب/المعهد (مع إلحاق أي محتوى أحدث لم يُرتَّب بعد) =====
    journeyNodes = []
    const placed = new Set<string>()
    for (const it of journeyOrder ?? []) {
      if (it.item_type === 'treasure') {
        journeyNodes.push({ key: `tr-${it.id}`, kind: 'treasure', title: 'كنز مخفي', href: '#', completed: false, treasureItemId: it.id })
      } else {
        const src = byId[it.item_type as keyof typeof byId]?.get(it.item_id ?? '')
        if (src) { journeyNodes.push(nodeFor[it.item_type as keyof typeof nodeFor](src)); placed.add(it.item_id!) }
      }
    }
    for (const [type, map] of Object.entries(byId) as [keyof typeof byId, Map<string, { id: string; title: string }>][])
      for (const [xid, x] of map) if (!placed.has(xid)) journeyNodes.push(nodeFor[type](x))
    journeyNodes.push(summitNode)
  } else {
    journeyNodes = [
      ...(lectures ?? []).map(nodeFor.lecture),
      ...(courseAssignments ?? []).map(nodeFor.assignment),
      ...(courseChallenges ?? []).map(nodeFor.challenge),
      ...(courseExams ?? []).map(nodeFor.exam),
      summitNode,
    ]
  }
  const sequential = enrollment.course.sequential_learning ?? true
  // في العرض المتسلسل: المحاضرات بعد أول ناقصة تُقفل في عرض القائمة أيضاً
  const lockedFromIdx = sequential && firstIncompleteIdx !== -1 ? firstIncompleteIdx + 1 : Infinity

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden bg-ruwad-gradient px-6 py-10">
        <div className="absolute -top-16 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-ruwad-lime/20 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto flex flex-col items-center text-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{enrollment.course.title}</h1>
          {enrollment.course.description && (
            <p className="text-white/70 text-sm max-w-lg">{enrollment.course.description}</p>
          )}

          <div className="w-full max-w-sm flex items-center gap-3 mt-2">
            <div className="flex-1 bg-white/20 rounded-full h-2.5">
              <div className="bg-ruwad-lime h-2.5 rounded-full transition-all" style={{ width: `${courseProgress}%` }} />
            </div>
            <span className="text-white font-bold text-sm shrink-0">{courseProgress}%</span>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-3xl mx-auto w-full -mt-2">
        {(groupsCount ?? 0) > 0 && (
          <Link href={`/my-courses/${id}/groups`}
            className="flex items-center gap-2 bg-white shadow-card rounded-ruwad-sm px-4 py-3 mb-4 text-sm font-extrabold text-ruwad-navy hover:shadow-ruwad transition">
            👥 مجموعتك في هذا التدريب <span className="text-ruwad-blue mr-auto">عرض المجموعات ←</span>
          </Link>
        )}
        <CourseViewTabs
          journey={
            <CourseJourneyMap
              courseId={id}
              nodes={journeyNodes}
              sequential={sequential}
              claimedIndexes={(treasureRows ?? []).map((t) => t.node_index).filter((x): x is number => x != null)}
              claimedItemIds={(treasureRows ?? []).map((t) => t.item_id).filter((x): x is string => x != null)}
              customOrder={hasCustomOrder}
            />
          }
          list={
        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">المحاضرات</h2>
          {!lectures || lectures.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-4 text-center">لا توجد محاضرات منشورة حالياً.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {lectures.map((lecture, idx) => {
                const done = completedIds.has(lecture.id)
                const isUpNext = idx === firstIncompleteIdx
                const locked = idx >= lockedFromIdx
                if (locked) return (
                  <div key={lecture.id} title="أكمل المحاضرة السابقة أولاً" className="flex items-center gap-3 p-4 rounded-ruwad-sm border-2 border-ruwad-gray/40 bg-ruwad-gray/10 opacity-60 cursor-not-allowed">
                    <Lock size={20} className="text-ruwad-navy/30 shrink-0" />
                    <span className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 bg-ruwad-gray/40 text-ruwad-navy/40">{idx + 1}</span>
                    <span className="flex-1 min-w-0 font-medium text-ruwad-navy/45 truncate">{lecture.title}</span>
                    <span className="text-[10px] font-bold text-ruwad-navy/35 shrink-0">أكمل السابقة أولاً</span>
                  </div>
                )
                return (
                  <Link
                    key={lecture.id}
                    href={`/my-courses/${id}/lectures/${lecture.id}`}
                    className={`flex items-center gap-3 p-4 rounded-ruwad-sm border-2 transition hover:shadow-card ${
                      done ? 'border-ruwad-lime/50 bg-ruwad-lime/5' :
                      isUpNext ? 'border-ruwad-blue bg-ruwad-blue/5' :
                      'border-ruwad-gray/50 hover:border-ruwad-gray'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 size={22} className="text-ruwad-blue shrink-0" />
                    ) : (
                      <Circle size={22} className="text-ruwad-navy/25 shrink-0" />
                    )}
                    <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      done ? 'bg-ruwad-lime text-ruwad-navy' : isUpNext ? 'bg-ruwad-blue text-white' : 'bg-ruwad-gray/40 text-ruwad-navy'
                    }`}>
                      {idx + 1}
                    </span>
                    {lecture.video_url ? (
                      <Video size={18} className="text-ruwad-blue/70 shrink-0" />
                    ) : (
                      <FileText size={18} className="text-ruwad-blue/70 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ruwad-navy truncate">{lecture.title}</p>
                      {lecture.duration_minutes && (
                        <p className="text-xs text-ruwad-navy/50">{lecture.duration_minutes} دقيقة</p>
                      )}
                    </div>
                    {isUpNext && !done && (
                      <span className="flex items-center gap-1 text-xs font-bold text-ruwad-blue shrink-0">
                        <PlayCircle size={14} /> التالية
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
          }
        />
      </main>
    </div>
  )
}
