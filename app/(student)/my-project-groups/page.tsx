import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Users2, ChevronLeft, Star } from 'lucide-react'

// فهرس مجموعاتي: كل تدريب فيه مجموعات من بين تدريباتي، ومجموعتي فيه إن وُجدت
export default async function StudentProjectGroupsIndex() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: enrollments } = await supabase
    .from('enrollments').select('course_id, course:courses(id, title, cover_image)')
    .eq('student_id', user!.id).eq('status', 'approved')

  const courseIds = (enrollments ?? []).map((e) => e.course_id)
  const { data: groups } = courseIds.length
    ? await supabase.from('project_groups')
        .select('id, name, course_id, members:project_group_members(student_id)')
        .in('course_id', courseIds)
    : { data: [] as { id: string; name: string; course_id: string; members: { student_id: string }[] }[] }

  const byCourse = new Map<string, { total: number; mine: string | null }>()
  for (const g of groups ?? []) {
    const entry = byCourse.get(g.course_id) ?? { total: 0, mine: null }
    entry.total++
    if ((g.members as { student_id: string }[]).some((m) => m.student_id === user!.id)) entry.mine = g.name
    byCourse.set(g.course_id, entry)
  }

  const rows = (enrollments ?? [])
    .map((e) => ({ course: e.course as unknown as { id: string; title: string; cover_image: string | null } | null, info: byCourse.get(e.course_id) }))
    .filter((r) => r.course && r.info)

  return (
    <>
      <Header title="المجموعات" />
      <main className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-3">
        {rows.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center flex flex-col items-center gap-3">
            <Users2 size={30} className="text-ruwad-blue/30" />
            <p className="text-sm text-ruwad-navy/50">لا مجموعات في أيٍّ من تدريباتك حتى الآن.</p>
          </div>
        ) : (
          rows.map(({ course, info }) => (
            <Link key={course!.id} href={`/my-courses/${course!.id}/groups`}
              className="bg-white rounded-ruwad shadow-card p-4 flex items-center gap-3 hover:shadow-ruwad transition">
              {course!.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course!.cover_image} alt="" className="w-12 h-12 rounded-ruwad-sm object-cover shrink-0" />
              ) : (
                <span className="w-12 h-12 rounded-ruwad-sm bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center shrink-0"><Users2 size={20} /></span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-ruwad-navy truncate">{course!.title}</p>
                {info!.mine ? (
                  <p className="text-[11px] font-extrabold text-amber-600 mt-0.5 flex items-center gap-1">
                    <Star size={10} className="fill-amber-400 text-amber-400" /> مجموعتك: {info!.mine}
                  </p>
                ) : (
                  <p className="text-[11px] font-bold text-ruwad-navy/45 mt-0.5">{info!.total} مجموعة · لست ضمن أي منها بعد</p>
                )}
              </div>
              <ChevronLeft size={16} className="text-ruwad-navy/25 shrink-0" />
            </Link>
          ))
        )}
      </main>
    </>
  )
}
