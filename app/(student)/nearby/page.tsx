import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { LocationCapture } from '@/components/shared/LocationCapture'
import { Building2, MapPin, Navigation, UserRound } from 'lucide-react'

export const dynamic = 'force-dynamic'

// "بالقرب مني" للطالب: أقرب المعاهد (بدقة) والمدربين (نطاق قرب فقط)
export default async function StudentNearbyPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: myLoc } = await supabase.from('user_locations').select('visible').eq('user_id', user!.id).maybeSingle()
  const hasLocation = !!myLoc

  const [{ data: institutes }, { data: trainers }] = hasLocation
    ? await Promise.all([supabase.rpc('nearby_institutes'), supabase.rpc('nearby_trainers')])
    : [{ data: [] }, { data: [] }]

  return (
    <>
      <Header title="بالقرب مني" />
      <main className="p-6 flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <LocationCapture mode="user" hasLocation={hasLocation} visible={myLoc?.visible ?? true} />

        {!hasLocation ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/50 text-sm">
            حدّد موقعك أعلاه لنعرض لك أقرب المعاهد والمدربين إليك. 📍
          </div>
        ) : (
          <>
            {/* ===== المعاهد القريبة ===== */}
            <section>
              <h2 className="flex items-center gap-2 font-extrabold text-ruwad-navy mb-3">
                <Building2 size={18} className="text-ruwad-blue" /> معاهد قريبة منك
              </h2>
              {!institutes || institutes.length === 0 ? (
                <p className="bg-white rounded-ruwad shadow-card p-6 text-sm text-ruwad-navy/50 text-center">لا توجد معاهد حدّدت موقعها ضمن 50 كم منك بعد.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {institutes.map((i: { id: string; name: string; logo_url: string | null; address: string | null; latitude: number; longitude: number; distance_km: number }) => (
                    <div key={i.id} className="bg-white rounded-ruwad shadow-card p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-ruwad-gradient text-white flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                        {i.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={i.logo_url} alt={i.name} className="w-full h-full object-cover" />
                        ) : (
                          i.name.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-ruwad-navy truncate">{i.name}</p>
                        <p className="flex items-center gap-1 text-xs text-ruwad-navy/50 mt-1">
                          <MapPin size={12} /> على بعد {i.distance_km} كم{i.address ? ` — ${i.address}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${i.latitude},${i.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-ruwad-blue bg-ruwad-blue/10 rounded-full px-3 py-1.5 hover:bg-ruwad-blue/20 transition"
                        >
                          <Navigation size={12} /> الاتجاهات
                        </a>
                        <Link href={`/i/${i.id}`} className="text-xs font-bold text-white bg-ruwad-navy rounded-full px-3 py-1.5 hover:opacity-90 transition">
                          الصفحة
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ===== المدربون القريبون ===== */}
            <section>
              <h2 className="flex items-center gap-2 font-extrabold text-ruwad-navy mb-3">
                <UserRound size={18} className="text-ruwad-blue" /> مدربون قريبون منك
              </h2>
              <p className="text-xs text-ruwad-navy/45 mb-3">حفاظاً على الخصوصية، يظهر المدربون بنطاق قرب تقريبي لا بموقع دقيق.</p>
              {!trainers || trainers.length === 0 ? (
                <p className="bg-white rounded-ruwad shadow-card p-6 text-sm text-ruwad-navy/50 text-center">لا يوجد مدربون حدّدوا موقعهم ضمن 50 كم منك بعد.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trainers.map((t: { id: string; full_name: string; avatar_url: string | null; bio: string | null; band: string }) => (
                    <Link key={t.id} href={`/t/${t.id}`} className="bg-white rounded-ruwad shadow-card p-5 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-ruwad transition">
                      <div className="w-11 h-11 rounded-full bg-ruwad-gradient text-white flex items-center justify-center font-bold shrink-0 overflow-hidden">
                        {t.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.avatar_url} alt={t.full_name} className="w-full h-full object-cover" />
                        ) : (
                          t.full_name.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-ruwad-navy text-sm truncate">{t.full_name}</p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ruwad-blue bg-ruwad-blue/10 rounded-full px-2.5 py-0.5 mt-1">
                          <MapPin size={10} /> {t.band}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  )
}
