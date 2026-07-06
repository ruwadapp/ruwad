import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { FollowButton } from '@/components/shared/FollowButton'
import { AvatarUpload } from '@/components/shared/AvatarUpload'
import { CourseDiscoveryList } from '@/components/shared/CourseDiscoveryList'
import { RatingsSummary } from '@/components/shared/RatingsSummary'
import { RatingForm } from '@/components/shared/RatingForm'
import { BookOpen, Users, GraduationCap } from 'lucide-react'

export default async function PublicTrainerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: viewerProfile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const [{ data: trainerRows }, { data: statsRows }, { data: summaryRows }, { data: myRatingRow }, { data: follows }, { data: courses }] = await Promise.all([
    supabase.rpc('get_public_trainer_profile', { p_trainer_id: id }),
    supabase.rpc('get_trainer_public_stats', { p_trainer_id: id }),
    supabase.rpc('get_trainer_rating_summary', { p_trainer_id: id }),
    supabase.from('trainer_ratings').select('score').eq('trainer_id', id).eq('rater_id', user!.id).maybeSingle(),
    supabase.from('trainer_follows').select('id').eq('trainer_id', id).eq('student_id', user!.id).maybeSingle(),
    supabase.from('courses').select('id, title, description').eq('trainer_id', id).eq('status', 'published'),
  ])

  const trainer = trainerRows?.[0]
  if (!trainer) notFound()
  const stats = statsRows?.[0] ?? { courses_count: 0, students_count: 0 }
  const summary = summaryRows?.[0] ?? { avg_score: 0, rating_count: 0, student_avg: 0, student_count: 0, institute_avg: 0, institute_count: 0 }

  const courseIds = (courses ?? []).map((c) => c.id)
  const { data: myEnrollments } = viewerProfile?.role === 'student' && courseIds.length
    ? await supabase.from('enrollments').select('course_id, status').eq('student_id', user!.id).in('course_id', courseIds)
    : { data: [] }
  const myEnrollmentMap = new Map((myEnrollments ?? []).map((e) => [e.course_id, e.status]))
  const coursesWithStatus = (courses ?? []).map((c) => ({ ...c, myStatus: myEnrollmentMap.get(c.id) ?? null }))

  const isSelf = user!.id === id
  const canRateAsStudent = !isSelf && viewerProfile?.role === 'student'
  const canRateAsInstitute = !isSelf && viewerProfile?.role === 'institute_admin'

  return (
    <>
      <Header title={trainer.full_name} />
      <main className="p-6 flex flex-col gap-6 max-w-3xl">
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-8">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />

          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {isSelf ? (
                <AvatarUpload currentUrl={trainer.avatar_url} fallbackLetter={trainer.full_name.charAt(0)} table="profiles" rowId={id} column="avatar_url" size={80} />
              ) : trainer.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={trainer.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover shadow-ruwad-lg shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur text-white flex items-center justify-center font-bold text-3xl shrink-0">
                  {trainer.full_name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2"><GraduationCap size={20} /> {trainer.full_name}</h2>
                <p className="text-sm text-white/70 mt-1">مدرب في رُوّاد منذ {new Date(trainer.created_at).toLocaleDateString('ar')}</p>
              </div>
            </div>
            {viewerProfile?.role === 'student' && !isSelf && (
              <FollowButton targetType="trainer" targetId={id} initialFollowing={!!follows} />
            )}
          </div>

          {trainer.bio && <p className="relative text-white/90 text-sm mt-5 leading-relaxed bg-white/10 backdrop-blur rounded-ruwad-sm p-4">{trainer.bio}</p>}

          <div className="relative grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <BookOpen size={18} className="text-white mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.courses_count}</p>
              <p className="text-[11px] text-white/70">كورس يديره</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <Users size={18} className="text-white mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.students_count}</p>
              <p className="text-[11px] text-white/70">طالب استفاد من تدريباته</p>
            </div>
            <div className="bg-ruwad-lime rounded-ruwad-sm p-4 text-center">
              <p className="text-2xl font-bold text-ruwad-navy">{Number(summary.avg_score ?? 0).toFixed(1)}</p>
              <p className="text-[11px] text-ruwad-navy/70">التقييم ({summary.rating_count ?? 0})</p>
            </div>
          </div>
        </div>

        {viewerProfile?.role === 'student' && (
          <CourseDiscoveryList courses={coursesWithStatus} emptyText="لا توجد كورسات منشورة لهذا المدرب حالياً." />
        )}

        {(canRateAsStudent || canRateAsInstitute) && (
          <RatingForm
            target="trainer"
            targetId={id}
            raterRole={canRateAsInstitute ? 'institute' : 'student'}
            initialScore={myRatingRow?.score ?? 0}
            ineligibleMessage={
              canRateAsInstitute
                ? 'يمكن لمعهدك تقييم هذا المدرب فقط إذا كان عضواً موافَقاً عليه لديك.'
                : 'يمكنك تقييم هذا المدرب فقط إذا كنت مسجَّلاً (بشكل معتمد) في أحد كورساته.'
            }
          />
        )}

        <RatingsSummary
          avg={Number(summary.avg_score ?? 0)}
          count={summary.rating_count ?? 0}
          byRole={{
            student: { avg: Number(summary.student_avg ?? 0), count: summary.student_count ?? 0 },
            institute: { avg: Number(summary.institute_avg ?? 0), count: summary.institute_count ?? 0 },
          }}
          roleLabels={{ student: 'الطلاب', institute: 'المعاهد' }}
        />
      </main>
    </>
  )
}
