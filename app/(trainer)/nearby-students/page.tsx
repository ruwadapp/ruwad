import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { LocationCapture } from '@/components/shared/LocationCapture'
import { InviteToCourseButton } from '@/components/shared/InviteToCourseButton'
import { MapPin, GraduationCap } from 'lucide-react'

export const dynamic = 'force-dynamic'

// "بالقرب مني" للمدرب: طلاب قريبون بنطاق قرب تقريبي فقط (بلا مواقع دقيقة)
export default async function TrainerNearbyPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: myLoc } = await supabase.from('user_locations').select('visible').eq('user_id', user!.id).maybeSingle()
  const hasLocation = !!myLoc

  const [{ data: students }, { data: myCourses }] = hasLocation
    ? await Promise.all([
        supabase.rpc('nearby_students'),
        supabase.from('courses').select('id, title').eq('trainer_id', user!.id).order('created_at', { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }]

  // تجميع حسب النطاق
  const byBand = new Map<string, { id: string; full_name: string; avatar_url: string | null }[]>()
  for (const s of (students ?? []) as { id: string; full_name: string; avatar_url: string | null; band: string }[]) {
    byBand.set(s.band, [...(byBand.get(s.band) ?? []), s])
  }

  return (
    <>
      <Header title="طلاب بالقرب مني" />
      <main className="p-6 flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <LocationCapture mode="user" hasLocation={hasLocation} visible={myLoc?.visible ?? true} />

        <p className="text-xs text-ruwad-navy/50 -mt-2">
          حفاظاً على خصوصية الطلاب، يظهرون بنطاقات قرب تقريبية فقط ولا يمكن معرفة موقع أي طالب بدقة. لا يظهر إلا من فعّل موقعه بنفسه.
        </p>

        {!hasLocation ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/50 text-sm">
            حدّد موقعك أعلاه لنعرض لك الطلاب القريبين منك. 📍
          </div>
        ) : !students || students.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/50 text-sm">
            لا يوجد طلاب فعّلوا موقعهم ضمن 50 كم منك بعد.
          </div>
        ) : (
          <>
            <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-5 flex items-center gap-3 text-white">
              <GraduationCap size={24} />
              <div>
                <p className="text-sm opacity-80">طلاب قريبون منك</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
            {[...byBand.entries()].map(([band, list]) => (
              <section key={band}>
                <h2 className="flex items-center gap-2 font-extrabold text-ruwad-navy mb-3 text-sm">
                  <MapPin size={15} className="text-ruwad-blue" /> {band} <span className="text-ruwad-navy/40 font-normal">({list.length})</span>
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
                        <InviteToCourseButton studentId={s.id} courses={myCourses ?? []} />
                        <InviteToCourseButton studentId={s.id} courses={myCourses ?? []} mode="promo" />
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
