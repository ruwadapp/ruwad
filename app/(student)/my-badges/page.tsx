import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { BadgeCard } from '@/components/shared/BadgeCard'
import { BadgeShareCard } from '@/components/student/BadgeShareCard'
import type { Badge, BadgeRarity } from '@/lib/types'

const RARITY_ORDER: BadgeRarity[] = ['legendary', 'epic', 'rare', 'common']
const RARITY_TITLES: Record<BadgeRarity, string> = {
  legendary: '🏆 فريدة',
  epic: '💎 أسطورية',
  rare: '⭐ نادرة',
  common: '🔰 عادية',
}

export default async function BadgesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: allBadges }, { data: earned }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    supabase.from('badges').select('*').order('condition_value', { ascending: true }),
    supabase.from('student_badges').select('badge_id, earned_at').eq('student_id', user!.id),
  ])

  const earnedIds = new Set((earned ?? []).map((e) => e.badge_id))

  // لحساب عداد "كم شخصاً حصل عليها" لشارات محدودة العدد (مثل الفريدة)
  const limitedBadgeIds = (allBadges ?? []).filter((b) => b.max_winners).map((b) => b.id)
  let countsMap = new Map<string, number>()
  if (limitedBadgeIds.length > 0) {
    const { data: counts } = await supabase
      .from('student_badges')
      .select('badge_id')
      .in('badge_id', limitedBadgeIds)
    countsMap = new Map()
    for (const row of counts ?? []) {
      countsMap.set(row.badge_id, (countsMap.get(row.badge_id) ?? 0) + 1)
    }
  }

  const grouped: Record<BadgeRarity, Badge[]> = { legendary: [], epic: [], rare: [], common: [] }
  for (const badge of allBadges ?? []) {
    grouped[badge.rarity as BadgeRarity].push(badge)
  }

  return (
    <>
      <Header title="الشارات والإنجازات" />
      <main className="p-6 flex flex-col gap-8">
        <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-6 flex items-center justify-between text-white">
          <div>
            <p className="text-sm opacity-80">إنجازاتك حتى الآن</p>
            <p className="text-3xl font-bold">{earnedIds.size} / {allBadges?.length ?? 0}</p>
          </div>
          <span className="text-5xl">🏆</span>
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
      </main>
    </>
  )
}
