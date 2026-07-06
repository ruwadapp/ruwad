import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { SubmissionsGrader } from '@/components/trainer/SubmissionsGrader'
import { AssignmentForm } from '@/components/trainer/AssignmentForm'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { ShareToggle } from '@/components/shared/ShareToggle'
import { getTrainerInstitute } from '@/lib/utils/getTrainerInstitute'
import { Building2 } from 'lucide-react'

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignment } = await supabase.from('assignments').select('*').eq('id', id).single()
  if (!assignment) notFound()

  const actingAsInstituteAdmin = assignment.trainer_id !== user!.id
  const [{ data: courses }, institute] = await Promise.all([
    supabase.from('courses').select('*').eq('trainer_id', assignment.trainer_id),
    actingAsInstituteAdmin ? Promise.resolve(null) : getTrainerInstitute(supabase, user!.id),
  ])

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('*, student:profiles!student_id(full_name, avatar_url)')
    .eq('assignment_id', id)
    .order('submitted_at', { ascending: false })

  return (
    <>
      <Header title={assignment.title} />
      <main className="p-6 flex flex-col gap-6">
        {actingAsInstituteAdmin && (
          <div className="bg-ruwad-blue/10 text-ruwad-blue text-sm font-semibold rounded-ruwad-sm px-4 py-3 flex items-center gap-2">
            <Building2 size={16} /> تُعدّل هذا الواجب بصفتك مدير المعهد، بما أن المدرب فعّل مشاركته مع المعهد.
          </div>
        )}
        <div className="flex justify-end gap-3 flex-wrap">
          {institute && (
            <ShareToggle table="assignments" id={id} initialShared={assignment.shared_with_institute} instituteName={institute.name} />
          )}
          <DeleteButton table="assignments" id={id} redirectTo="/assignments" label="حذف الواجب" />
        </div>

        <AssignmentForm initialAssignment={assignment} courses={courses ?? []} />

        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">التسليمات ({submissions?.length ?? 0})</h2>
          <SubmissionsGrader submissions={submissions ?? []} totalMarks={assignment.total_marks} dueDate={assignment.due_date} />
        </div>
      </main>
    </>
  )
}

