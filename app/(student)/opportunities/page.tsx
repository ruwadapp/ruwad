import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { MarkJobsViewed } from '@/components/student/MarkJobsViewed'
import { Briefcase, Building2, CalendarDays, ExternalLink, GraduationCap } from 'lucide-react'

export const dynamic = 'force-dynamic'

// تبويب الفرص: كل فرص العمل المنشورة، لكل الطلاب دون استثناء
export default async function OpportunitiesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: jobs } = await supabase
    .from('job_opportunities')
    .select('*, publisher:profiles!publisher_id(full_name, role)')
    .order('created_at', { ascending: false })

  // اسم المعهد لمن ينشر بصفته معهداً
  const instituteOwnerIds = (jobs ?? [])
    .filter((j) => (j.publisher as { role?: string })?.role === 'institute_admin')
    .map((j) => j.publisher_id)
  const { data: institutes } = instituteOwnerIds.length
    ? await supabase.from('institutes').select('owner_id, name').in('owner_id', instituteOwnerIds)
    : { data: [] }
  const instituteName = new Map((institutes ?? []).map((i) => [i.owner_id, i.name]))

  const today = new Date(new Date().toDateString())
  const active = (jobs ?? []).filter((j) => !j.deadline || new Date(j.deadline) >= today)
  const expired = (jobs ?? []).filter((j) => j.deadline && new Date(j.deadline) < today)

  const publisherLabel = (j: NonNullable<typeof jobs>[number]) => {
    const p = j.publisher as { full_name?: string; role?: string } | null
    if (p?.role === 'institute_admin') return { name: instituteName.get(j.publisher_id) ?? p.full_name ?? 'معهد', tag: 'معهد' }
    return { name: p?.full_name ?? 'مدرب', tag: 'مدرّب' }
  }

  const JobCard = ({ j, isExpired }: { j: NonNullable<typeof jobs>[number]; isExpired: boolean }) => {
    const pub = publisherLabel(j)
    return (
      <div className={`bg-white rounded-ruwad shadow-card overflow-hidden flex flex-col ${isExpired ? 'opacity-55' : 'hover:shadow-ruwad-lg hover:-translate-y-0.5 transition-all'}`}>
        <div className="h-1.5 bg-ruwad-gradient" />
        <div className="p-5 flex flex-col gap-3 flex-1">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 rounded-ruwad-sm bg-ruwad-blue/10 flex items-center justify-center shrink-0">
              <Briefcase size={20} className="text-ruwad-blue" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-ruwad-navy leading-snug">{j.position_title}</h3>
              <p className="flex items-center gap-1.5 text-sm text-ruwad-navy/60 mt-1"><Building2 size={13} /> {j.employer_name}</p>
            </div>
          </div>

          {j.description && <p className="text-xs text-ruwad-navy/55 leading-relaxed line-clamp-3">{j.description}</p>}

          <div className="flex items-center gap-2 flex-wrap mt-auto pt-1">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-ruwad-navy/50 bg-[#F5F6FA] rounded-full px-2.5 py-1">
              <GraduationCap size={11} /> نشرها {pub.tag}: {pub.name}
            </span>
            {j.deadline && (
              <span className={`flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 ${isExpired ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                <CalendarDays size={11} /> {isExpired ? 'انتهى التقديم' : `آخر موعد: ${new Date(j.deadline).toLocaleDateString('ar', { day: 'numeric', month: 'long' })}`}
              </span>
            )}
          </div>

          {!isExpired && (
            <a
              href={j.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-ruwad-blue text-white font-bold text-sm px-4 py-2.5 rounded-ruwad-sm hover:opacity-90 transition shadow-ruwad"
            >
              <ExternalLink size={15} /> التقديم الآن
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Header title="الفرص" />
      <main className="p-6 flex flex-col gap-6">
        <MarkJobsViewed jobIds={(jobs ?? []).map((j) => j.id)} />

        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-6 text-white">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-ruwad-lime/25 rounded-full blur-2xl" />
          <h1 className="relative text-xl font-extrabold flex items-center gap-2"><Briefcase size={20} className="text-ruwad-lime" /> فرص العمل</h1>
          <p className="relative text-sm text-white/80 mt-1">فرص منتقاة ينشرها مدربوك ومعاهد رُوّاد — طوّر مهاراتك واقتنص فرصتك 💼</p>
        </div>

        {active.length === 0 && expired.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <Briefcase className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد فرص منشورة حالياً — عد قريباً!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {active.map((j) => <JobCard key={j.id} j={j} isExpired={false} />)}
            </div>
            {expired.length > 0 && (
              <>
                <h2 className="text-sm font-bold text-ruwad-navy/50 mt-2">فرص انتهى التقديم عليها</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {expired.map((j) => <JobCard key={j.id} j={j} isExpired />)}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </>
  )
}
