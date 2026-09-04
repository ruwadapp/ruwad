'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, FileText, ClipboardList,
  Trophy, FileCheck, CalendarCheck, CalendarDays, BarChart3,
  Home, GraduationCap, Award, ListChecks, MonitorPlay, Building2, UserCog, ScanLine, ShieldCheck, Rss, MapPin, FileBadge, Briefcase, Target, MessageCircle, Wallet, Globe2, DoorOpen,
} from 'lucide-react'
import type { Profile } from '@/lib/types'
import { QrScannerModal } from './QrScannerModal'

const ICONS: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, Users, BookOpen, FileText, ClipboardList, Trophy, FileCheck,
  CalendarCheck, CalendarDays, BarChart3, Home, GraduationCap, Award, ListChecks, MonitorPlay, Building2, UserCog, ShieldCheck, Rss, MapPin, FileBadge, Briefcase, Target, MessageCircle, Wallet, Globe2, DoorOpen,
}

interface NavItem { href: string; label: string; icon: string }

const trainerNav: NavItem[] = [
  { href: '/dashboard', label: 'الرئيسية', icon: 'LayoutDashboard' },
  { href: '/courses', label: 'تدريبات', icon: 'BookOpen' },
  { href: '/finance', label: 'المالية', icon: 'Wallet' },
  { href: '/students', label: 'الطلاب', icon: 'Users' },
  { href: '/exams', label: 'الامتحانات', icon: 'FileText' },
  { href: '/presentations', label: 'العروض', icon: 'MonitorPlay' },
  { href: '/surveys', label: 'الاستبيانات', icon: 'ClipboardList' },
  { href: '/challenges', label: 'التحديات', icon: 'Trophy' },
  { href: '/assignments', label: 'الوظائف', icon: 'FileCheck' },
  { href: '/attendance', label: 'الحضور', icon: 'CalendarCheck' },
  { href: '/badges', label: 'الشارات', icon: 'Award' },
  { href: '/posts', label: 'منشوراتي', icon: 'Rss' },
  { href: '/nearby-students', label: 'بالقرب مني', icon: 'MapPin' },
  { href: '/jobs', label: 'فرص العمل', icon: 'Briefcase' },
  { href: '/training-requests', label: 'طلبات التدريب', icon: 'Target' },
  { href: '/analytics', label: 'التحليلات', icon: 'BarChart3' },
  { href: '/institute', label: 'المعهد', icon: 'Building2' },
]

const studentNav: NavItem[] = [
  { href: '/home', label: 'الرئيسية', icon: 'Home' },
  { href: '/nearby', label: 'بالقرب مني', icon: 'MapPin' },
  { href: '/opportunities', label: 'الفرص', icon: 'Briefcase' },
  { href: '/request-training', label: 'اطلب تدريباً', icon: 'Target' },
  { href: '/cv', label: 'سيرتي الذاتية', icon: 'FileBadge' },
  { href: '/my-courses', label: 'التدريبات', icon: 'GraduationCap' },
  { href: '/my-exams', label: 'امتحاناتي', icon: 'FileText' },
  { href: '/my-challenges', label: 'التحديات', icon: 'Trophy' },
  { href: '/my-presentations', label: 'العروض', icon: 'MonitorPlay' },
  { href: '/my-assignments', label: 'واجباتي', icon: 'ListChecks' },
  { href: '/my-attendance', label: 'الحضور', icon: 'CalendarCheck' },
  { href: '/my-achievements', label: 'إنجازاتي', icon: 'Award' },
  { href: '/my-payments', label: 'أقساطي', icon: 'Wallet' },
  { href: '/my-institutes', label: 'معهدي', icon: 'Building2' },
]

const instituteNav: NavItem[] = [
  { href: '/org/dashboard', label: 'الرئيسية', icon: 'LayoutDashboard' },
  { href: '/org/courses', label: 'التدريبات', icon: 'BookOpen' },
  { href: '/org/rooms', label: 'القاعات', icon: 'DoorOpen' },
  { href: '/org/team', label: 'الفريق', icon: 'Users' },
  { href: '/org/finance', label: 'المالية', icon: 'Wallet' },
  { href: '/org/crm', label: 'المهتمون', icon: 'Target' },
  { href: '/org/students', label: 'الطلاب', icon: 'GraduationCap' },
  { href: '/org/nearby', label: 'بالقرب مني', icon: 'MapPin' },
  { href: '/org/jobs', label: 'فرص العمل', icon: 'Briefcase' },
  { href: '/org/training-requests', label: 'طلبات التدريب', icon: 'Target' },
  { href: '/org/surveys', label: 'الاستبيانات', icon: 'ClipboardList' },
  { href: '/org/portal', label: 'بوابتي', icon: 'Globe2' },
]

const superAdminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'الرئيسية', icon: 'LayoutDashboard' },
  { href: '/admin/accounts', label: 'الحسابات', icon: 'UserCog' },
  { href: '/admin/portals', label: 'البوابات', icon: 'Globe2' },
]

export function MobileBottomNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const [scannerOpen, setScannerOpen] = useState(false)
  const scrollRef = useRef<HTMLElement>(null)
  const activeLinkRef = useRef<HTMLAnchorElement>(null)
  const [canScroll, setCanScroll] = useState(false)
  const [thumb, setThumb] = useState({ widthPct: 40, offsetPct: 0 })

  const fullNav =
    profile?.role === 'trainer' ? trainerNav :
    profile?.role === 'institute_admin' ? instituteNav :
    profile?.role === 'super_admin' ? superAdminNav :
    studentNav

  const showScanButton = profile?.role === 'student' || profile?.role === 'trainer'

  function isActive(href: string) {
    return pathname.startsWith(href)
  }

  // يحسب موضع وعرض «خط السحب» بالاستناد إلى مقدار التمرير الأفقي الفعلي للشريط،
  // فيتبع حركة السحب بدقة لحظة بلحظة (Chromium/المتصفحات الحديثة تستخدم scrollLeft سالباً في RTL)
  const updateThumb = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 4) { setCanScroll(false); return }
    setCanScroll(true)

    const widthPct = Math.max(22, (el.clientWidth / el.scrollWidth) * 100)
    const progress = Math.min(1, Math.max(0, Math.abs(el.scrollLeft) / maxScroll))
    const offsetPct = progress * (100 - widthPct)
    setThumb({ widthPct, offsetPct })
  }, [])

  useEffect(() => {
    updateThumb()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateThumb, { passive: true })
    window.addEventListener('resize', updateThumb)
    return () => {
      el.removeEventListener('scroll', updateThumb)
      window.removeEventListener('resize', updateThumb)
    }
  }, [updateThumb, fullNav.length])

  // عند تغيّر الصفحة، يُمرَّر العنصر النشط تلقائياً إلى مجال الرؤية ويُحدَّث المؤشر
  useEffect(() => {
    activeLinkRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    const t = setTimeout(updateThumb, 350)
    return () => clearTimeout(t)
  }, [pathname, updateThumb])

  return (
    <>
      <div
        className="md:hidden fixed bottom-3 right-3 left-3 z-40 rounded-[28px] p-[2px] shadow-ruwad-lg"
        style={{
          paddingBottom: 'max(2px, env(safe-area-inset-bottom))',
          background: 'linear-gradient(120deg, #FFFFFF, #F0F0F0, #FFFFFF)',
        }}
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-[26px]">
          <nav
            ref={scrollRef}
            className="overflow-x-auto no-scrollbar"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            <div className="flex items-center gap-1 px-1.5 py-1.5">
              {showScanButton && (
                <button
                  onClick={() => setScannerOpen(true)}
                  style={{ scrollSnapAlign: 'start' }}
                  className="flex flex-col items-center justify-center gap-0.5 min-w-[20%] shrink-0 py-1.5 rounded-[18px] transition-all text-ruwad-navy/50"
                >
                  <span className="w-7 h-7 -mt-0.5 rounded-full bg-ruwad-lime flex items-center justify-center">
                    <ScanLine size={16} className="text-ruwad-navy" />
                  </span>
                  <span className="text-[10px] font-semibold leading-none whitespace-nowrap">إضافة</span>
                </button>
              )}
              {fullNav.map((item) => {
                const Icon = ICONS[item.icon]
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    ref={active ? activeLinkRef : undefined}
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

          {canScroll && (
            <div className="px-4 pb-1.5 -mt-0.5">
              <div className="relative h-[3px] rounded-full bg-ruwad-navy/10 overflow-hidden">
                <div
                  className="absolute top-0 h-full rounded-full bg-gradient-to-l from-ruwad-blue to-ruwad-lime"
                  style={{ width: `${thumb.widthPct}%`, right: `${thumb.offsetPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {scannerOpen && <QrScannerModal onClose={() => setScannerOpen(false)} />}
    </>
  )
}
