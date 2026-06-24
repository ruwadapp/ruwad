import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Plus, FileCheck, Users } from 'lucide-react'

export default async function AssignmentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, assignment_submissions(count)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="الوظائف" />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end">
          <Link
            href="/assignments/new"
            className="bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad flex items-center gap-2"
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
            {assignments.map((a) => (
              <Link
                key={a.id}
                href={`/assignments/${a.id}`}
                className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad transition"
              >
                <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{a.title}</h3>
                <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">{a.description || 'بلا وصف'}</p>
                <div className="flex items-center justify-between text-sm text-ruwad-navy/50 mt-1">
                  <span className="flex items-center gap-1.5">
                    <Users size={16} /> {a.assignment_submissions?.[0]?.count ?? 0} تسليم
                  </span>
                  {a.due_date && (
                    <span>الموعد: {new Date(a.due_date).toLocaleDateString('ar')}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
