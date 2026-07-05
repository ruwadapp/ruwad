import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { EntityCard } from '@/components/shared/EntityCard'
import { Plus, FileText, Zap, Award } from 'lucide-react'

export default async function ExamsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: exams } = await supabase
    .from('exams')
    .select('*, questions(count), exam_submissions(count)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  const examIds = (exams ?? []).map((e) => e.id)
  const { data: allSubs } = examIds.length
    ? await supabase.from('exam_submissions').select('exam_id, percentage').in('exam_id', examIds).not('submitted_at', 'is', null)
    : { data: [] }

  const activeCount = (exams ?? []).filter((e) => e.is_active).length
  const totalParticipants = (allSubs ?? []).length
  const avgScore = totalParticipants
    ? Math.round((allSubs ?? []).reduce((sum, s) => sum + (s.percentage ?? 0), 0) / totalParticipants)
    : null


  return (
    <>
      <Header title="الامتحانات" />
      <main className="p-6 flex flex-col gap-6">
        {/* ===== هيدر إحصائي متدرّج ===== */}
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-7 flex items-center justify-between flex-wrap gap-4">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />

          <div className="relative grid grid-cols-3 gap-4 flex-1">
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <FileText size={18} className="text-white mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{exams?.length ?? 0}</p>
              <p className="text-[11px] text-white/70">امتحان</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <Zap size={18} className="text-white mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{activeCount}</p>
              <p className="text-[11px] text-white/70">نشط</p>
            </div>
            <div className="bg-ruwad-lime rounded-ruwad-sm p-4 text-center">
              <Award size={18} className="text-ruwad-navy mx-auto mb-1" />
              <p className="text-2xl font-bold text-ruwad-navy">{avgScore !== null ? `${avgScore}%` : '—'}</p>
              <p className="text-[11px] text-ruwad-navy/70">متوسط الأداء</p>
            </div>
          </div>

          <Link
            href="/exams/new"
            className="relative bg-white text-ruwad-blue px-5 py-2.5 rounded-ruwad-sm font-bold hover:opacity-90 transition shadow-ruwad flex items-center gap-2 shrink-0"
          >
            <Plus size={18} /> امتحان جديد
          </Link>
        </div>

        {!exams || exams.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <FileText className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد امتحانات حتى الآن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {exams.map((exam, idx) => (
              <EntityCard
                key={exam.id}
                href={`/exams/${exam.id}`}
                gradient={(['blue', 'sky', 'navy', 'lime'] as const)[idx % 4]}
                title={exam.title}
                description={exam.description}
                badge={{ text: exam.is_active ? 'نشط' : 'متوقف', active: exam.is_active }}
                stats={[
                  { icon: 'file', label: `${exam.questions?.[0]?.count ?? 0} سؤال` },
                  { icon: 'users', label: `${exam.exam_submissions?.[0]?.count ?? 0} مشارك` },
                ]}
                shareCode={exam.exam_code}
                deleteTable="exams"
                deleteId={exam.id}
                deleteConfirmText="حذف الامتحان سيحذف معه كل أسئلته ونتائج الطلاب فيه نهائياً. متابعة؟"
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
