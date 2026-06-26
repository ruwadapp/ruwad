'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, FileText, ClipboardList,
  Trophy, FileCheck, CalendarCheck, BarChart3,
  Home, GraduationCap, Award, ListChecks, MonitorPlay, Building2, UserCog,
  MoreHorizontal, X,
} from 'lucide-react'
import type { Profile } from '@/lib/types'

const ICONS: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, Users, BookOpen, FileText, ClipboardList, Trophy, FileCheck,
  CalendarCheck, BarChart3, Home, GraduationCap, Award, ListChecks, MonitorPlay, Building2, UserCog,
}

interface NavItem { href: string; label: string; icon: string }

const trainerNav: NavItem[] = [
  { href: '/dashboard', label: 'الرئيسية', icon: 'LayoutDashboard' },
  { href: '/courses', label: 'الكورسات', icon: 'BookOpen' },
  { href: '/students', label: 'الطلاب', icon: 'Users' },
  { href: '/exams', label: 'الامتحانات', icon: 'FileText' },
  { href: '/presentations', label: 'العروض', icon: 'MonitorPlay' },
  { href: '/surveys', label: 'الاستبيانات', icon: 'ClipboardList' },
  { href: '/challenges', label: 'التحديات', icon: 'Trophy' },
  { href: '/assignments', label: 'الوظائف', icon: 'FileCheck' },
  { href: '/attendance', label: 'الحضور', icon: 'CalendarCheck' },
  { href: '/badges', label: 'الشارات', icon: 'Award' },
  { href: '/analytics', label: 'التحليلات', icon: 'BarChart3' },
  { href: '/institute', label: 'المعهد', icon: 'Building2' },
]

const studentNav: NavItem[] = [
  { href: '/home', label: 'الرئيسية', icon: 'Home' },
  { href: '/my-courses', label: 'كورساتي', icon: 'GraduationCap' },
  { href: '/my-exams', label: 'امتحاناتي', icon: 'FileText' },
  { href: '/my-challenges', label: 'التحديات', icon: 'Trophy' },
  { href: '/my-presentations', label: 'العروض', icon: 'MonitorPlay' },
  { href: '/my-assignments', label: 'واجباتي', icon: 'ListChecks' },
  { href: '/my-attendance', label: 'الحضور', icon: 'CalendarCheck' },
  { href: '/progress', label: 'تقدّمي', icon: 'Award' },
  { href: '/my-institute', label: 'المعهد', icon: 'Building2' },
]

const instituteNav: NavItem[] = [
  { href: '/org/dashboard', label: 'الرئيسية', icon: 'LayoutDashboard' },
  { href: '/org/trainers', label: 'المدربون', icon: 'Users' },
  { href: '/org/members', label: 'الأعضاء', icon: 'UserCog' },
]

const superAdminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'الرئيسية', icon: 'LayoutDashboard' },
  { href: '/admin/accounts', label: 'الحسابات', icon: 'UserCog' },
]

export function MobileBottomNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const fullNav =
    profile?.role === 'trainer' ? trainerNav :
    profile?.role === 'institute_admin' ? instituteNav :
    profile?.role === 'super_admin' ? superAdminNav :
    studentNav

  const visible = fullNav.length <= 5 ? fullNav : fullNav.slice(0, 4)
  const overflow = fullNav.length <= 5 ? [] : fullNav.slice(4)

  function isActive(href: string) {
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav
        className="md:hidden fixed bottom-3 right-3 left-3 z-40 bg-white/85 backdrop-blur-xl border border-white/40 rounded-[28px] shadow-ruwad-lg flex items-center justify-around px-2 py-2"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {visible.map((item) => {
          const Icon = ICONS[item.icon]
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all ${
                active ? 'bg-ruwad-blue text-white scale-105 shadow-ruwad' : 'text-ruwad-navy/50'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </Link>
          )
        })}

        {overflow.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all ${
              overflow.some((i) => isActive(i.href)) ? 'bg-ruwad-blue text-white scale-105 shadow-ruwad' : 'text-ruwad-navy/50'
            }`}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-semibold leading-none">المزيد</span>
          </button>
        )}
      </nav>

      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white rounded-t-[28px] p-5 pb-8 flex flex-col gap-2"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-ruwad-navy">كل الصفحات</h3>
              <button onClick={() => setMoreOpen(false)} aria-label="إغلاق" className="text-ruwad-navy/40 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {overflow.map((item) => {
                const Icon = ICONS[item.icon]
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-ruwad-sm transition ${
                      active ? 'bg-ruwad-blue/10 text-ruwad-blue' : 'text-ruwad-navy/70 hover:bg-ruwad-gray/20'
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
