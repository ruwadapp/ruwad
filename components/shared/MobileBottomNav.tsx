'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, FileText, ClipboardList,
  Trophy, FileCheck, CalendarCheck, BarChart3,
  Home, GraduationCap, Award, ListChecks, MonitorPlay, Building2, UserCog,
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

  const fullNav =
    profile?.role === 'trainer' ? trainerNav :
    profile?.role === 'institute_admin' ? instituteNav :
    profile?.role === 'super_admin' ? superAdminNav :
    studentNav

  function isActive(href: string) {
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="md:hidden fixed bottom-3 right-3 left-3 z-40 bg-white/85 backdrop-blur-xl border border-white/40 rounded-[28px] shadow-ruwad-lg overflow-x-auto no-scrollbar"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-1 px-2 py-2 w-max min-w-full justify-around">
        {fullNav.map((item) => {
          const Icon = ICONS[item.icon]
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                active ? 'bg-ruwad-blue text-white scale-105 shadow-ruwad' : 'text-ruwad-navy/50'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-semibold leading-none whitespace-nowrap">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
