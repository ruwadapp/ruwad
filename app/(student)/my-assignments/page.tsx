import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { FileCheck, CheckCircle2, Clock, AlertTriangle, Award, ListChecks } from 'lucide-react'

export default async function MyAssignmentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const { data: enrollments } = await supabase
    .from('enrollments').select('course_id').eq('student_id', uid).eq('status', 'approved')
  const courseIds = (enrollments ?? []).map((e) => e.course_id)

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('assignment_id, score, graded_at, submitted_at')
    .eq('student_id', uid)

  const submittedIds = (submissions ?? []).map((s) => s.assignment_id)
  const relevantIds = Array.from(new Set(submittedIds))
  const orFilter = courseIds.length
    ? `course_id.in.(${courseIds.join(',')}),id.in.(${relevantIds.length ? relevantIds.join(',') : '00000000-0000-0000-0000-000000000000'})`
    : `id.in.(${relevantIds.length ? relevantIds.join(',') : '00000000-0000-0000-0000-000000000000'})`

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .or(orFilter)
    .order('created_at', { ascending: false })

  const submissionMap = new Map((submissions ?? []).map((s) => [s.assignment_id, s]))
  const now = new Date()

  const gradedSubs = (submissions ?? []).filter((s) => s.graded_at)
  const pendingCount = (assignments ?? []).filter((a) => a.is_active && !submissionMap.has(a.id)).length
  const ACCENTS = ['border-ruwad-blue', 'border-ruwad-lime', 'border-ruwad-navy']

  return (
    <>
      <Header title="واجباتي" />
      <main className="p-6 flex flex-col gap-6">
        {/* ===== هيدر إحصائي متدرّج ===== */}
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-7">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />
          <div className="relative grid grid-cols-3 gap-3">
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <ListChecks size={18} className="text-white mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{assignments?.length ?? 0}</p>
              <p className="text-[11px] text-white/70">واجب</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <Clock size={18} className="text-white mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
              <p className="text-[11px] text-white/70">لم يُسلَّم</p>
            </div>
            <div className="bg-ruwad-lime rounded-ruwad-sm p-4 text-center">
              <Award size={18} className="text-ruwad-navy mx-auto mb-1" />
              <p className="text-2xl font-bold text-ruwad-navy">{gradedSubs.length}</p>
              <p className="text-[11px] text-ruwad-navy/70">مُصحَّح</p>
            </div>
          </div>
        </div>

        {!assignments || assignments.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <FileCheck className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد واجبات حالياً. واجبات كورساتك تظهر هنا تلقائياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.filter((a) => a.is_active || submissionMap.has(a.id)).map((a, idx) => {
              const sub = submissionMap.get(a.id)
              const overdue = a.due_date && !sub && now > new Date(a.due_date)
              const wasLate = sub && a.due_date && new Date(sub.submitted_at) > new Date(a.due_date)

              return (
                <Link
                  key={a.id}
                  href={`/my-assignments/${a.id}`}
                  className={`bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad-lg hover:-translate-y-0.5 transition-all border-t-4 ${
                    sub?.graded_at ? 'border-ruwad-lime' : overdue ? 'border-red-300' : ACCENTS[idx % 3]
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{a.title}</h3>
                    {sub ? <CheckCircle2 size={20} className="text-ruwad-blue shrink-0" /> : <Clock size={20} className="text-ruwad-navy/30 shrink-0" />}
                  </div>
                  <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">{a.description || 'بلا وصف'}</p>

                  {sub ? (
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${
                      sub.graded_at ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-ruwad-gray/40 text-ruwad-navy/60'
                    }`}>
                      {sub.graded_at ? `${sub.score}/${a.total_marks}` : 'بانتظار التصحيح'}
                      {wasLate && <AlertTriangle size={11} className="text-amber-600" />}
                    </span>
                  ) : overdue ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit bg-red-50 text-red-500">
                      <AlertTriangle size={12} /> انتهى الموعد
                    </span>
                  ) : (
                    <span className="text-xs text-ruwad-navy/50">
                      {a.due_date ? `الموعد: ${new Date(a.due_date).toLocaleDateString('ar')}` : 'بلا موعد محدد'}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
