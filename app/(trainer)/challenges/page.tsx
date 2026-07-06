import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { ShareManager } from '@/components/shared/ShareManager'
import { getTrainerInstitutes, getResourceSharesMap } from '@/lib/utils/getTrainerInstitutes'
import { Plus, Trophy, Zap, Users, Pencil } from 'lucide-react'

export default async function ChallengesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const institutes = await getTrainerInstitutes(supabase, user!.id)

  const { data: challenges } = await supabase
    .from('challenges')
    .select('*, challenge_questions(count), challenge_submissions(count)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  const sharesMap = await getResourceSharesMap(supabase, 'challenges', (challenges ?? []).map((c) => c.id))

  return (
    <>
      <Header title="التحديات" />
      <main className="p-6 flex flex-col gap-6">
        <div className="bg-ruwad-lime rounded-ruwad shadow-ruwad p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy size={32} className="text-ruwad-navy" />
            <div>
              <h2 className="font-bold text-ruwad-navy text-lg">تحدّاهم!</h2>
              <p className="text-sm text-ruwad-navy/70">حفّز طلابك بتحديات تنافسية مع ترتيب فوري</p>
            </div>
          </div>
          <Link
            href="/challenges/new"
            className="bg-ruwad-navy text-white px-5 py-2.5 rounded-ruwad-sm font-bold hover:opacity-90 transition flex items-center gap-2 shrink-0"
          >
            <Plus size={18} /> تحدي جديد
          </Link>
        </div>

        {!challenges || challenges.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <Zap className="mx-auto text-ruwad-lime mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد تحديات حتى الآن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((c) => (
              <div key={c.id} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad-lg transition border-t-4 border-ruwad-lime">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{c.title}</h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    c.is_active ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-ruwad-gray/50 text-ruwad-navy/60'
                  }`}>
                    {c.is_active ? 'نشط' : 'متوقف'}
                  </span>
                </div>
                <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">{c.description || 'بلا وصف'}</p>
                <div className="flex items-center gap-4 text-sm text-ruwad-navy/50">
                  <span className="flex items-center gap-1.5"><Zap size={16} className="text-ruwad-navy/40" /> {c.challenge_questions?.[0]?.count ?? 0} سؤال</span>
                  <span className="flex items-center gap-1.5"><Users size={16} /> {c.challenge_submissions?.[0]?.count ?? 0} مشارك</span>
                </div>

                {!c.course_id && institutes.length > 0 && (
                  <ShareManager resourceType="challenges" resourceId={c.id} institutes={institutes} initialSharedInstituteIds={sharesMap[c.id] ?? []} />
                )}

                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-ruwad-gray/40">
                  <Link href={`/challenges/${c.id}`} className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-ruwad-blue hover:bg-ruwad-blue/10 px-3 py-2 rounded-ruwad-sm transition">
                    <Pencil size={15} /> تعديل
                  </Link>
                  <Link href={`/challenges/${c.id}/results`} className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ruwad-navy hover:bg-ruwad-gray/30 px-3 py-2 rounded-ruwad-sm transition">
                    <Trophy size={15} />
                  </Link>
                  <DeleteButton table="challenges" id={c.id} label="حذف" confirmText="حذف التحدي سيحذف معه كل أسئلته ونتائج المشاركين فيه نهائياً. متابعة؟" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
