import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { SubmissionsGrader } from '@/components/trainer/SubmissionsGrader'

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignment } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!assignment) notFound()

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('*, student:profiles(full_name, avatar_url)')
    .eq('assignment_id', id)
    .order('submitted_at', { ascending: false })

  return (
    <>
      <Header title={assignment.title} />
      <main className="p-6 flex flex-col gap-6">
        <div className="bg-white rounded-ruwad shadow-card p-6">
          <p className="text-ruwad-navy/70">{assignment.description}</p>
          {assignment.instructions && (
            <div className="bg-ruwad-blue/5 rounded-ruwad-sm p-3 mt-3 text-sm text-ruwad-navy">
              {assignment.instructions}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-ruwad-navy/50 mt-3">
            <span>الدرجة الكاملة: {assignment.total_marks}</span>
            {assignment.due_date && <span>آخر موعد: {new Date(assignment.due_date).toLocaleDateString('ar')}</span>}
          </div>
        </div>

        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">التسليمات ({submissions?.length ?? 0})</h2>
          <SubmissionsGrader submissions={submissions ?? []} totalMarks={assignment.total_marks} />
        </div>
      </main>
    </>
  )
}
