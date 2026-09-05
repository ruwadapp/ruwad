import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Users2, ChevronLeft, BookOpen } from 'lucide-react'

// فهرس المجموعات: كل كورسات المدرب (وكورسات معهده المشارَكة معه)، بعدد مجموعات كل كورس
export default async function TrainerProjectGroupsIndex() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // كورساتي + كورسات أي معهد أُخوَّل بإدارته (نفس منطق صفحة "تدريبات")
  const [{ data: ownCourses }, { data: managedShares }] = await Promise.all([
    supabase.from('courses').select('id, title, cover_image').eq('trainer_id', user!.id),
    supabase.from('resource_institute_shares')
      .select('course:courses(id, title, cover_image)')
      .eq('resource_type', 'courses')
      .in('institute_id', (await supabase.from('institutes').select('id').eq('owner_id', user!.id)).data?.map((i) => i.id) ?? []),
  ])

  const managedCourses = (managedShares ?? [])
    .map((s) => s.course as unknown as { id: string; title: string; cover_image: string | null } | null)
    .filter((c): c is { id: string; title: string; cover_image: string | null } => !!c)

  const byId = new Map<string, { id: string; title: string; cover_image: string | null }>()
  for (const c of [...(ownCourses ?? []), ...managedCourses]) byId.set(c.id, c)
  const courses = [...byId.values()]

  const { data: groupCounts } = courses.length
    ? await supabase.from('project_groups').select('course_id').in('course_id', courses.map((c) => c.id))
    : { data: [] as { course_id: string }[] }
  const counts = new Map<string, number>()
  for (const g of groupCounts ?? []) counts.set(g.course_id, (counts.get(g.course_id) ?? 0) + 1)

  return (
    <>
      <Header title="المجموعات" />
      <main className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-3">
        <p className="text-sm text-ruwad-navy/55 -mt-2">اختر تدريباً لتنظيم طلابه في مجموعات وتعيين مهام لكل مجموعة.</p>
        {courses.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center flex flex-col items-center gap-3">
            <Users2 size={30} className="text-ruwad-blue/30" />
            <p className="text-sm text-ruwad-navy/50">لا كورسات لديك بعد.</p>
          </div>
        ) : (
          courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}/groups`}
              className="bg-white rounded-ruwad shadow-card p-4 flex items-center gap-3 hover:shadow-ruwad transition">
              {c.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.cover_image} alt="" className="w-12 h-12 rounded-ruwad-sm object-cover shrink-0" />
              ) : (
                <span className="w-12 h-12 rounded-ruwad-sm bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center shrink-0"><BookOpen size={20} /></span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-ruwad-navy truncate">{c.title}</p>
                <p className="text-[11px] font-bold text-ruwad-navy/45 mt-0.5 flex items-center gap-1">
                  <Users2 size={11} /> {counts.get(c.id) ?? 0} مجموعة
                </p>
              </div>
              <ChevronLeft size={16} className="text-ruwad-navy/25 shrink-0" />
            </Link>
          ))
        )}
      </main>
    </>
  )
}
