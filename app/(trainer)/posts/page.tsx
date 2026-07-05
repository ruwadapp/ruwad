import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { PostComposer } from '@/components/trainer/PostComposer'
import { TrainerPostsList } from '@/components/trainer/TrainerPostsList'
import { Users } from 'lucide-react'

export default async function TrainerPostsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [
    { data: posts },
    { data: courses },
    { data: exams },
    { data: assignments },
    { data: challenges },
    { data: surveys },
    { count: followersCount },
  ] = await Promise.all([
    supabase.from('trainer_posts').select('*').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('courses').select('id, title').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('exams').select('id, title').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('assignments').select('id, title').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('challenges').select('id, title').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('surveys').select('id, title').eq('trainer_id', uid).order('created_at', { ascending: false }),
    supabase.from('trainer_follows').select('id', { count: 'exact', head: true }).eq('trainer_id', uid),
  ])

  return (
    <>
      <Header title="منشوراتي" />
      <main className="p-6 flex flex-col gap-6 max-w-2xl">
        <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-5 flex items-center gap-3 text-white">
          <Users size={24} />
          <div>
            <p className="text-sm opacity-80">متابعوك في الرواق</p>
            <p className="text-2xl font-bold">{followersCount ?? 0}</p>
          </div>
        </div>

        <p className="text-sm text-ruwad-navy/60">
          تظهر منشوراتك في "الرواق" لدى الطلاب الذين يتابعونك. يمكنك كتابة تحديث نصّي، أو إرفاقه ببطاقة كورس/امتحان/واجب/تحدٍ/استبيان يستطيع الطالب المشاركة فيه مباشرة.
        </p>

        <PostComposer
          courses={courses ?? []}
          exams={exams ?? []}
          assignments={assignments ?? []}
          challenges={challenges ?? []}
          surveys={surveys ?? []}
        />

        <TrainerPostsList posts={posts ?? []} />
      </main>
    </>
  )
}
