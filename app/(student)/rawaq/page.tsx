import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { TrainerSearch } from '@/components/student/TrainerSearch'
import { RawaqFeed } from '@/components/student/RawaqFeed'
import type { PostCardType } from '@/lib/types'

export default async function RawaqPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const { data: follows } = await supabase.from('trainer_follows').select('trainer_id, institute_id').eq('student_id', uid)
  const followedIds = (follows ?? []).map((f) => f.trainer_id).filter((id): id is string => !!id)
  const followedInstituteIds = (follows ?? []).map((f) => f.institute_id).filter((id): id is string => !!id)
  const hasAnyFollow = followedIds.length > 0 || followedInstituteIds.length > 0

  let posts: any[] = []
  const cardData: Record<string, Record<PostCardType, any>> = {}
  let enrolledCourseIds = new Set<string>()
  let activeChallengeSessions: Record<string, { session_code: string } | null> = {}
  let likedPostIds: string[] = []
  let likeCounts: Record<string, number> = {}

  if (hasAnyFollow) {
    let postsQuery = supabase
      .from('trainer_posts')
      .select('*, trainer:profiles!trainer_id(full_name, avatar_url, bio), institute:institutes!institute_id(name)')
      .order('created_at', { ascending: false })
      .limit(50)

    const orParts: string[] = []
    if (followedIds.length > 0) orParts.push(`trainer_id.in.(${followedIds.join(',')})`)
    if (followedInstituteIds.length > 0) orParts.push(`institute_id.in.(${followedInstituteIds.join(',')})`)
    postsQuery = postsQuery.or(orParts.join(','))

    const { data: postsData } = await postsQuery
    posts = postsData ?? []

    const idsByType: Record<PostCardType, string[]> = { course: [], exam: [], assignment: [], challenge: [], survey: [], certificate: [] }
    for (const p of posts) {
      if (p.card_type && p.card_ref_id) idsByType[p.card_type as PostCardType].push(p.card_ref_id)
    }

    const [coursesRes, examsRes, assignmentsRes, challengesRes, surveysRes, certificatesRes, enrollRes] = await Promise.all([
      idsByType.course.length ? supabase.from('courses').select('id, title, description, course_code, status').in('id', idsByType.course) : Promise.resolve({ data: [] }),
      idsByType.exam.length ? supabase.from('exams').select('id, title, description, exam_code, is_active').in('id', idsByType.exam) : Promise.resolve({ data: [] }),
      idsByType.assignment.length ? supabase.from('assignments').select('id, title, description, assignment_code, is_active, due_date').in('id', idsByType.assignment) : Promise.resolve({ data: [] }),
      idsByType.challenge.length ? supabase.from('challenges').select('id, title, description').in('id', idsByType.challenge) : Promise.resolve({ data: [] }),
      idsByType.survey.length ? supabase.from('surveys').select('id, title, description, share_token, is_active').in('id', idsByType.survey) : Promise.resolve({ data: [] }),
      idsByType.certificate.length ? supabase.from('certificates').select('id, certificate_code, score, student:profiles!student_id(full_name), course:courses(title)').in('id', idsByType.certificate) : Promise.resolve({ data: [] }),
      supabase.from('enrollments').select('course_id').eq('student_id', uid),
    ])

    enrolledCourseIds = new Set((enrollRes.data ?? []).map((e) => e.course_id))

    const byId = <T extends { id: string }>(arr: T[] | null) => new Map((arr ?? []).map((x) => [x.id, x]))
    const coursesMap = byId(coursesRes.data as any[])
    const examsMap = byId(examsRes.data as any[])
    const assignmentsMap = byId(assignmentsRes.data as any[])
    const challengesMap = byId(challengesRes.data as any[])
    const surveysMap = byId(surveysRes.data as any[])
    const certificatesMap = byId(certificatesRes.data as any[])

    for (const p of posts) {
      if (!p.card_type || !p.card_ref_id) continue
      const map = { course: coursesMap, exam: examsMap, assignment: assignmentsMap, challenge: challengesMap, survey: surveysMap, certificate: certificatesMap }[p.card_type as PostCardType]
      cardData[p.id] = { [p.card_type]: map.get(p.card_ref_id) } as any
    }

    if (idsByType.challenge.length > 0) {
      const { data: sessions } = await supabase
        .from('challenge_sessions')
        .select('challenge_id, session_code, status, started_at')
        .in('challenge_id', idsByType.challenge)
        .neq('status', 'ended')
        .order('started_at', { ascending: false })
      for (const s of sessions ?? []) {
        if (!activeChallengeSessions[s.challenge_id]) activeChallengeSessions[s.challenge_id] = { session_code: s.session_code }
      }
    }

    const postIds = posts.map((p) => p.id)
    if (postIds.length > 0) {
      const { data: likes } = await supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds)
      for (const l of likes ?? []) {
        likeCounts[l.post_id] = (likeCounts[l.post_id] ?? 0) + 1
        if (l.user_id === uid) likedPostIds.push(l.post_id)
      }
    }
  }

  return (
    <>
      <Header title="الرواق" />
      <main
        className="p-6 flex flex-col gap-6 max-w-2xl mx-auto min-h-[calc(100vh-72px)]"
        style={{ background: 'linear-gradient(180deg, #252943 0%, #3A4EFB 45%, #33A4FA 100%)' }}
      >
        <div className="relative overflow-hidden bg-white/10 backdrop-blur rounded-ruwad shadow-sm p-6 flex items-center gap-3 border border-white/10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-ruwad-lime/30 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-xl font-extrabold text-white">جدارك الاجتماعي 🎉</h2>
            <p className="text-sm text-white/80 mt-1">تابع مدربيك ومعاهدك المفضّلة وشاهد كل جديدهم هنا أولاً بأول</p>
          </div>
        </div>

        <TrainerSearch followedIds={followedIds} followedInstituteIds={followedInstituteIds} />

        {!hasAnyFollow ? (
          <div className="bg-white/10 backdrop-blur rounded-ruwad shadow-sm border border-white/10 p-10 text-center text-white/80">
            لا تتابع أي مدرب أو معهد بعد. استخدم البحث أعلاه لإيجادهم ومتابعتهم لتظهر منشوراتهم هنا.
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white/10 backdrop-blur rounded-ruwad shadow-sm border border-white/10 p-10 text-center text-white/80">
            لا توجد منشورات حتى الآن ممن تتابعهم.
          </div>
        ) : (
          <RawaqFeed
            posts={posts}
            cardData={cardData}
            enrolledCourseIds={[...enrolledCourseIds]}
            activeChallengeSessions={activeChallengeSessions}
            likedPostIds={likedPostIds}
            likeCounts={likeCounts}
          />
        )}
      </main>
    </>
  )
}
