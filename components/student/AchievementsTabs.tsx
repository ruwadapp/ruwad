'use client'
import { useState, type ReactNode } from 'react'
import { BarChart3, ShieldCheck, Award } from 'lucide-react'

export type AchievementsTab = 'progress' | 'certificates' | 'badges'

// تبويبات الإنجازات: التقدم والشهادات والشارات في صفحة واحدة
export function AchievementsTabs({ progress, certificates, badges, defaultTab = 'progress' }: {
  progress: ReactNode
  certificates: ReactNode
  badges: ReactNode
  defaultTab?: AchievementsTab
}) {
  const [tab, setTab] = useState<AchievementsTab>(defaultTab)
  const base = 'flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 rounded-ruwad-sm text-[13px] sm:text-sm font-extrabold border-2 transition'
  const cls = (t: AchievementsTab) =>
    `${base} ${tab === t ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-transparent hover:border-ruwad-gray'}`
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 bg-white rounded-ruwad shadow-card p-2">
        <button onClick={() => setTab('progress')} className={cls('progress')}><BarChart3 size={16} /> تقدّمي</button>
        <button onClick={() => setTab('certificates')} className={cls('certificates')}><ShieldCheck size={16} /> الشهادات</button>
        <button onClick={() => setTab('badges')} className={cls('badges')}><Award size={16} /> الشارات</button>
      </div>
      <div className={tab === 'progress' ? 'flex flex-col gap-6' : 'hidden'}>{progress}</div>
      <div className={tab === 'certificates' ? 'flex flex-col gap-6' : 'hidden'}>{certificates}</div>
      <div className={tab === 'badges' ? 'flex flex-col gap-6' : 'hidden'}>{badges}</div>
    </div>
  )
}
