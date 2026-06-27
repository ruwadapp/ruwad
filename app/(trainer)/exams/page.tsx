import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { Plus, FileText, Users, Pencil, BarChart3, Zap, Award } from 'lucide-react'

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

  const ACCENTS = [
    { border: 'border-ruwad-blue', icon: 'text-ruwad-blue', bg: 'bg-ruwad-blue/5' },
    { border: 'border-ruwad-lime', icon: 'text-ruwad-navy', bg: 'bg-ruwad-lime/10' },
    { border: 'border-ruwad-navy', icon: 'text-ruwad-navy', bg: 'bg-ruwad-navy/5' },
  ]

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam, idx) => {
              const accent = ACCENTS[idx % 3]
              return (
                <div key={exam.id} className={`bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad-lg hover:-translate-y-0.5 transition-all border-t-4 ${accent.border}`}>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{exam.title}</h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                        exam.is_active ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-ruwad-gray/50 text-ruwad-navy/60'
                      }`}
                    >
                      {exam.is_active ? 'نشط' : 'متوقف'}
                    </span>
                  </div>
                  <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">
                    {exam.description || 'بلا وصف'}
                  </p>
                  <div className={`flex items-center gap-4 text-sm text-ruwad-navy/60 rounded-ruwad-sm px-3 py-2 ${accent.bg}`}>
                    <span className="flex items-center gap-1.5">
                      <FileText size={16} className={accent.icon} /> {exam.questions?.[0]?.count ?? 0} سؤال
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={16} className={accent.icon} /> {exam.exam_submissions?.[0]?.count ?? 0} مشارك
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 pt-3 border-t border-ruwad-gray/40">
                    <Link href={`/exams/${exam.id}`} className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-ruwad-blue hover:bg-ruwad-blue/10 px-3 py-2 rounded-ruwad-sm transition">
                      <Pencil size={15} /> تعديل
                    </Link>
                    <Link href={`/exams/${exam.id}/results`} className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ruwad-navy hover:bg-ruwad-gray/30 px-3 py-2 rounded-ruwad-sm transition">
                      <BarChart3 size={15} />
                    </Link>
                    <DeleteButton table="exams" id={exam.id} label="حذف" confirmText="حذف الامتحان سيحذف معه كل أسئلته ونتائج الطلاب فيه نهائياً. متابعة؟" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
