import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ArrowLeft } from 'lucide-react'

export default async function InstituteTrainersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user!.id).single()

  if (!institute) {
    return (
      <>
        <Header title="المدربون" />
        <main className="p-6">
          <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">لم يتم العثور على معهد مرتبط بحسابك.</div>
        </main>
      </>
    )
  }

  const { data: members } = await supabase
    .from('institute_members')
    .select('user_id, member:profiles!user_id(full_name, created_at)')
    .eq('institute_id', institute.id)
    .eq('member_role', 'trainer')
    .eq('status', 'approved')

  const trainerIds = (members ?? []).map((m) => m.user_id)

  const [{ data: courses }, { data: exams }] = await Promise.all([
    trainerIds.length ? supabase.from('courses').select('id, trainer_id').in('trainer_id', trainerIds) : Promise.resolve({ data: [] }),
    trainerIds.length ? supabase.from('exams').select('id, trainer_id').in('trainer_id', trainerIds) : Promise.resolve({ data: [] }),
  ])

  const courseIds = (courses ?? []).map((c) => c.id)
  const { data: enrollments } = courseIds.length
    ? await supabase.from('enrollments').select('student_id, course_id').in('course_id', courseIds).eq('status', 'approved')
    : { data: [] }

  const courseToTrainer = new Map((courses ?? []).map((c) => [c.id, c.trainer_id]))

  return (
    <>
      <Header title="المدربون" />
      <main className="p-6">
        {!members || members.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/60">
            لا يوجد مدربون في معهدك بعد. أضفهم من صفحة "الأعضاء".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => {
              const trainerName = (m.member as unknown as { full_name?: string; created_at?: string })?.full_name ?? 'مدرب'
              const trainerCourses = (courses ?? []).filter((c) => c.trainer_id === m.user_id)
              const trainerExams = (exams ?? []).filter((e) => e.trainer_id === m.user_id)
              const studentSet = new Set(
                (enrollments ?? []).filter((e) => courseToTrainer.get(e.course_id) === m.user_id).map((e) => e.student_id)
              )

              return (
                <Link
                  key={m.user_id}
                  href={`/org/trainers/${m.user_id}`}
                  className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 hover:shadow-ruwad-lg transition relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-ruwad-gradient text-white flex items-center justify-center font-bold text-lg shrink-0">
                      {trainerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-ruwad-navy truncate">{trainerName}</p>
                      <p className="text-xs text-ruwad-navy/50">مدرّب</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-ruwad-gray/20 rounded-ruwad-sm py-2.5">
                      <p className="text-lg font-bold text-ruwad-navy">{trainerCourses.length}</p>
                      <p className="text-[11px] text-ruwad-navy/50">كورس</p>
                    </div>
                    <div className="bg-ruwad-gray/20 rounded-ruwad-sm py-2.5">
                      <p className="text-lg font-bold text-ruwad-navy">{trainerExams.length}</p>
                      <p className="text-[11px] text-ruwad-navy/50">امتحان</p>
                    </div>
                    <div className="bg-ruwad-lime/30 rounded-ruwad-sm py-2.5">
                      <p className="text-lg font-bold text-ruwad-navy">{studentSet.size}</p>
                      <p className="text-[11px] text-ruwad-navy/50">طالب</p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-blue">
                    عرض التفاصيل <ArrowLeft size={15} />
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
