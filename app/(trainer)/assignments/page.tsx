import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { EntityCard } from '@/components/shared/EntityCard'
import { getTrainerInstitutes, getResourceSharesMap } from '@/lib/utils/getTrainerInstitutes'
import { Plus, FileCheck, Users, Clock } from 'lucide-react'

export default async function AssignmentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const institutes = await getTrainerInstitutes(supabase, user!.id)

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, assignment_submissions(count)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  const sharesMap = await getResourceSharesMap(supabase, 'assignments', (assignments ?? []).map((a) => a.id))

  const assignmentIds = (assignments ?? []).map((a) => a.id)
  const { data: ungraded } = assignmentIds.length
    ? await supabase.from('assignment_submissions').select('id').in('assignment_id', assignmentIds).is('graded_at', null)
    : { data: [] }

  const totalSubmissions = (assignments ?? []).reduce((sum, a) => sum + (a.assignment_submissions?.[0]?.count ?? 0), 0)

  return (
    <>
      <Header title="الوظائف" />
      <main className="p-6 flex flex-col gap-6">
        {/* ===== هيدر إحصائي متدرّج ===== */}
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-7 flex items-center justify-between flex-wrap gap-4">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />

          <div className="relative grid grid-cols-3 gap-4 flex-1">
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <FileCheck size={18} className="text-white mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{assignments?.length ?? 0}</p>
              <p className="text-[11px] text-white/70">واجب</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <Users size={18} className="text-white mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{totalSubmissions}</p>
              <p className="text-[11px] text-white/70">تسليم</p>
            </div>
            <div className="bg-ruwad-lime rounded-ruwad-sm p-4 text-center">
              <Clock size={18} className="text-ruwad-navy mx-auto mb-1" />
              <p className="text-2xl font-bold text-ruwad-navy">{ungraded?.length ?? 0}</p>
              <p className="text-[11px] text-ruwad-navy/70">بانتظار التصحيح</p>
            </div>
          </div>

          <Link
            href="/assignments/new"
            className="relative bg-white text-ruwad-blue px-5 py-2.5 rounded-ruwad-sm font-bold hover:opacity-90 transition shadow-ruwad flex items-center gap-2 shrink-0"
          >
            <Plus size={18} /> واجب جديد
          </Link>
        </div>

        {!assignments || assignments.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <FileCheck className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد واجبات حتى الآن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {assignments.map((a, idx) => {
              const subCount = a.assignment_submissions?.[0]?.count ?? 0
              return (
                <EntityCard
                  key={a.id}
                  href={`/assignments/${a.id}`}
                  gradient={(['blue', 'navy', 'lime', 'blueReverse'] as const)[idx % 4]}
                  title={a.title}
                  description={a.description}
                  stats={[
                    { icon: 'users', label: `${subCount} تسليم` },
                    ...(a.due_date ? [{ icon: 'clock' as const, label: new Date(a.due_date).toLocaleDateString('ar') }] : []),
                  ]}
                  shareCode={a.assignment_code}
                  deleteTable="assignments"
                  deleteId={a.id}
                  deleteConfirmText="حذف الواجب سيحذف معه كل تسليمات الطلاب فيه نهائياً. متابعة؟"
                  instituteShare={{ resourceType: 'assignments', institutes, sharedInstituteIds: sharesMap[a.id] ?? [] }}
                />
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
