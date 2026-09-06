'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Settings, Globe2, CreditCard, Building2, BellRing, ShieldCheck, MessageCircle, ChevronUp,
} from 'lucide-react'

const WHATSAPP_NUMBER = '963998285483'
const WA_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('السلام عليكم، أحتاج مساعدة بخصوص معهدي على منصة رُوّاد')}`

const ITEMS = [
  { href: '/org/portal', label: 'بوابتي', icon: Globe2 },
  { href: '/org/settings/subscription', label: 'الاشتراك', icon: CreditCard },
  { href: '/org/settings/profile', label: 'بيانات المعهد', icon: Building2 },
  { href: '/org/settings/notifications', label: 'الإشعارات', icon: BellRing },
  { href: '/reset-password', label: 'الأمان', icon: ShieldCheck },
]

// قائمة خيارات المعهد — التحكم بالمنصة والبوابة والاشتراك، بجانب زر تسجيل الخروج
export function InstituteOptionsMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-ruwad shadow-ruwad-lg border border-ruwad-gray/40 overflow-hidden z-50" dir="rtl">
          <div className="py-1.5">
            {ITEMS.map((it) => (
              <Link key={it.href} href={it.href} onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-ruwad-navy hover:bg-ruwad-gray/20 transition">
                <it.icon size={16} className="text-ruwad-navy/50" /> {it.label}
              </Link>
            ))}
            <a href={WA_HREF} target="_blank" rel="noreferrer"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-green-600 hover:bg-green-50 transition border-t border-ruwad-gray/40 mt-1">
              <MessageCircle size={16} /> الدعم عبر واتساب
            </a>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-ruwad-sm text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
      >
        <Settings size={18} />
        خيارات
        <ChevronUp size={14} className={`mr-auto transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  )
}
