import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CodeQrImage } from '@/components/shared/CodeQrImage'
import { Users, GraduationCap, BookOpen, FileText, Award } from 'lucide-react'

export default async function InstituteDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('*').eq('owner_id', user!.id).single()

  if (!institute) {
    return (
      <>
        <Header title="لوحة المعهد" />
        <main className="p-6">
          <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">
            لم يتم العثور على معهد مرتبط بحسابك.
          </div>
        </main>
      </>
    )
  }

  const { data: members } = await supabase
    .from('institute_members')
    .select('member_role, status, user_id')
    .eq('institute_id', institute.id)
    .eq('status', 'approved')

  const trainerIds = (members ?? []).filter((m) => m.member_role === 'trainer').map((m) => m.user_id)
  const studentCount = (members ?? []).filter((m) => m.member_role === 'student').length

  const [{ count: coursesCount }, { data: exams }] = await Promise.all([
    trainerIds.length
      ? supabase.from('courses').select('id', { count: 'exact', head: true }).in('trainer_id', trainerIds)
      : Promise.resolve({ count: 0 }),
    trainerIds.length
      ? supabase.from('exams').select('id').in('trainer_id', trainerIds)
      : Promise.resolve({ data: [] }),
  ])

  // ===== متوسط أداء الامتحانات على مستوى المعهد بالكامل =====
  const examIds = (exams ?? []).map((e) => e.id)
  const { data: examSubs } = examIds.length
    ? await supabase.from('exam_submissions').select('percentage').in('exam_id', examIds).not('submitted_at', 'is', null)
    : { data: [] }

  const avgExamScore = examSubs && examSubs.length > 0
    ? Math.round(examSubs.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / examSubs.length)
    : null

  return (
    <>
      <Header title={institute.name} />
      <main className="p-6 flex flex-col gap-6">
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-8 flex items-center justify-between flex-wrap gap-4">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-white/70 text-sm">معرّف المعهد (شاركه للانضمام)</p>
            <p className="relative text-3xl font-mono font-bold text-white tracking-widest mt-1">{institute.institute_code}</p>
          </div>
          <CodeQrImage code={institute.institute_code} size={110} className="relative" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <Users size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">المدربون</p>
            <p className="text-2xl font-bold text-ruwad-navy">{trainerIds.length}</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <GraduationCap size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">الطلاب</p>
            <p className="text-2xl font-bold text-ruwad-navy">{studentCount}</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <BookOpen size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">الكورسات</p>
            <p className="text-2xl font-bold text-ruwad-navy">{coursesCount ?? 0}</p>
          </div>
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <FileText size={20} className="text-ruwad-blue" />
            <p className="text-xs text-ruwad-navy/60">امتحانات المعهد</p>
            <p className="text-2xl font-bold text-ruwad-navy">{exams?.length ?? 0}</p>
          </div>
          <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-5 flex flex-col gap-2 text-white">
            <Award size={20} />
            <p className="text-xs opacity-80">متوسط أداء الامتحانات</p>
            <p className="text-2xl font-bold">{avgExamScore !== null ? `${avgExamScore}%` : '—'}</p>
          </div>
        </div>
      </main>
    </>
  )
}
