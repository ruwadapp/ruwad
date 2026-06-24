import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { FileCheck, CheckCircle2, Clock } from 'lucide-react'

export default async function MyAssignmentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('assignment_id, score, graded_at')
    .eq('student_id', user!.id)

  const submissionMap = new Map((submissions ?? []).map((s) => [s.assignment_id, s]))

  return (
    <>
      <Header title="واجباتي" />
      <main className="p-6">
        {!assignments || assignments.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <FileCheck className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد واجبات حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((a) => {
              const sub = submissionMap.get(a.id)
              return (
                <Link
                  key={a.id}
                  href={`/my-assignments/${a.id}`}
                  className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad transition"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{a.title}</h3>
                    {sub ? <CheckCircle2 size={20} className="text-ruwad-blue shrink-0" /> : <Clock size={20} className="text-ruwad-navy/30 shrink-0" />}
                  </div>
                  <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">{a.description || 'بلا وصف'}</p>
                  {sub ? (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${
                      sub.graded_at ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-ruwad-gray/40 text-ruwad-navy/60'
                    }`}>
                      {sub.graded_at ? `${sub.score}/${a.total_marks}` : 'بانتظار التصحيح'}
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
