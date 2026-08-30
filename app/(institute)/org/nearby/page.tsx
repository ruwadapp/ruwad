import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { LocationCapture } from '@/components/shared/LocationCapture'
import { InviteToCourseButton } from '@/components/shared/InviteToCourseButton'
import { MapPin, GraduationCap, UserRound } from 'lucide-react'

export const dynamic = 'force-dynamic'

// "بالقرب مني" للمعهد: تحديد موقع المعهد (علني ودقيق) + طلاب ومدربون قريبون بنطاقات تقريبية
export default async function InstituteNearbyPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id, latitude, longitude').eq('owner_id', user!.id).single()
  if (!institute) redirect('/org/dashboard')
  const hasLocation = institute.latitude != null && institute.longitude != null

  const [{ data: students }, { data: trainers }, { data: shares }] = hasLocation
    ? await Promise.all([
        supabase.rpc('nearby_students'),
        supabase.rpc('nearby_trainers'),
        supabase.from('resource_institute_shares').select('resource_id').eq('institute_id', institute.id).eq('resource_type', 'courses'),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const sharedCourseIds = (shares ?? []).map((x) => x.resource_id)
  const { data: sharedCourses } = sharedCourseIds.length
    ? await supabase.from('courses').select('id, title').in('id', sharedCourseIds)
    : { data: [] }

  const byBand = new Map<string, { id: string; full_name: string; avatar_url: string | null }[]>()
  for (const s of (students ?? []) as { id: string; full_name: string; avatar_url: string | null; band: string }[]) {
    byBand.set(s.band, [...(byBand.get(s.band) ?? []), s])
  }

  return (
    <>
      <Header title="بالقرب من المعهد" />
      <main className="p-6 flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <LocationCapture mode="institute" instituteId={institute.id} hasLocation={hasLocation} />

        {!hasLocation ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/50 text-sm">
            حدّد موقع المعهد أعلاه (من جهاز داخل المعهد) ليجدك الطلاب في "بالقرب مني" ولترى الطلاب والمدربين القريبين منك. 📍
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-5 text-white">
                <GraduationCap size={22} />
                <p className="text-2xl font-bold mt-2">{students?.length ?? 0}</p>
                <p className="text-xs opacity-80 mt-0.5">طالب قريب (ضمن 50 كم)</p>
              </div>
              <div className="bg-ruwad-navy rounded-ruwad shadow-card p-5 text-white">
                <UserRound size={22} />
                <p className="text-2xl font-bold mt-2">{trainers?.length ?? 0}</p>
                <p className="text-xs opacity-80 mt-0.5">مدرب قريب (ضمن 50 كم)</p>
              </div>
            </div>

            <p className="text-xs text-ruwad-navy/50">
              حفاظاً على الخصوصية، يظهر الطلاب والمدربون بنطاقات قرب تقريبية فقط، ولا يظهر إلا من فعّل موقعه بنفسه.
            </p>

            {[...byBand.entries()].map(([band, list]) => (
              <section key={band}>
                <h2 className="flex items-center gap-2 font-extrabold text-ruwad-navy mb-3 text-sm">
                  <MapPin size={15} className="text-ruwad-blue" /> طلاب {band} <span className="text-ruwad-navy/40 font-normal">({list.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((s) => (
                    <div key={s.id} className="bg-white rounded-ruwad shadow-card p-5 flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-ruwad-gradient text-white flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden ring-2 ring-ruwad-gray/40">
                        {s.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.avatar_url} alt={s.full_name} className="w-full h-full object-cover" />
                        ) : (
                          s.full_name.charAt(0)
                        )}
                      </div>
                      <Link href={`/s/${s.id}`} className="font-bold text-ruwad-navy text-sm leading-snug hover:text-ruwad-blue transition break-words w-full">
                        {s.full_name}
                      </Link>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <InviteToCourseButton studentId={s.id} courses={sharedCourses ?? []} />
                        <InviteToCourseButton studentId={s.id} courses={sharedCourses ?? []} mode="promo" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </main>
    </>
  )
}
