import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { FollowButton } from '@/components/shared/FollowButton'
import { RatingsSummary } from '@/components/shared/RatingsSummary'
import { RatingForm } from '@/components/shared/RatingForm'
import { BookOpen, Users, GraduationCap } from 'lucide-react'

export default async function PublicTrainerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: viewerProfile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const [{ data: trainerRows }, { data: statsRows }, { data: ratingsRaw }, { data: follows }] = await Promise.all([
    supabase.rpc('get_public_trainer_profile', { p_trainer_id: id }),
    supabase.rpc('get_trainer_public_stats', { p_trainer_id: id }),
    supabase.from('trainer_ratings').select('*').eq('trainer_id', id).order('created_at', { ascending: false }),
    supabase.from('trainer_follows').select('id').eq('trainer_id', id).eq('student_id', user!.id).maybeSingle(),
  ])

  const trainer = trainerRows?.[0]
  if (!trainer) notFound()
  const stats = statsRows?.[0] ?? { courses_count: 0, students_count: 0 }

  const raterIds = [...new Set((ratingsRaw ?? []).map((r) => r.rater_id))]
  const { data: raterProfiles } = raterIds.length ? await supabase.rpc('get_public_rater_names', { p_rater_ids: raterIds }) : { data: [] }
  const raterNameMap = new Map((raterProfiles ?? []).map((r: any) => [r.id, r.full_name]))
  const ratings = (ratingsRaw ?? []).map((r) => ({ ...r, rater_name: raterNameMap.get(r.rater_id) ?? 'مستخدم' }))

  const myRating = user ? (ratingsRaw ?? []).find((r) => r.rater_id === user.id) : undefined
  const canRateAsStudent = viewerProfile?.role === 'student'
  const canRateAsInstitute = viewerProfile?.role === 'institute_admin'

  return (
    <>
      <Header title={trainer.full_name} />
      <main className="p-6 flex flex-col gap-6 max-w-3xl">
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-8">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />

          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur text-white flex items-center justify-center font-bold text-3xl shrink-0">
                {trainer.full_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2"><GraduationCap size={20} /> {trainer.full_name}</h2>
                <p className="text-sm text-white/70 mt-1">مدرب في رُوّاد منذ {new Date(trainer.created_at).toLocaleDateString('ar')}</p>
              </div>
            </div>
            {viewerProfile?.role === 'student' && (
              <FollowButton targetType="trainer" targetId={id} initialFollowing={!!follows} />
            )}
          </div>

          {trainer.bio && <p className="relative text-white/90 text-sm mt-5 leading-relaxed bg-white/10 backdrop-blur rounded-ruwad-sm p-4">{trainer.bio}</p>}

          <div className="relative grid grid-cols-2 gap-3 mt-5">
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <BookOpen size={18} className="text-white mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.courses_count}</p>
              <p className="text-[11px] text-white/70">كورس يديره</p>
            </div>
            <div className="bg-ruwad-lime rounded-ruwad-sm p-4 text-center">
              <Users size={18} className="text-ruwad-navy mx-auto mb-1" />
              <p className="text-2xl font-bold text-ruwad-navy">{stats.students_count}</p>
              <p className="text-[11px] text-ruwad-navy/70">طالب</p>
            </div>
          </div>
        </div>

        {(canRateAsStudent || canRateAsInstitute) && (
          <RatingForm
            target="trainer"
            targetId={id}
            raterRole={canRateAsInstitute ? 'institute' : 'student'}
            initialScore={myRating?.score ?? 0}
            initialComment={myRating?.comment ?? ''}
            ineligibleMessage={
              canRateAsInstitute
                ? 'يمكن لمعهدك تقييم هذا المدرب فقط إذا كان عضواً موافَقاً عليه لديك.'
                : 'يمكنك تقييم هذا المدرب فقط إذا كنت مسجَّلاً (بشكل معتمد) في أحد كورساته.'
            }
          />
        )}

        <RatingsSummary ratings={ratings} />
      </main>
    </>
  )
}
