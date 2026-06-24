import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Zap, Trophy, CheckCircle2 } from 'lucide-react'

export default async function MyChallengesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const { data: submissions } = await supabase
    .from('challenge_submissions')
    .select('challenge_id, score, percentage')
    .eq('student_id', user!.id)

  const submissionMap = new Map((submissions ?? []).map((s) => [s.challenge_id, s]))

  return (
    <>
      <Header title="التحديات" />
      <main className="p-6 flex flex-col gap-6">
        <div className="bg-ruwad-lime rounded-ruwad shadow-ruwad p-6 flex items-center gap-3">
          <Trophy size={32} className="text-ruwad-navy" />
          <div>
            <h2 className="font-bold text-ruwad-navy text-lg">جاهز للتحدي؟</h2>
            <p className="text-sm text-ruwad-navy/70">أكمل التحديات بأعلى نقاط وتصدّر القائمة</p>
          </div>
        </div>

        {!challenges || challenges.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <Zap className="mx-auto text-ruwad-lime mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد تحديات متاحة حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((c) => {
              const sub = submissionMap.get(c.id)
              return (
                <Link
                  key={c.id}
                  href={`/my-challenges/${c.id}`}
                  className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad-lg transition border-t-4 border-ruwad-lime"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{c.title}</h3>
                    {sub && <CheckCircle2 size={20} className="text-ruwad-navy shrink-0" />}
                  </div>
                  <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">{c.description || 'بلا وصف'}</p>
                  {sub ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full w-fit bg-ruwad-lime text-ruwad-navy">
                      {sub.score}/{c.total_marks} ({sub.percentage}%)
                    </span>
                  ) : (
                    <span className="text-xs text-ruwad-navy/50">
                      {c.time_limit_minutes ? `${c.time_limit_minutes} دقيقة` : 'بلا حد زمني'}
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
