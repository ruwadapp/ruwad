import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ExamsGrid, type ExamGridItem } from '@/components/trainer/ExamsGrid'
import { getTrainerInstitutes, getResourceSharesMap } from '@/lib/utils/getTrainerInstitutes'
import { Plus, FileText, Zap, Award } from 'lucide-react'

export default async function ExamsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const institutes = await getTrainerInstitutes(supabase, user!.id)

  const { data: exams } = await supabase
    .from('exams')
    .select('*, questions(count), exam_submissions(count)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  const sharesMap = await getResourceSharesMap(supabase, 'exams', (exams ?? []).map((e) => e.id))

  const { data: myCourses } = await supabase
    .from('courses').select('id, title').eq('trainer_id', user!.id).order('created_at', { ascending: false })

  const gridItems: ExamGridItem[] = (exams ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    is_active: e.is_active,
    exam_code: e.exam_code,
    course_id: e.course_id,
    created_at: e.created_at,
    questionsCount: e.questions?.[0]?.count ?? 0,
    submissionsCount: e.exam_submissions?.[0]?.count ?? 0,
  }))

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
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />

          <div className="relative grid grid-cols-3 gap-2 sm:gap-4 w-full sm:flex-1">
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-2.5 sm:p-4 text-center">
              <FileText size={18} className="text-white mx-auto mb-1" />
              <p className="text-lg sm:text-2xl font-bold text-white leading-tight">{exams?.length ?? 0}</p>
              <p className="text-[10px] sm:text-[11px] text-white/70 leading-tight">امتحان</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-2.5 sm:p-4 text-center">
              <Zap size={18} className="text-white mx-auto mb-1" />
              <p className="text-lg sm:text-2xl font-bold text-white leading-tight">{activeCount}</p>
              <p className="text-[10px] sm:text-[11px] text-white/70 leading-tight">نشط</p>
            </div>
            <div className="bg-ruwad-lime rounded-ruwad-sm p-2.5 sm:p-4 text-center">
              <Award size={18} className="text-ruwad-navy mx-auto mb-1" />
              <p className="text-lg sm:text-2xl font-bold text-ruwad-navy leading-tight">{avgScore !== null ? `${avgScore}%` : '—'}</p>
              <p className="text-[10px] sm:text-[11px] text-ruwad-navy/70 leading-tight">متوسط الأداء</p>
            </div>
          </div>

          <Link
            href="/exams/new"
            className="relative bg-white text-ruwad-blue px-5 py-2.5 rounded-ruwad-sm font-bold hover:opacity-90 transition shadow-ruwad flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
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
          <ExamsGrid exams={gridItems} courses={myCourses ?? []} institutes={institutes} sharesMap={sharesMap} />
        )}
      </main>
    </>
  )
}
