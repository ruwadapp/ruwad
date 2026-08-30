import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { OfferTrainingButton } from '@/components/shared/OfferTrainingButton'
import { Target, MapPin, Laptop, Users, CalendarDays } from 'lucide-react'

const MODE_META: Record<string, { label: string; icon: typeof Users }> = {
  in_person: { label: 'حضوري', icon: Users },
  remote: { label: 'عن بُعد', icon: Laptop },
  any: { label: 'حضوري أو عن بُعد', icon: Target },
}

// المنصة المركزية لطلبات التدريب — يراها كل المدربين والمعاهد
export async function TrainingRequestsBoard({ offerCourses }: { offerCourses: { id: string; title: string }[] }) {
  const supabase = await createServerSupabaseClient()

  const { data: requests } = await supabase
    .from('training_requests')
    .select('*, student:profiles!student_id(full_name, avatar_url), training_offers(count)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(60)

  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden bg-ruwad-navy rounded-ruwad shadow-ruwad-lg p-6 text-white">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-ruwad-lime/20 rounded-full blur-3xl" />
        <h1 className="relative text-xl font-extrabold flex items-center gap-2"><Target size={20} className="text-ruwad-lime" /> طلبات التدريب</h1>
        <p className="relative text-sm text-white/75 mt-1.5">
          طلاب يبحثون عمّن يدرّبهم — اقترح كورسك المناسب وسيصلهم عرضك كدعوة التحاق فورية.
        </p>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
          <Target className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
          <p className="text-ruwad-navy/60">لا توجد طلبات تدريب مفتوحة حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.map((r) => {
            const student = r.student as unknown as { full_name?: string; avatar_url?: string | null }
            const mode = MODE_META[r.mode] ?? MODE_META.any
            const ModeIcon = mode.icon
            const offers = r.training_offers?.[0]?.count ?? 0
            return (
              <div key={r.id} className="bg-white rounded-ruwad shadow-card overflow-hidden flex flex-col">
                <div className="h-1.5 bg-ruwad-gradient" />
                <div className="p-5 flex flex-col gap-3 flex-1">
                  {/* الطالب — بروفايله العام كاملاً */}
                  <Link href={`/s/${r.student_id}`} className="flex items-center gap-3 group">
                    <span className="w-11 h-11 rounded-full bg-ruwad-navy text-white flex items-center justify-center font-bold overflow-hidden ring-2 ring-ruwad-gray/40 shrink-0">
                      {student?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        student?.full_name?.charAt(0) ?? '؟'
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold text-ruwad-navy text-sm group-hover:text-ruwad-blue transition truncate">{student?.full_name ?? 'طالب'}</span>
                      <span className="block text-[11px] text-ruwad-blue">عرض البروفايل والإنجازات ←</span>
                    </span>
                  </Link>

                  <div>
                    <p className="font-extrabold text-ruwad-navy leading-snug">يريد تعلّم: {r.topic}</p>
                    {r.details && <p className="text-xs text-ruwad-navy/55 leading-relaxed mt-1.5 line-clamp-3">{r.details}</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {r.city && <span className="flex items-center gap-1 text-[11px] font-bold text-ruwad-blue bg-ruwad-blue/10 rounded-full px-2.5 py-1"><MapPin size={11} /> {r.city}</span>}
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-ruwad-navy/50 bg-[#F5F6FA] rounded-full px-2.5 py-1"><ModeIcon size={11} /> {mode.label}</span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-ruwad-navy/50 bg-[#F5F6FA] rounded-full px-2.5 py-1">
                      <CalendarDays size={11} /> {new Date(r.created_at).toLocaleDateString('ar', { day: 'numeric', month: 'short' })}
                    </span>
                    {offers > 0 && <span className="text-[11px] font-bold bg-amber-50 text-amber-600 rounded-full px-2.5 py-1">🎯 {offers} {offers === 1 ? 'عرض' : 'عروض'}</span>}
                  </div>

                  <div className="mt-auto pt-1">
                    <OfferTrainingButton requestId={r.id} courses={offerCourses} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
