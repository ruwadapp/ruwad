import type { Badge, BadgeRarity } from '@/lib/types'
import { Lock } from 'lucide-react'

const RARITY_STYLES: Record<BadgeRarity, { card: string; ring: string; label: string }> = {
  common: {
    card: 'bg-white border-2 border-ruwad-gray',
    ring: 'bg-ruwad-gray/30',
    label: 'عادية',
  },
  rare: {
    card: 'bg-white border-2 border-ruwad-blue shadow-ruwad',
    ring: 'bg-ruwad-blue/10',
    label: 'نادرة',
  },
  epic: {
    card: 'bg-gradient-to-br from-white to-ruwad-lime/10 border-2 border-ruwad-lime shadow-ruwad',
    ring: 'bg-ruwad-lime/25',
    label: 'أسطورية',
  },
  legendary: {
    card: 'bg-ruwad-gradient border-2 border-ruwad-lime shadow-ruwad-lg',
    ring: 'bg-white/15',
    label: 'فريدة',
  },
}

export function BadgeCard({ badge, earned, earnedCount }: { badge: Badge; earned: boolean; earnedCount?: number }) {
  const styles = RARITY_STYLES[badge.rarity]
  const isLegendary = badge.rarity === 'legendary'
  const isDark = isLegendary
  const locked = !earned

  return (
    <div className={`relative rounded-ruwad p-5 flex flex-col items-center gap-2 text-center transition ${styles.card} ${locked ? 'opacity-60' : ''}`}>
      {badge.max_winners && (
        <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isDark ? 'bg-white/20 text-white' : 'bg-ruwad-navy/10 text-ruwad-navy'
        }`}>
          {earnedCount ?? 0}/{badge.max_winners}
        </span>
      )}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full absolute top-3 right-3 ${
        isDark ? 'bg-white/20 text-white' : 'bg-ruwad-navy/10 text-ruwad-navy'
      }`}>
        {styles.label}
      </span>

      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mt-4 ${styles.ring}`}>
        {locked ? <Lock size={22} className={isDark ? 'text-white/70' : 'text-ruwad-navy/40'} /> : badge.icon}
      </div>

      <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-ruwad-navy'}`}>{badge.name}</h3>
      <p className={`text-xs leading-snug ${isDark ? 'text-white/80' : 'text-ruwad-navy/60'}`}>{badge.description}</p>
    </div>
  )
}
