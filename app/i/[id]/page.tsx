import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { FollowButton } from '@/components/shared/FollowButton'
import { RatingsSummary } from '@/components/shared/RatingsSummary'
import { RatingForm } from '@/components/shared/RatingForm'
import { Building2, Users, GraduationCap } from 'lucide-react'

export default async function PublicInstituteProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: viewerProfile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const [{ data: institute }, { data: statsRows }, { data: ratingsRaw }, { data: follows }] = await Promise.all([
    supabase.from('institutes').select('id, name, description, created_at').eq('id', id).single(),
    supabase.rpc('get_institute_public_stats', { p_institute_id: id }),
    supabase.from('institute_ratings').select('*').eq('institute_id', id).order('created_at', { ascending: false }),
    supabase.from('trainer_follows').select('id').eq('institute_id', id).eq('student_id', user!.id).maybeSingle(),
  ])

  if (!institute) notFound()
  const stats = statsRows?.[0] ?? { trainers_count: 0, students_count: 0 }

  const raterIds = [...new Set((ratingsRaw ?? []).map((r) => r.rater_id))]
  const { data: raterProfiles } = raterIds.length ? await supabase.rpc('get_public_rater_names', { p_rater_ids: raterIds }) : { data: [] }
  const raterNameMap = new Map((raterProfiles ?? []).map((r: any) => [r.id, r.full_name]))
  const ratings = (ratingsRaw ?? []).map((r) => ({ ...r, rater_name: raterNameMap.get(r.rater_id) ?? 'مستخدم' }))

  const myRating = user ? (ratingsRaw ?? []).find((r) => r.rater_id === user.id) : undefined
  const canRateAsStudent = viewerProfile?.role === 'student'
  const canRateAsTrainer = viewerProfile?.role === 'trainer'

  return (
    <>
      <Header title={institute.name} />
      <main className="p-6 flex flex-col gap-6 max-w-3xl">
        <div className="relative overflow-hidden bg-ruwad-dark rounded-ruwad shadow-ruwad-lg p-8">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/10 rounded-full blur-3xl" />

          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center shrink-0">
                <Building2 size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white">{institute.name}</h2>
                <p className="text-sm text-white/60 mt-1">معهد على منصة رُوّاد منذ {new Date(institute.created_at).toLocaleDateString('ar')}</p>
              </div>
            </div>
            {viewerProfile?.role === 'student' && (
              <FollowButton targetType="institute" targetId={id} initialFollowing={!!follows} />
            )}
          </div>

          {institute.description && <p className="relative text-white/80 text-sm mt-5 leading-relaxed bg-white/5 backdrop-blur rounded-ruwad-sm p-4">{institute.description}</p>}

          <div className="relative grid grid-cols-2 gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <GraduationCap size={18} className="text-white mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.trainers_count}</p>
              <p className="text-[11px] text-white/60">مدرب</p>
            </div>
            <div className="bg-ruwad-lime rounded-ruwad-sm p-4 text-center">
              <Users size={18} className="text-ruwad-navy mx-auto mb-1" />
              <p className="text-2xl font-bold text-ruwad-navy">{stats.students_count}</p>
              <p className="text-[11px] text-ruwad-navy/70">طالب</p>
            </div>
          </div>
        </div>

        {(canRateAsStudent || canRateAsTrainer) && (
          <RatingForm
            target="institute"
            targetId={id}
            raterRole={canRateAsTrainer ? 'trainer' : 'student'}
            initialScore={myRating?.score ?? 0}
            initialComment={myRating?.comment ?? ''}
            ineligibleMessage={
              canRateAsTrainer
                ? 'يمكنك تقييم هذا المعهد فقط إذا كنت عضواً موافَقاً عليه فيه.'
                : 'يمكنك تقييم هذا المعهد فقط إذا كنت عضواً فيه أو مسجَّلاً في كورس شارَكه معه أحد المدربين.'
            }
          />
        )}

        <RatingsSummary ratings={ratings} roleFilterLabels={{ student: 'طالب', trainer: 'مدرب' }} />
      </main>
    </>
  )
}
