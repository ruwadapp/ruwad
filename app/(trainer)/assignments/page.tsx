import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { Plus, FileCheck, Users, Pencil, Clock, CheckCircle2 } from 'lucide-react'

export default async function AssignmentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, assignment_submissions(count)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  const assignmentIds = (assignments ?? []).map((a) => a.id)
  const { data: ungraded } = assignmentIds.length
    ? await supabase.from('assignment_submissions').select('id').in('assignment_id', assignmentIds).is('graded_at', null)
    : { data: [] }

  const totalSubmissions = (assignments ?? []).reduce((sum, a) => sum + (a.assignment_submissions?.[0]?.count ?? 0), 0)
  const ACCENTS = ['border-ruwad-blue', 'border-ruwad-lime', 'border-ruwad-navy']

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((a, idx) => {
              const subCount = a.assignment_submissions?.[0]?.count ?? 0
              return (
                <div key={a.id} className={`bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad-lg hover:-translate-y-0.5 transition-all border-t-4 ${ACCENTS[idx % 3]}`}>
                  <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{a.title}</h3>
                  <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">{a.description || 'بلا وصف'}</p>
                  <div className="flex items-center justify-between text-sm text-ruwad-navy/50 bg-ruwad-gray/10 rounded-ruwad-sm px-3 py-2">
                    <span className="flex items-center gap-1.5">
                      <Users size={16} className="text-ruwad-blue" /> {subCount} تسليم
                    </span>
                    {a.due_date && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} /> {new Date(a.due_date).toLocaleDateString('ar')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 pt-3 border-t border-ruwad-gray/40">
                    <Link href={`/assignments/${a.id}`} className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-ruwad-blue hover:bg-ruwad-blue/10 px-3 py-2 rounded-ruwad-sm transition">
                      <Pencil size={15} /> تعديل / تصحيح
                    </Link>
                    <DeleteButton table="assignments" id={a.id} label="حذف" confirmText="حذف الواجب سيحذف معه كل تسليمات الطلاب فيه نهائياً. متابعة؟" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
