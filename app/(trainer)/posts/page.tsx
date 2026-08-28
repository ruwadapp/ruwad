import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { PostComposer } from '@/components/trainer/PostComposer'
import { TrainerPostsList } from '@/components/trainer/TrainerPostsList'
import { SocialLayout, ProfileCard } from '@/components/shared/SocialLayout'
import { Lightbulb } from 'lucide-react'

export default async function TrainerPostsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [
    { data: profile },
    { data: posts },
    { data: courses },
    { data: exams },
    { data: assignments },
    { data: challenges },
    { data: surveys },
    { count: followersCount },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url').eq('id', uid).single(),
    supabase.from('trainer_posts').select('*').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('courses').select('id, title').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('exams').select('id, title').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('assignments').select('id, title').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('challenges').select('id, title').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('surveys').select('id, title').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('trainer_follows').select('id', { count: 'exact', head: true }).eq('trainer_id', uid),
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
      <Header title="منشوراتي" />
      <SocialLayout
        aside={
          <>
            <ProfileCard
              name={profile?.full_name ?? 'مدرب'}
              role="مدرب"
              avatarUrl={profile?.avatar_url}
              stats={[
                { label: 'متابِع', value: followersCount ?? 0 },
                { label: 'منشور', value: posts?.length ?? 0 },
                { label: 'كورس', value: courses?.length ?? 0 },
              ]}
            />
            <div className="bg-white rounded-ruwad shadow-card p-5 text-xs text-ruwad-navy/60 leading-relaxed">
              <p className="flex items-center gap-1.5 font-bold text-ruwad-navy text-sm mb-2">
                <Lightbulb size={15} className="text-ruwad-lime" style={{ fill: '#E3FF3B' }} /> كيف يعمل الرواق؟
              </p>
              تظهر منشوراتك لدى الطلاب الذين يتابعونك. اكتب تحديثاً نصّياً، أو أرفقه ببطاقة كورس/امتحان/واجب/تحدٍ/استبيان
              يستطيع الطالب المشاركة فيه بضغطة واحدة.
            </div>
          </>
        }
      >
        <PostComposer
          courses={courses ?? []}
          exams={exams ?? []}
          assignments={assignments ?? []}
          challenges={challenges ?? []}
          surveys={surveys ?? []}
        />
        <TrainerPostsList
          posts={posts ?? []}
          authorName={profile?.full_name ?? 'مدرب'}
          authorAvatarUrl={profile?.avatar_url}
          likeCounts={likeCounts}
        />
      </SocialLayout>
    </>
  )
}
