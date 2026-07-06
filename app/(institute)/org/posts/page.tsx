import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { PostComposer } from '@/components/trainer/PostComposer'
import { TrainerPostsList } from '@/components/trainer/TrainerPostsList'
import { Users } from 'lucide-react'

export default async function InstitutePostsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user!.id).single()
  if (!institute) redirect('/org/dashboard')

  const [
    { data: posts },
    { data: shares },
    { data: surveys },
    { count: followersCount },
  ] = await Promise.all([
    supabase.from('trainer_posts').select('*').eq('institute_id', institute.id).order('created_at', { ascending: false }),
    supabase.from('resource_institute_shares').select('resource_type, resource_id').eq('institute_id', institute.id),
    supabase.from('surveys').select('id, title').eq('institute_id', institute.id).order('created_at', { ascending: false }),
    supabase.from('trainer_follows').select('id', { count: 'exact', head: true }).eq('institute_id', institute.id),
  ])

  const idsByType: Record<string, string[]> = { courses: [], exams: [], assignments: [], challenges: [] }
  for (const s of shares ?? []) idsByType[s.resource_type]?.push(s.resource_id)

  const [{ data: courses }, { data: exams }, { data: assignments }, { data: challenges }] = await Promise.all([
    idsByType.courses.length ? supabase.from('courses').select('id, title').in('id', idsByType.courses) : Promise.resolve({ data: [] }),
    idsByType.exams.length ? supabase.from('exams').select('id, title').in('id', idsByType.exams) : Promise.resolve({ data: [] }),
    idsByType.assignments.length ? supabase.from('assignments').select('id, title').in('id', idsByType.assignments) : Promise.resolve({ data: [] }),
    idsByType.challenges.length ? supabase.from('challenges').select('id, title').in('id', idsByType.challenges) : Promise.resolve({ data: [] }),
  ])

  return (
    <>
      <Header title="منشورات المعهد" />
      <main className="p-6 flex flex-col gap-6 max-w-2xl">
        <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-5 flex items-center gap-3 text-white">
          <Users size={24} />
          <div>
            <p className="text-sm opacity-80">متابعو المعهد في الرواق</p>
            <p className="text-2xl font-bold">{followersCount ?? 0}</p>
          </div>
        </div>

        <p className="text-sm text-ruwad-navy/60">
          تظهر منشورات المعهد في "الرواق" لدى الطلاب الذين يتابعونه. يمكنك كتابة تحديث نصّي، أو إرفاقه ببطاقة
          كورس/امتحان/واجب/تحدٍ من التي شاركها معك المدربون، أو باستبيان من استبيانات المعهد.
        </p>

        <PostComposer
          instituteId={institute.id}
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
