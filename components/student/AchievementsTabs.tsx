'use client'
import { useState, type ReactNode } from 'react'
import { ShieldCheck, Award } from 'lucide-react'

// تبويبا الإنجازات: الشهادات والشارات في صفحة واحدة
export function AchievementsTabs({ certificates, badges, defaultTab = 'certificates' }: {
  certificates: ReactNode
  badges: ReactNode
  defaultTab?: 'certificates' | 'badges'
}) {
  const [tab, setTab] = useState<'certificates' | 'badges'>(defaultTab)
  const base = 'flex-1 flex items-center justify-center gap-2 py-3 rounded-ruwad-sm text-sm font-extrabold border-2 transition'
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 bg-white rounded-ruwad shadow-card p-2">
        <button onClick={() => setTab('certificates')}
          className={`${base} ${tab === 'certificates' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-transparent hover:border-ruwad-gray'}`}>
          <ShieldCheck size={16} /> الشهادات
        </button>
        <button onClick={() => setTab('badges')}
          className={`${base} ${tab === 'badges' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-transparent hover:border-ruwad-gray'}`}>
          <Award size={16} /> الشارات
        </button>
      </div>
      <div className={tab === 'certificates' ? 'flex flex-col gap-6' : 'hidden'}>{certificates}</div>
      <div className={tab === 'badges' ? 'flex flex-col gap-6' : 'hidden'}>{badges}</div>
    </div>
  )
}
