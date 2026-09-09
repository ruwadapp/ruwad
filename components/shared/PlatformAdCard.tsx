'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { X, ExternalLink, MessageCircle, Tag, Megaphone } from 'lucide-react'

export interface Ad {
  id: string
  title: string
  body: string | null
  badge: string | null
  badge_big: boolean
  image_url: string | null
  style: 'gradient' | 'image' | 'dark'
  button_text: string | null
  button_type: 'url' | 'whatsapp' | 'invite'
  button_value: string | null
  dismissed_count: number
}

// ===== بطاقة إعلان منصة — تدرج أو صورة أو داكن، مع زر url/واتساب/دعوة =====
export function PlatformAdCard({ ad, onDismiss }: { ad: Ad; onDismiss: (id: string) => void }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function dismiss() {
    setLoading(true)
    await supabase.from('ad_views').upsert(
      { ad_id: ad.id, user_id: (await supabase.auth.getUser()).data.user!.id, dismissed_count: ad.dismissed_count + 1, last_shown_at: new Date().toISOString() },
      { onConflict: 'ad_id,user_id' }
    )
    onDismiss(ad.id)
    setLoading(false)
  }

  async function markShown() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('ad_views').upsert(
      { ad_id: ad.id, user_id: user.id, dismissed_count: ad.dismissed_count, last_shown_at: new Date().toISOString() },
      { onConflict: 'ad_id,user_id' }
    )
  }

  // سجّل المشاهدة عند أول عرض
  useState(() => { markShown() })

  const buttonEl = (() => {
    if (!ad.button_text) return null
    const cls = 'inline-flex items-center gap-1.5 font-black text-sm px-5 py-2.5 rounded-full transition hover:opacity-90 hover:-translate-y-0.5'
    if (ad.button_type === 'whatsapp' && ad.button_value) {
      const num = ad.button_value.replace(/\D/g, '')
      return (
        <a href={`https://wa.me/${num}`} target="_blank" rel="noopener noreferrer"
          className={`${cls} bg-green-500 text-white`}>
          <MessageCircle size={15} /> {ad.button_text}
        </a>
      )
    }
    if (ad.button_type === 'url' && ad.button_value) {
      const isInternal = ad.button_value.startsWith('/')
      return isInternal
        ? <Link href={ad.button_value} className={`${cls} bg-white text-ruwad-navy`}>{ad.button_text} <ExternalLink size={13} /></Link>
        : <a href={ad.button_value} target="_blank" rel="noopener noreferrer" className={`${cls} bg-white text-ruwad-navy`}>{ad.button_text} <ExternalLink size={13} /></a>
    }
    return null
  })()

  // ===== وضع الصورة (image) =====
  if (ad.style === 'image' && ad.image_url) {
    return (
      <div className="relative rounded-ruwad overflow-hidden shadow-ruwad-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.image_url} alt={ad.title} className="w-full h-52 object-cover" />
        {/* Fade أسود من الأسفل */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <button onClick={dismiss} disabled={loading} aria-label="إغلاق"
          className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition">
          <X size={14} />
        </button>
        {ad.badge && (
          <span className="absolute top-3 right-3 bg-ruwad-lime text-ruwad-navy text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
            <Tag size={10} /> {ad.badge}
          </span>
        )}
        <div className="absolute bottom-0 inset-x-0 p-4 text-white">
          {ad.badge_big && ad.badge && (
            <p className="text-5xl font-black text-ruwad-lime leading-none mb-1">{ad.badge}</p>
          )}
          <p className="font-black text-lg leading-tight">{ad.title}</p>
          {ad.body && <p className="text-white/75 text-sm mt-1 leading-snug">{ad.body}</p>}
          {buttonEl && <div className="mt-3">{buttonEl}</div>}
        </div>
      </div>
    )
  }

  // ===== وضع الداكن (dark) =====
  if (ad.style === 'dark') {
    return (
      <div className="relative rounded-ruwad overflow-hidden shadow-ruwad-lg bg-ruwad-navy p-5">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-ruwad-blue/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-ruwad-lime/20 rounded-full blur-3xl" />
        <button onClick={dismiss} disabled={loading} aria-label="إغلاق"
          className="absolute top-3 left-3 text-white/40 hover:text-white transition"><X size={16} /></button>
        <div className="relative flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-ruwad-blue/20 text-ruwad-lime flex items-center justify-center shrink-0">
            <Megaphone size={18} />
          </span>
          <div className="flex-1 min-w-0">
            {ad.badge && !ad.badge_big && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-ruwad-lime bg-ruwad-lime/15 rounded-full px-2.5 py-0.5 mb-2">
                <Tag size={9} /> {ad.badge}
              </span>
            )}
            {ad.badge_big && ad.badge && (
              <p className="text-5xl font-black text-ruwad-lime leading-none mb-2">{ad.badge}</p>
            )}
            <p className="font-black text-white leading-snug">{ad.title}</p>
            {ad.body && <p className="text-white/65 text-sm mt-1.5 leading-relaxed">{ad.body}</p>}
            {buttonEl && <div className="mt-3">{buttonEl}</div>}
          </div>
        </div>
      </div>
    )
  }

  // ===== وضع التدرج (gradient — الافتراضي) =====
  return (
    <div className="relative overflow-hidden rounded-ruwad shadow-ruwad-lg p-[2px] bg-gradient-to-l from-ruwad-lime via-ruwad-blue-light to-ruwad-blue">
      <div className="relative bg-ruwad-gradient rounded-[10px] p-5 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-ruwad-lime/25 rounded-full blur-2xl" />
        <button onClick={dismiss} disabled={loading} aria-label="إغلاق"
          className="absolute top-3 left-3 text-white/40 hover:text-white transition"><X size={16} /></button>
        <div className="relative">
          {ad.badge && !ad.badge_big && (
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-ruwad-navy bg-ruwad-lime rounded-full px-2.5 py-0.5 mb-2">
              <Tag size={9} /> {ad.badge}
            </span>
          )}
          {ad.badge_big && ad.badge && (
            <p className="text-6xl font-black text-ruwad-lime leading-none mb-2 drop-shadow-lg">{ad.badge}</p>
          )}
          <p className="font-black text-white text-lg leading-snug">{ad.title}</p>
          {ad.body && <p className="text-white/80 text-sm mt-2 leading-relaxed">{ad.body}</p>}
          {buttonEl && <div className="mt-4">{buttonEl}</div>}
        </div>
      </div>
    </div>
  )
}
