import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ExportCsvButton } from '@/components/shared/ExportCsvButton'
import { Trophy, CheckCircle2, XCircle } from 'lucide-react'

const MEDALS = ['🥇', '🥈', '🥉']

export default async function ChallengeResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!challenge) notFound()

  if (challenge.challenge_type === 'sprint') {
    const { data: runs } = await supabase
      .from('challenge_runs')
      .select('*, student:profiles(full_name, avatar_url)')
      .eq('challenge_id', id)
      .order('correct_count', { ascending: false })
      .order('wrong_count', { ascending: true })

    const list = runs ?? []

    return (
      <>
        <Header title={`ترتيب: ${challenge.title}`} />
        <main className="p-6 flex flex-col gap-6">
          <div className="bg-ruwad-lime rounded-ruwad shadow-ruwad p-8 flex flex-col items-center gap-2 text-center">
            <Trophy size={48} className="text-ruwad-navy" />
            <h2 className="text-2xl font-bold text-ruwad-navy">لوحة المتصدّرين — سباق الإجابات</h2>
            <p className="text-ruwad-navy/70">{list.length} مشارك</p>
          </div>

          <div className="flex justify-end">
            <ExportCsvButton
              fileName={`نتائج-${challenge.title}`}
              headers={['الطالب', 'إجابات صحيحة', 'إجابات خاطئة', 'الحالة']}
              rows={list.map((run) => [run.student?.full_name ?? 'طالب', run.correct_count, run.wrong_count, run.finished ? 'أنهى السباق' : 'لم يبدأ بعد'])}
            />
          </div>

          {list.length === 0 ? (
            <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/60">
              لا توجد مشاركات بعد.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {list.map((run, idx) => (
                <div
                  key={run.id}
                  className={`flex items-center gap-4 p-5 rounded-ruwad shadow-card ${
                    idx === 0 ? 'bg-ruwad-lime border-2 border-ruwad-lime' : 'bg-white'
                  }`}
                >
                  <span className="text-2xl font-bold w-10 text-center shrink-0">
                    {MEDALS[idx] ?? idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-ruwad-navy text-white flex items-center justify-center font-bold shrink-0">
                    {run.student?.full_name?.charAt(0) ?? '؟'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ruwad-navy truncate">{run.student?.full_name ?? 'طالب'}</p>
                    <p className="text-xs text-ruwad-navy/60">{run.finished ? 'أنهى السباق' : 'لم يبدأ بعد'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1 text-ruwad-lime font-bold">
                      <CheckCircle2 size={16} /> {run.correct_count}
                    </span>
                    <span className="flex items-center gap-1 text-red-400 font-bold">
                      <XCircle size={16} /> {run.wrong_count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </>
    )
  }

  const { data: submissions } = await supabase
    .from('challenge_submissions')
    .select('*, student:profiles(full_name, avatar_url)')
    .eq('challenge_id', id)
    .order('score', { ascending: false })

  const list = submissions ?? []

  return (
    <>
      <Header title={`ترتيب: ${challenge.title}`} />
      <main className="p-6 flex flex-col gap-6">
        <div className="bg-ruwad-lime rounded-ruwad shadow-ruwad p-8 flex flex-col items-center gap-2 text-center">
          <Trophy size={48} className="text-ruwad-navy" />
          <h2 className="text-2xl font-bold text-ruwad-navy">لوحة المتصدّرين</h2>
          <p className="text-ruwad-navy/70">{list.length} مشارك</p>
        </div>

        <div className="flex justify-end">
          <ExportCsvButton
            fileName={`نتائج-${challenge.title}`}
            headers={['الطالب', 'الدرجة', 'من', 'النسبة']}
            rows={list.map((sub) => [sub.student?.full_name ?? 'طالب', sub.score ?? 0, challenge.total_marks, `${sub.percentage ?? 0}%`])}
          />
        </div>

        {list.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/60">
            لا توجد مشاركات بعد.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((sub, idx) => (
              <div
                key={sub.id}
                className={`flex items-center gap-4 p-5 rounded-ruwad shadow-card ${
                  idx === 0 ? 'bg-ruwad-lime border-2 border-ruwad-lime' : 'bg-white'
                }`}
              >
                <span className="text-2xl font-bold w-10 text-center shrink-0">
                  {MEDALS[idx] ?? idx + 1}
                </span>
                <div className="w-10 h-10 rounded-full bg-ruwad-navy text-white flex items-center justify-center font-bold shrink-0">
                  {sub.student?.full_name?.charAt(0) ?? '؟'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ruwad-navy truncate">{sub.student?.full_name ?? 'طالب'}</p>
                  <p className="text-xs text-ruwad-navy/60">{sub.percentage}%</p>
                </div>
                <p className="text-xl font-bold text-ruwad-navy shrink-0">{sub.score}/{challenge.total_marks}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

