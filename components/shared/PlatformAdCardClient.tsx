'use client'
import { useState } from 'react'
import { PlatformAdCard, type Ad } from './PlatformAdCard'

// عرض الإعلانات واحداً تلو الآخر مع إمكانية الإخفاء
export function PlatformAdCardClient({ ads }: { ads: Ad[] }) {
  const [visible, setVisible] = useState<string[]>(ads.map((a) => a.id))
  const shown = ads.filter((a) => visible.includes(a.id))
  if (shown.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      {shown.map((ad) => (
        <PlatformAdCard key={ad.id} ad={ad} onDismiss={(id) => setVisible((v) => v.filter((x) => x !== id))} />
      ))}
    </div>
  )
}
