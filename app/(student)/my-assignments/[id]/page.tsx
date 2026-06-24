import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AssignmentSubmitForm } from '@/components/student/AssignmentSubmitForm'
import { CheckCircle2 } from 'lucide-react'

export default async function StudentAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignment } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!assignment) notFound()

  const { data: submission } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', id)
    .eq('student_id', user!.id)
    .maybeSingle()

  return (
    <>
      <Header title={assignment.title} />
      <main className="p-6 flex flex-col gap-6">
        <div className="bg-white rounded-ruwad shadow-card p-6">
          <p className="text-ruwad-navy/70">{assignment.description}</p>
          {assignment.instructions && (
            <div className="bg-ruwad-blue/5 rounded-ruwad-sm p-3 mt-3 text-sm text-ruwad-navy">{assignment.instructions}</div>
          )}
          <div className="flex items-center gap-4 text-sm text-ruwad-navy/50 mt-3">
            <span>الدرجة الكاملة: {assignment.total_marks}</span>
            {assignment.due_date && <span>آخر موعد: {new Date(assignment.due_date).toLocaleDateString('ar')}</span>}
          </div>
        </div>

        {submission ? (
          <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-ruwad-blue">
              <CheckCircle2 size={20} />
              <span className="font-semibold">تم تسليم الواجب</span>
            </div>
            {submission.content && (
              <div className="bg-ruwad-gray/20 rounded-ruwad-sm p-3">
                <p className="text-sm text-ruwad-navy whitespace-pre-wrap">{submission.content}</p>
              </div>
            )}
            {submission.graded_at ? (
              <div className="bg-ruwad-lime/20 rounded-ruwad-sm p-4">
                <p className="font-bold text-ruwad-navy">الدرجة: {submission.score}/{assignment.total_marks}</p>
                {submission.feedback && <p className="text-sm text-ruwad-navy/70 mt-2">{submission.feedback}</p>}
              </div>
            ) : (
              <p className="text-sm text-ruwad-navy/50">بانتظار تصحيح المدرب.</p>
            )}
          </div>
        ) : (
          <AssignmentSubmitForm assignmentId={id} />
        )}
      </main>
    </>
  )
}
