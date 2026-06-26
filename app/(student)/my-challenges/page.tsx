import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ChallengeCodeJoin } from '@/components/student/ChallengeCodeJoin'
import { Trophy } from 'lucide-react'

export default async function MyChallengesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: submissions } = await supabase
    .from('challenge_submissions')
    .select('score, percentage, submitted_at, challenge:challenges(title)')
    .eq('student_id', user!.id)
    .order('submitted_at', { ascending: false })

  return (
    <>
      <Header title="التحديات" />
      <main className="p-6 flex flex-col gap-6">
        <ChallengeCodeJoin />

        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-ruwad-lime" /> سجل تحدياتي السابقة
          </h2>
          {!submissions || submissions.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-4 text-center">لم تخض أي تحدٍ مباشر بعد.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {submissions.map((s, idx) => {
                const challengeTitle = (s.challenge as unknown as { title?: string } | null)?.title ?? ''
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-ruwad-sm border border-ruwad-gray/60">
                    <div>
                      <p className="font-medium text-ruwad-navy">{challengeTitle}</p>
                      <p className="text-xs text-ruwad-navy/50">{new Date(s.submitted_at).toLocaleDateString('ar')}</p>
                    </div>
                    <span className="text-sm font-bold bg-ruwad-lime/20 text-ruwad-navy px-3 py-1.5 rounded-full">
                      {s.score} نقطة · {s.percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
