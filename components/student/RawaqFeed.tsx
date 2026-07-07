'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrainerPost, PostCardType } from '@/lib/types'
import { Building2, BookOpen, FileText, FileCheck, Trophy, ClipboardList, CheckCircle2, Clock, Zap, Award } from 'lucide-react'
import { PostLikeButton } from '@/components/shared/PostLikeButton'
import { StoryShareButton } from '@/components/shared/StoryShareButton'

interface CourseCard { id: string; title: string; description: string | null; course_code: string; status: string }
interface ExamCard { id: string; title: string; description: string | null; exam_code: string; is_active: boolean }
interface AssignmentCard { id: string; title: string; description: string | null; assignment_code: string; is_active: boolean; due_date: string | null }
interface ChallengeCard { id: string; title: string; description: string | null }
interface SurveyCard { id: string; title: string; description: string | null; share_token: string; is_active: boolean }
interface CertificateCard { id: string; certificate_code: string; score: number; student?: { full_name: string }; course?: { title: string } }

const CARD_TYPE_LABELS: Record<string, string> = {
  course: '📚 كورس جديد', exam: '📝 امتحان', assignment: '✅ واجب', challenge: '🏆 تحدٍ', survey: '📋 استبيان', certificate: '🎓 شهادة إتمام',
}

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
  likedPostIds,
  likeCounts,
}: {
  posts: TrainerPost[]
  cardData: Record<string, Partial<Record<PostCardType, any>>>
  enrolledCourseIds: string[]
  activeChallengeSessions: Record<string, { session_code: string } | null>
  likedPostIds: string[]
  likeCounts: Record<string, number>
}) {
  const [enrolled, setEnrolled] = useState(new Set(enrolledCourseIds))
  const [pending, setPending] = useState(new Set<string>())
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const likedSet = new Set(likedPostIds)
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
        const profileHref = post.institute_id ? `/i/${post.institute_id}` : `/t/${post.trainer_id}`
        const name = post.institute_id ? (post.institute?.name ?? 'معهد') : (post.trainer?.full_name ?? 'مدرّب')
        return (
          <div key={post.id} className="relative overflow-hidden bg-white rounded-ruwad shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
            <div className={`absolute top-0 right-0 left-0 h-1.5 ${post.institute_id ? 'bg-ruwad-dark' : 'bg-ruwad-gradient'}`} />
            <Link href={profileHref} className="flex items-center gap-2.5 group">
              <span
                className={`w-11 h-11 rounded-full text-white flex items-center justify-center shrink-0 font-bold shadow-ruwad group-hover:scale-105 transition-transform ${
                  post.institute_id ? 'bg-ruwad-dark' : 'bg-ruwad-gradient'
                }`}
              >
                {post.institute_id ? <Building2 size={18} /> : name.charAt(0)}
              </span>
              <div>
                <p className="font-bold text-ruwad-navy text-sm group-hover:text-ruwad-blue transition-colors">{name}</p>
                <p className="text-xs text-ruwad-navy/40">{timeAgo(post.created_at)}</p>
              </div>
            </Link>

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
                <div className="rounded-ruwad-sm border-2 border-ruwad-blue-light/30 bg-ruwad-blue-light/10 p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={18} className="text-ruwad-blue-light shrink-0" />
                    <p className="font-bold text-ruwad-navy truncate">{e.title}</p>
                  </div>
                  {e.is_active ? (
                    <Link href={`/qr/${e.exam_code}`} className="text-xs font-semibold bg-ruwad-blue-light text-white px-4 py-1.5 rounded-full hover:opacity-90 transition shrink-0">ابدأ الامتحان</Link>
                  ) : (
                    <span className="text-xs font-semibold bg-ruwad-gray/40 text-ruwad-navy/60 px-3 py-1.5 rounded-full shrink-0">متوقف حالياً</span>
                  )}
                </div>
              )
            })()}

            {post.card_type === 'assignment' && card && (() => {
              const a = card as AssignmentCard
              return (
                <div className="rounded-ruwad-sm border-2 border-ruwad-navy/15 bg-ruwad-navy/5 p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCheck size={18} className="text-ruwad-navy shrink-0" />
                    <p className="font-bold text-ruwad-navy truncate">{a.title}</p>
                  </div>
                  {a.is_active ? (
                    <Link href={`/qr/${a.assignment_code}`} className="text-xs font-semibold bg-ruwad-navy text-white px-4 py-1.5 rounded-full hover:opacity-90 transition shrink-0">عرض الواجب</Link>
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

            {post.card_type === 'certificate' && card && (() => {
              const c = card as CertificateCard
              return (
                <div className="rounded-ruwad-sm border-2 border-ruwad-lime bg-gradient-to-l from-ruwad-lime/20 to-white p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Award size={20} className="text-ruwad-navy shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-ruwad-navy truncate">{c.course?.title ?? 'شهادة إتمام'}</p>
                      <p className="text-xs text-ruwad-navy/50">النتيجة: {c.score}%</p>
                    </div>
                  </div>
                  <Link href={`/certificates/verify/${c.certificate_code}`} className="text-xs font-semibold bg-ruwad-navy text-white px-4 py-1.5 rounded-full hover:opacity-90 transition shrink-0">تحقق من الشهادة</Link>
                </div>
              )
            })()}

            <div className="flex items-center justify-between -mx-1 pt-1 border-t border-ruwad-gray/30 mt-1">
              <PostLikeButton postId={post.id} initialLiked={likedSet.has(post.id)} initialCount={likeCounts[post.id] ?? 0} />
              <StoryShareButton
                authorName={name}
                isInstitute={!!post.institute_id}
                content={post.content}
                cardTitle={card?.title ?? null}
                cardTypeLabel={CARD_TYPE_LABELS[post.card_type ?? ''] ?? null}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
