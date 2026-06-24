'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, BookOpen, FileText, ClipboardList,
  Trophy, FileCheck, CalendarCheck, BarChart3, LogOut,
  Home, GraduationCap, Award, ListChecks,
} from 'lucide-react'
import type { Profile } from '@/lib/types'

const trainerNav = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/students', label: 'الطلاب', icon: Users },
  { href: '/courses', label: 'الكورسات', icon: BookOpen },
  { href: '/exams', label: 'الامتحانات', icon: FileText },
  { href: '/surveys', label: 'الاستبيانات', icon: ClipboardList },
  { href: '/challenges', label: 'التحديات', icon: Trophy },
  { href: '/assignments', label: 'الوظائف', icon: FileCheck },
  { href: '/attendance', label: 'الحضور', icon: CalendarCheck },
  { href: '/analytics', label: 'التحليلات', icon: BarChart3 },
]

const studentNav = [
  { href: '/home', label: 'الرئيسية', icon: Home },
  { href: '/my-courses', label: 'كورساتي', icon: GraduationCap },
  { href: '/my-exams', label: 'امتحاناتي', icon: FileText },
  { href: '/my-assignments', label: 'واجباتي', icon: ListChecks },
  { href: '/progress', label: 'تقدّمي', icon: Award },
]

export function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const nav = profile?.role === 'trainer' ? trainerNav : studentNav

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-ruwad-dark text-white min-h-screen px-4 py-6">
      <div className="px-2 mb-8">
        <h1 className="text-2xl font-extrabold">رُوّاد</h1>
        <p className="text-xs text-white/50 mt-0.5">Ruwad</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-ruwad-sm text-sm font-medium transition ${
                active
                  ? 'bg-white text-ruwad-blue shadow-card'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 pt-4 mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-ruwad-blue flex items-center justify-center font-bold text-sm">
            {profile?.full_name?.charAt(0) ?? '؟'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">{profile?.full_name ?? '...'}</p>
            <p className="text-xs text-white/50">{profile?.role === 'trainer' ? 'مدرب' : 'طالب'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-ruwad-sm text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  )
}
