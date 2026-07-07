import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ChallengeSubmissionForm } from '@/components/student/ChallengeSubmissionForm'

export default async function StudentChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await supabase.from('challenges').select('*').eq('id', id).single()
  if (!challenge || challenge.challenge_type === 'quiz') notFound()

  const { data: existing } = await supabase
    .from('challenge_submissions')
    .select('submission_text, submission_file_url, score, feedback, graded_at')
    .eq('challenge_id', id)
    .eq('student_id', user!.id)
    .maybeSingle()

  return (
    <>
      <Header title={challenge.title} />
      <main className="p-6 flex flex-col gap-6 max-w-2xl">
        <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-2">
          <h2 className="text-lg font-bold text-ruwad-navy">{challenge.title}</h2>
          {challenge.description && <p className="text-sm text-ruwad-navy/60">{challenge.description}</p>}
          {challenge.instructions && (
            <div className="bg-ruwad-gray/10 rounded-ruwad-sm p-3 text-sm text-ruwad-navy/70 mt-2">{challenge.instructions}</div>
          )}
        </div>

        <ChallengeSubmissionForm
          challengeId={id}
          challengeType={challenge.challenge_type as 'coding' | 'upload' | 'practical'}
          totalMarks={challenge.total_marks}
          existing={existing ?? null}
        />
      </main>
    </>
  )
}
