'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrainerPost, PostCardType } from '@/lib/types'
import { GraduationCap, Building2, BookOpen, FileText, FileCheck, Trophy, ClipboardList, CheckCircle2, Clock, Zap } from 'lucide-react'

interface CourseCard { id: string; title: string; description: string | null; course_code: string; status: string }
interface ExamCard { id: string; title: string; description: string | null; exam_code: string; is_active: boolean }
interface AssignmentCard { id: string; title: string; description: string | null; assignment_code: string; is_active: boolean; due_date: string | null }
interface ChallengeCard { id: string; title: string; description: string | null }
interface SurveyCard { id: string; title: string; description: string | null; share_token: string; is_active: boolean }

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'الآن'
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`
  return `منذ ${Math.floor(diff / 86400)} يوم`
}

export function RawaqFeed({
  posts,
  cardData,
  enrolledCourseIds,
  activeChallengeSessions,
}: {
  posts: TrainerPost[]
  cardData: Record<string, Partial<Record<PostCardType, any>>>
  enrolledCourseIds: string[]
  activeChallengeSessions: Record<string, { session_code: string } | null>
}) {
  const [enrolled, setEnrolled] = useState(new Set(enrolledCourseIds))
  const [pending, setPending] = useState(new Set<string>())
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function joinCourse(courseId: string) {
    setJoiningId(courseId)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('enrollments').insert({ student_id: user!.id, course_id: courseId })
    if (!error) {
      setPending((prev) => new Set(prev).add(courseId))
      router.refresh()
    }
    setJoiningId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => {
        const card = post.card_type ? cardData[post.id]?.[post.card_type] : null
        return (
          <div key={post.id} className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-full bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center shrink-0">
                {post.institute_id ? <Building2 size={18} /> : <GraduationCap size={18} />}
              </span>
              <div>
                <p className="font-semibold text-ruwad-navy text-sm">
                  {post.institute_id ? (post.institute?.name ?? 'معهد') : (post.trainer?.full_name ?? 'مدرّب')}
                </p>
                <p className="text-xs text-ruwad-navy/40">{timeAgo(post.created_at)}</p>
              </div>
            </div>

            <p className="text-ruwad-navy whitespace-pre-wrap leading-relaxed">{post.content}</p>

            {post.card_type === 'course' && card && (() => {
              const c = card as CourseCard
              const isEnrolled = enrolled.has(c.id)
              const isPending = pending.has(c.id)
              return (
                <div className="rounded-ruwad-sm border-2 border-ruwad-blue/20 bg-ruwad-blue/5 p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen size={18} className="text-ruwad-blue shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-ruwad-navy truncate">{c.title}</p>
                      {c.description && <p className="text-xs text-ruwad-navy/50 truncate">{c.description}</p>}
                    </div>
                  </div>
                  {isEnrolled ? (
                    <span className="flex items-center gap-1 text-xs font-semibold bg-ruwad-lime/30 text-ruwad-navy px-3 py-1.5 rounded-full shrink-0"><CheckCircle2 size={13} /> مسجَّل</span>
                  ) : isPending ? (
                    <span className="flex items-center gap-1 text-xs font-semibold bg-ruwad-gray/40 text-ruwad-navy/60 px-3 py-1.5 rounded-full shrink-0"><Clock size={13} /> بانتظار الموافقة</span>
                  ) : (
                    <button onClick={() => joinCourse(c.id)} disabled={joiningId === c.id} className="text-xs font-semibold bg-ruwad-blue text-white px-4 py-1.5 rounded-full hover:opacity-90 transition disabled:opacity-50 shrink-0">
                      {joiningId === c.id ? 'جارٍ الإرسال...' : 'انضمّ للكورس'}
                    </button>
                  )}
                </div>
              )
            })()}

            {post.card_type === 'exam' && card && (() => {
              const e = card as ExamCard
              return (
                <div className="rounded-ruwad-sm border-2 border-ruwad-blue/20 bg-ruwad-blue/5 p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={18} className="text-ruwad-blue shrink-0" />
                    <p className="font-bold text-ruwad-navy truncate">{e.title}</p>
                  </div>
                  {e.is_active ? (
                    <Link href={`/qr/${e.exam_code}`} className="text-xs font-semibold bg-ruwad-blue text-white px-4 py-1.5 rounded-full hover:opacity-90 transition shrink-0">ابدأ الامتحان</Link>
                  ) : (
                    <span className="text-xs font-semibold bg-ruwad-gray/40 text-ruwad-navy/60 px-3 py-1.5 rounded-full shrink-0">متوقف حالياً</span>
                  )}
                </div>
              )
            })()}

            {post.card_type === 'assignment' && card && (() => {
              const a = card as AssignmentCard
              return (
                <div className="rounded-ruwad-sm border-2 border-ruwad-blue/20 bg-ruwad-blue/5 p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCheck size={18} className="text-ruwad-blue shrink-0" />
                    <p className="font-bold text-ruwad-navy truncate">{a.title}</p>
                  </div>
                  {a.is_active ? (
                    <Link href={`/qr/${a.assignment_code}`} className="text-xs font-semibold bg-ruwad-blue text-white px-4 py-1.5 rounded-full hover:opacity-90 transition shrink-0">عرض الواجب</Link>
                  ) : (
                    <span className="text-xs font-semibold bg-ruwad-gray/40 text-ruwad-navy/60 px-3 py-1.5 rounded-full shrink-0">متوقف حالياً</span>
                  )}
                </div>
              )
            })()}

            {post.card_type === 'challenge' && card && (() => {
              const ch = card as ChallengeCard
              const session = activeChallengeSessions[ch.id]
              return (
                <div className="rounded-ruwad-sm border-2 border-ruwad-lime/40 bg-ruwad-lime/10 p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Trophy size={18} className="text-ruwad-navy shrink-0" />
                    <p className="font-bold text-ruwad-navy truncate">{ch.title}</p>
                  </div>
                  {session ? (
                    <Link href={`/qr/${session.session_code}`} className="flex items-center gap-1 text-xs font-semibold bg-ruwad-navy text-white px-4 py-1.5 rounded-full hover:opacity-90 transition shrink-0"><Zap size={12} /> انضم الآن — مباشر</Link>
                  ) : (
                    <span className="text-xs font-semibold bg-white text-ruwad-navy/60 px-3 py-1.5 rounded-full shrink-0">لا توجد جلسة نشطة الآن</span>
                  )}
                </div>
              )
            })()}

            {post.card_type === 'survey' && card && (() => {
              const s = card as SurveyCard
              return (
                <div className="rounded-ruwad-sm border-2 border-ruwad-blue/20 bg-ruwad-blue/5 p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClipboardList size={18} className="text-ruwad-blue shrink-0" />
                    <p className="font-bold text-ruwad-navy truncate">{s.title}</p>
                  </div>
                  {s.is_active ? (
                    <Link href={`/survey/${s.share_token}`} className="text-xs font-semibold bg-ruwad-blue text-white px-4 py-1.5 rounded-full hover:opacity-90 transition shrink-0">شارك برأيك</Link>
                  ) : (
                    <span className="text-xs font-semibold bg-ruwad-gray/40 text-ruwad-navy/60 px-3 py-1.5 rounded-full shrink-0">متوقف حالياً</span>
                  )}
                </div>
              )
            })()}
          </div>
        )
      })}
    </div>
  )
}
