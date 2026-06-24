import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ChallengeTaker } from '@/components/student/ChallengeTaker'
import { Trophy } from 'lucide-react'

export default async function TakeChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!challenge) notFound()

  const { data: existingSubmission } = await supabase
    .from('challenge_submissions')
    .select('*')
    .eq('challenge_id', id)
    .eq('student_id', user!.id)
    .maybeSingle()

  if (existingSubmission) {
    return (
      <>
        <Header title={challenge.title} />
        <main className="p-6">
          <div className="bg-ruwad-lime rounded-ruwad shadow-ruwad-lg p-10 flex flex-col items-center gap-4 text-center max-w-md mx-auto">
            <Trophy size={56} className="text-ruwad-navy" />
            <h2 className="text-xl font-bold text-ruwad-navy">لقد أكملت هذا التحدي</h2>
            <p className="text-4xl font-bold text-ruwad-navy">{existingSubmission.score}/{challenge.total_marks}</p>
            <p className="text-ruwad-navy/70">{existingSubmission.percentage}%</p>
          </div>
        </main>
      </>
    )
  }

  const { data: questions } = await supabase
    .from('challenge_questions')
    .select('*')
    .eq('challenge_id', id)
    .order('order_index', { ascending: true })

  return (
    <>
      <Header title={challenge.title} />
      <main className="p-6">
        {challenge.instructions && (
          <div className="bg-ruwad-lime/20 rounded-ruwad p-4 mb-4 text-sm text-ruwad-navy">{challenge.instructions}</div>
        )}
        <ChallengeTaker challenge={challenge} questions={questions ?? []} />
      </main>
    </>
  )
}
