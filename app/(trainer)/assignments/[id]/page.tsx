import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { SubmissionsGrader } from '@/components/trainer/SubmissionsGrader'
import { AssignmentForm } from '@/components/trainer/AssignmentForm'
import { DeleteButton } from '@/components/shared/DeleteButton'

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: assignment }, { data: courses }] = await Promise.all([
    supabase.from('assignments').select('*').eq('id', id).eq('trainer_id', user!.id).single(),
    supabase.from('courses').select('*').eq('trainer_id', user!.id),
  ])

  if (!assignment) notFound()

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('*, student:profiles!student_id(full_name, avatar_url)')
    .eq('assignment_id', id)
    .order('submitted_at', { ascending: false })

  return (
    <>
      <Header title={assignment.title} />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end">
          <DeleteButton table="assignments" id={id} redirectTo="/assignments" label="حذف الواجب" />
        </div>

        <AssignmentForm initialAssignment={assignment} courses={courses ?? []} />

        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">التسليمات ({submissions?.length ?? 0})</h2>
          <SubmissionsGrader submissions={submissions ?? []} totalMarks={assignment.total_marks} />
        </div>
      </main>
    </>
  )
}
