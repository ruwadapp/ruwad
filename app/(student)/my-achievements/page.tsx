import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { BadgeCard } from '@/components/shared/BadgeCard'
import { BadgeShareCard } from '@/components/student/BadgeShareCard'
import { AchievementsTabs } from '@/components/student/AchievementsTabs'
import type { Badge, BadgeRarity } from '@/lib/types'
import { ShieldCheck, Award } from 'lucide-react'

const RARITY_ORDER: BadgeRarity[] = ['legendary', 'epic', 'rare', 'common']
const RARITY_TITLES: Record<BadgeRarity, string> = {
  legendary: '🏆 فريدة', epic: '💎 أسطورية', rare: '⭐ نادرة', common: '🔰 عادية',
}

export default async function StudentAchievementsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id
  const { tab } = await searchParams

  const [
    { data: certificates },
    { data: profile },
    { data: allBadges },
    { data: earned },
    { data: pendingCount },
  ] = await Promise.all([
    supabase.from('certificates').select('*, course:courses(title)').eq('student_id', uid).order('issued_at', { ascending: false }),
    supabase.from('profiles').select('full_name').eq('id', uid).single(),
    supabase.from('badges').select('*').order('condition_value', { ascending: true }),
    // الشارات المعتمدة فعلياً فقط — المعلّقة لا تظهر حتى يعتمدها المدرب
    supabase.from('student_badges').select('badge_id').eq('student_id', uid),
    supabase.from('badge_approvals').select('id', { count: 'exact', head: true }).eq('student_id', uid).eq('status', 'pending'),
  ])

  const earnedIds = new Set((earned ?? []).map((e) => e.badge_id))
  const limitedBadgeIds = (allBadges ?? []).filter((b) => b.max_winners).map((b) => b.id)
  const countsMap = new Map<string, number>()
  if (limitedBadgeIds.length > 0) {
    const { data: counts } = await supabase.from('student_badges').select('badge_id').in('badge_id', limitedBadgeIds)
    for (const row of counts ?? []) countsMap.set(row.badge_id, (countsMap.get(row.badge_id) ?? 0) + 1)
  }
  const grouped: Record<BadgeRarity, Badge[]> = { legendary: [], epic: [], rare: [], common: [] }
  for (const badge of allBadges ?? []) grouped[badge.rarity as BadgeRarity].push(badge)

  const certificatesSection = (
    <>
      <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-5 flex items-center gap-3 text-white">
        <ShieldCheck size={26} />
        <div>
          <p className="text-sm opacity-80">شهاداتي</p>
          <p className="text-2xl font-bold">{certificates?.length ?? 0}</p>
        </div>
      </div>
      <section className="bg-white rounded-ruwad shadow-card p-6">
        {!certificates || certificates.length === 0 ? (
          <p className="text-ruwad-navy/50 text-sm py-8 text-center">لا توجد شهادات حتى الآن. أكمل أحد الكورسات لتحصل على شهادتك الأولى.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {certificates.map((c) => (
              <Link key={c.id} href={`/certificates/${c.id}`}
                className="flex items-center justify-between gap-3 p-4 rounded-ruwad-sm border-2 border-ruwad-lime bg-ruwad-lime/10 hover:bg-ruwad-lime/20 transition">
                <div>
                  <p className="font-bold text-ruwad-navy">{c.course?.title}</p>
                  <p className="text-xs text-ruwad-navy/50">{new Date(c.issued_at).toLocaleDateString('ar')}</p>
                </div>
                <span className="text-lg font-bold text-ruwad-navy">{Number(c.score)}%</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )

  const badgesSection = (
    <>
      <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-5 flex items-center justify-between text-white flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Award size={26} />
          <div>
            <p className="text-sm opacity-80">شاراتي المكتسبة</p>
            <p className="text-2xl font-bold">{earnedIds.size} / {allBadges?.length ?? 0}</p>
          </div>
        </div>
        {(pendingCount?.length ?? 0) > 0 && (
          <span className="text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-full">
            لديك شارات مستحقّة بانتظار موافقة المدرب
          </span>
        )}
      </div>
      {RARITY_ORDER.map((rarity) => (
        grouped[rarity].length > 0 && (
          <section key={rarity}>
            <h2 className="text-lg font-bold text-ruwad-navy mb-4">{RARITY_TITLES[rarity]}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {grouped[rarity].map((badge) => {
                const earnedThis = earnedIds.has(badge.id)
                return (
                  <div key={badge.id} className="flex flex-col gap-2">
                    <BadgeCard badge={badge} earned={earnedThis} earnedCount={countsMap.get(badge.id)} />
                    {earnedThis && <BadgeShareCard badge={badge} studentName={profile?.full_name ?? 'طالب رُوّاد'} />}
                  </div>
                )
              })}
            </div>
          </section>
        )
      ))}
    </>
  )

  return (
    <>
      <Header title="إنجازاتي" />
      <main className="p-6">
        <AchievementsTabs
          certificates={certificatesSection}
          badges={badgesSection}
          defaultTab={tab === 'badges' ? 'badges' : 'certificates'}
        />
      </main>
    </>
  )
}
