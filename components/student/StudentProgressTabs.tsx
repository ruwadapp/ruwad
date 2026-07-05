'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Award, ShieldCheck } from 'lucide-react'

const TABS = [
  { href: '/progress', label: 'تقدّمي', icon: BarChart3 },
  { href: '/my-badges', label: 'شاراتي', icon: Award },
  { href: '/my-certificates', label: 'شهاداتي', icon: ShieldCheck },
]

export function StudentProgressTabs() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2 bg-white rounded-ruwad shadow-card p-1.5 w-fit">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-ruwad-sm text-sm font-semibold transition ${
              active ? 'bg-ruwad-blue text-white shadow-ruwad' : 'text-ruwad-navy/60 hover:bg-ruwad-gray/20'
            }`}
          >
            <Icon size={15} /> {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
