import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { PostComposer } from '@/components/trainer/PostComposer'
import { TrainerPostsList } from '@/components/trainer/TrainerPostsList'
import { SocialLayout, ProfileCard } from '@/components/shared/SocialLayout'
import { Lightbulb } from 'lucide-react'

export default async function InstitutePostsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id, name, logo_url').eq('owner_id', user!.id).single()
  if (!institute) redirect('/org/dashboard')

  const [
    { data: posts },
    { data: shares },
    { data: surveys },
    { count: followersCount },
    { count: trainersCount },
  ] = await Promise.all([
    supabase.from('trainer_posts').select('*').eq('institute_id', institute.id).order('created_at', { ascending: false }),
    supabase.from('resource_institute_shares').select('resource_type, resource_id').eq('institute_id', institute.id),
    supabase.from('surveys').select('id, title').eq('institute_id', institute.id).order('created_at', { ascending: false }),
    supabase.from('trainer_follows').select('id', { count: 'exact', head: true }).eq('institute_id', institute.id),
    supabase.from('institute_members').select('id', { count: 'exact', head: true }).eq('institute_id', institute.id).eq('status', 'approved'),
  ])

  const idsByType: Record<string, string[]> = { courses: [], exams: [], assignments: [], challenges: [] }
  for (const s of shares ?? []) idsByType[s.resource_type]?.push(s.resource_id)

  const [{ data: courses }, { data: exams }, { data: assignments }, { data: challenges }] = await Promise.all([
    idsByType.courses.length ? supabase.from('courses').select('id, title').in('id', idsByType.courses) : Promise.resolve({ data: [] }),
    idsByType.exams.length ? supabase.from('exams').select('id, title').in('id', idsByType.exams) : Promise.resolve({ data: [] }),
    idsByType.assignments.length ? supabase.from('assignments').select('id, title').in('id', idsByType.assignments) : Promise.resolve({ data: [] }),
    idsByType.challenges.length ? supabase.from('challenges').select('id, title').in('id', idsByType.challenges) : Promise.resolve({ data: [] }),
  ])

  // عدّاد الإعجابات لكل منشور
  const likeCounts: Record<string, number> = {}
  const postIds = (posts ?? []).map((p) => p.id)
  if (postIds.length > 0) {
    const { data: likes } = await supabase.from('post_likes').select('post_id').in('post_id', postIds)
    for (const l of likes ?? []) likeCounts[l.post_id] = (likeCounts[l.post_id] ?? 0) + 1
  }

  return (
    <>
      <Header title="منشورات المعهد" />
      <SocialLayout
        aside={
          <>
            <ProfileCard
              name={institute.name ?? 'المعهد'}
              role="معهد تدريبي"
              avatarUrl={institute.logo_url}
              stats={[
                { label: 'متابِع', value: followersCount ?? 0 },
                { label: 'منشور', value: posts?.length ?? 0 },
                { label: 'مدرب', value: trainersCount ?? 0 },
              ]}
            />
            <div className="bg-white rounded-ruwad shadow-card p-5 text-xs text-ruwad-navy/60 leading-relaxed">
              <p className="flex items-center gap-1.5 font-bold text-ruwad-navy text-sm mb-2">
                <Lightbulb size={15} className="text-ruwad-lime" style={{ fill: '#E3FF3B' }} /> كيف يعمل الرواق؟
              </p>
              تظهر منشورات المعهد لدى الطلاب الذين يتابعونه. اكتب تحديثاً نصّياً، أو أرفقه ببطاقة
              كورس/امتحان/واجب/تحدٍ من التي شاركها معك المدربون، أو باستبيان من استبيانات المعهد.
            </div>
          </>
        }
      >
        <PostComposer
          instituteId={institute.id}
          courses={courses ?? []}
          exams={exams ?? []}
          assignments={assignments ?? []}
          challenges={challenges ?? []}
          surveys={surveys ?? []}
        />
        <TrainerPostsList
          posts={posts ?? []}
          authorName={institute.name ?? 'المعهد'}
          authorAvatarUrl={institute.logo_url}
          likeCounts={likeCounts}
        />
      </SocialLayout>
    </>
  )
}
