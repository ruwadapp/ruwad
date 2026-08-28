import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PointsCard, type PointsBreakdown } from '@/components/shared/PointsCard'
import { Award, Medal, Target, Wrench, GraduationCap, CalendarDays } from 'lucide-react'

export const dynamic = 'force-dynamic'

// بروفايل عام للطالب: النقاط والمستوى، الشهادات، الشارات، المهارات والتخصصات
export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: profRows } = await supabase.rpc('student_public_profile', { p_student_id: id })
  const profile = profRows?.[0]
  if (!profile) notFound()

  const [{ data: pointsRows }, { data: certificates }, { data: badgeLinks }] = await Promise.all([
    supabase.rpc('student_points', { p_student_id: id }),
    supabase.from('certificates').select('id, score, certificate_code, issued_at, course:courses(title)').eq('student_id', id).order('issued_at', { ascending: false }),
    supabase.from('student_badges').select('earned_at, badge:badges(name, icon, rarity)').eq('student_id', id).order('earned_at', { ascending: false }),
  ])

  const points = (pointsRows?.[0] ?? { exams: 0, challenges: 0, assignments: 0, certificates: 0, attendance: 0, badges: 0, total: 0 }) as PointsBreakdown
  const skills = profile.skills ?? []
  const specialties = profile.specialties ?? []
  const joined = new Date(profile.created_at).toLocaleDateString('ar', { year: 'numeric', month: 'long' })

  return (
    <main className="min-h-screen bg-[#EEF0F7] p-4 md:p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {/* ===== ترويسة البروفايل ===== */}
        <div className="bg-white rounded-ruwad shadow-card overflow-hidden">
          <div className="h-24 bg-ruwad-gradient relative">
            <div className="absolute -bottom-10 right-6 w-20 h-20 rounded-full ring-4 ring-white bg-ruwad-navy text-white flex items-center justify-center text-3xl font-extrabold overflow-hidden">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.full_name} fill sizes="80px" className="object-cover" />
              ) : (
                profile.full_name.charAt(0)
              )}
            </div>
          </div>
          <div className="pt-12 px-6 pb-6">
            <h1 className="text-xl font-extrabold text-ruwad-navy">{profile.full_name}</h1>
            <p className="flex items-center gap-1.5 text-xs text-ruwad-navy/50 mt-1">
              <GraduationCap size={13} /> طالب · <CalendarDays size={12} /> انضمّ في {joined}
            </p>
            {profile.bio && <p className="text-sm text-ruwad-navy/70 mt-3 leading-relaxed">{profile.bio}</p>}
          </div>
        </div>

        {/* ===== النقاط والمستوى ===== */}
        <PointsCard points={points} />

        {/* ===== التخصصات والمهارات ===== */}
        {(specialties.length > 0 || skills.length > 0) && (
          <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
            {specialties.length > 0 && (
              <div>
                <h3 className="flex items-center gap-1.5 font-bold text-ruwad-navy text-sm mb-2"><Target size={15} className="text-ruwad-blue" /> التخصصات</h3>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((s: string) => (
                    <span key={s} className="bg-ruwad-blue/10 text-ruwad-blue text-sm font-semibold rounded-full px-3 py-1">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {skills.length > 0 && (
              <div>
                <h3 className="flex items-center gap-1.5 font-bold text-ruwad-navy text-sm mb-2"><Wrench size={15} className="text-ruwad-blue" /> المهارات</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s: string) => (
                    <span key={s} className="bg-ruwad-gray/40 text-ruwad-navy text-sm font-semibold rounded-full px-3 py-1">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== الشارات ===== */}
        {badgeLinks && badgeLinks.length > 0 && (
          <div className="bg-white rounded-ruwad shadow-card p-6">
            <h3 className="flex items-center gap-1.5 font-bold text-ruwad-navy mb-4"><Medal size={17} className="text-ruwad-blue" /> الشارات ({badgeLinks.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badgeLinks.map((b, i: number) => {
                const badge = b.badge as unknown as { name: string; icon: string | null; rarity: string | null }
                return (
                  <div key={i} className="flex items-center gap-3 bg-ruwad-lime/10 border border-ruwad-lime/40 rounded-ruwad-sm p-3">
                    <span className="text-2xl shrink-0">{badge?.icon ?? '🏅'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ruwad-navy truncate">{badge?.name}</p>
                      {badge?.rarity && <p className="text-[11px] text-ruwad-navy/50">{badge.rarity}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ===== الشهادات ===== */}
        {certificates && certificates.length > 0 && (
          <div className="bg-white rounded-ruwad shadow-card p-6">
            <h3 className="flex items-center gap-1.5 font-bold text-ruwad-navy mb-4"><Award size={17} className="text-ruwad-blue" /> الشهادات ({certificates.length})</h3>
            <div className="flex flex-col gap-3">
              {certificates.map((c) => (
                <a
                  key={c.id}
                  href={`/certificates/verify/${c.certificate_code}`}
                  className="flex items-center justify-between gap-3 bg-gradient-to-l from-ruwad-lime/15 to-white border border-ruwad-gray/40 rounded-ruwad-sm p-4 hover:shadow-card transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Award size={22} className="text-ruwad-navy shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-ruwad-navy truncate">{(c.course as unknown as { title?: string })?.title ?? 'شهادة إتمام'}</p>
                      <p className="text-xs text-ruwad-navy/50">النتيجة: {c.score}% · {new Date(c.issued_at).toLocaleDateString('ar')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-ruwad-blue shrink-0">تحقّق ←</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
