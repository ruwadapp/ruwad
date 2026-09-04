'use client'
import Link from 'next/link'
import {
  CircleDot, DoorOpen, CalendarCheck, FileText, Trophy, Users2,
  AlertTriangle, UserPlus, Target, Wallet, Clock,
} from 'lucide-react'

/* ================================================================
   «الآن» — نشاط حيّ لحظي: موعد جارٍ، قاعة مشغولة، حضور نشط، امتحان/تحدي جارٍ
   «يحتاج انتباهك» — كل ما ينتظر قراراً: مستحقات، طلبات، مهتمون جدد
   ================================================================ */

interface OngoingEvent { id: string; title: string; course_title: string | null; trainer_name: string | null; room_name: string | null; starts_at: string; ends_at: string }
interface ActiveAttendance { id: string; title: string; course_title: string | null; present: number }
interface ActiveExam { id: string; title: string; course_title: string | null; ends_at: string | null }
interface ActiveChallenge { id: string; title: string; course_title: string | null; ends_at: string | null }
interface FinanceRow { currency: string; outstanding: number; overdue: number }

const CUR: Record<string, string> = { SYP: 'ل.س', USD: '$' }
const fmt = (n: number) => Number(n).toLocaleString('ar')
const timeLeft = (iso: string | null) => {
  if (!iso) return null
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (mins <= 0) return null
  return mins < 60 ? `${mins} د متبقية` : `${Math.round(mins / 60)} س متبقية`
}

function LiveCard({ icon: Icon, accent, title, subtitle, meta }: {
  icon: typeof CircleDot; accent: string; title: string; subtitle?: string | null; meta?: string | null
}) {
  return (
    <div className="bg-white rounded-ruwad-sm shadow-card p-3.5 flex items-start gap-3 border-r-4" style={{ borderColor: accent }}>
      <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: accent + '1a', color: accent }}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-ruwad-navy truncate">{title}</p>
        {subtitle && <p className="text-[11px] font-bold text-ruwad-navy/50 truncate mt-0.5">{subtitle}</p>}
        {meta && <p className="text-[10px] font-extrabold mt-1" style={{ color: accent }}>{meta}</p>}
      </div>
    </div>
  )
}

export function LiveActivitySection({ events, attendance, exams, challenges }: {
  events: OngoingEvent[]; attendance: ActiveAttendance[]; exams: ActiveExam[]; challenges: ActiveChallenge[]
}) {
  const busyRooms = events.filter((e) => e.room_name)
  const total = events.length + attendance.length + exams.length + challenges.length

  return (
    <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-extrabold text-ruwad-navy flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          يجري الآن
        </h2>
        <span className="text-[11px] font-bold text-ruwad-navy/40">{total} نشاط حي</span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-ruwad-navy/45 text-center py-6">لا نشاط حي هذه اللحظة — هدوء تام. 😌</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2.5">
          {events.map((e) => (
            <Link key={'ev-' + e.id} href="/org/calendar">
              <LiveCard icon={Clock} accent="#3A4EFB" title={e.course_title ?? e.title}
                subtitle={[e.trainer_name, e.room_name].filter(Boolean).join(' · ')}
                meta={timeLeft(e.ends_at)} />
            </Link>
          ))}
          {busyRooms.length > 0 && busyRooms.map((e) => (
            <Link key={'room-' + e.id} href="/org/rooms">
              <LiveCard icon={DoorOpen} accent="#dc2626" title={`${e.room_name} مشغولة`} subtitle={e.course_title} meta="🔴 مشغولة الآن" />
            </Link>
          ))}
          {attendance.map((a) => (
            <Link key={'att-' + a.id} href="/org/courses">
              <LiveCard icon={CalendarCheck} accent="#16a34a" title={a.course_title ?? a.title} subtitle="جلسة حضور نشطة" meta={`${a.present} حاضر حتى الآن`} />
            </Link>
          ))}
          {exams.map((x) => (
            <Link key={'ex-' + x.id} href="/org/courses">
              <LiveCard icon={FileText} accent="#d97706" title={x.course_title ?? x.title} subtitle="امتحان جارٍ" meta={timeLeft(x.ends_at)} />
            </Link>
          ))}
          {challenges.map((c) => (
            <Link key={'ch-' + c.id} href="/org/courses">
              <LiveCard icon={Trophy} accent="#7c3aed" title={c.course_title ?? c.title} subtitle="تحدٍّ جارٍ" meta={timeLeft(c.ends_at)} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function AttentionSection({ finance, pendingEnrollments, pendingGeneralJoin, pendingTrainerJoin, newInquiries }: {
  finance: FinanceRow[]
  pendingEnrollments: number; pendingGeneralJoin: number; pendingTrainerJoin: number; newInquiries: number
}) {
  const overdueRows = finance.filter((f) => f.overdue > 0)
  const items = [
    overdueRows.length > 0 && {
      icon: Wallet, accent: '#dc2626', href: '/org/finance',
      title: 'مستحقات متأخرة', value: overdueRows.map((f) => `${fmt(f.overdue)} ${CUR[f.currency]}`).join(' · '),
    },
    pendingEnrollments > 0 && { icon: Users2, accent: '#d97706', href: '/org/students', title: 'طلبات التحاق بكورسات', value: `${pendingEnrollments} بانتظار الرد` },
    pendingGeneralJoin > 0 && { icon: UserPlus, accent: '#d97706', href: '/org/students', title: 'طلبات انضمام عامة', value: `${pendingGeneralJoin} بانتظار الرد` },
    pendingTrainerJoin > 0 && { icon: UserPlus, accent: '#3A4EFB', href: '/org/team', title: 'طلبات انضمام مدربين', value: `${pendingTrainerJoin} بانتظار الرد` },
    newInquiries > 0 && { icon: Target, accent: '#16a34a', href: '/org/crm', title: 'مهتمون جدد', value: `${newInquiries} لم تتم متابعتهم` },
  ].filter(Boolean) as { icon: typeof Wallet; accent: string; href: string; title: string; value: string }[]

  if (items.length === 0) {
    return (
      <div className="bg-green-50 rounded-ruwad p-4 sm:p-5 flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">✓</span>
        <p className="text-sm font-extrabold text-green-700">كل شيء تحت السيطرة — لا شيء ينتظرك الآن.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-5">
      <h2 className="font-extrabold text-ruwad-navy mb-3.5 flex items-center gap-2"><AlertTriangle size={17} className="text-amber-500" /> يحتاج انتباهك</h2>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {items.map((it, i) => (
          <Link key={i} href={it.href} className="flex items-center gap-3 rounded-ruwad-sm px-3.5 py-3 transition hover:-translate-y-0.5" style={{ background: it.accent + '0d' }}>
            <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: it.accent + '1a', color: it.accent }}><it.icon size={16} /></span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-ruwad-navy truncate">{it.title}</p>
              <p className="text-[11px] font-bold" style={{ color: it.accent }}>{it.value}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
