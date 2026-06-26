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
    <div
      className="md:hidden fixed bottom-3 right-3 left-3 z-40 rounded-[28px] p-[2px] shadow-ruwad-lg"
      style={{
        paddingBottom: 'max(2px, env(safe-area-inset-bottom))',
        background: 'linear-gradient(120deg, #E3FF3B, #C9E62F, #E3FF3B)',
      }}
    >
      <nav
        className="bg-white/90 backdrop-blur-xl rounded-[26px] overflow-x-auto no-scrollbar"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        <div className="flex items-center gap-1 px-1.5 py-1.5">
          {fullNav.map((item) => {
            const Icon = ICONS[item.icon]
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ scrollSnapAlign: 'start' }}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[20%] shrink-0 py-1.5 rounded-[18px] transition-all ${
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
    </div>
  )
}
