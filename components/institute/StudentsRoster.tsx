'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { GraduationCap, CircleDot, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react'
import { InviteToCourseButton } from '@/components/shared/InviteToCourseButton'

/* ================================================================
   طلاب المعهد — لكل طالب حالة محسوبة: نشط (لديه تدريب جارٍ)
   أو خرّيج 🎓 (أكمل كل تدريباته لدى هذا المعهد)، مع تنبيه مالي إن بقي مستحق
   ================================================================ */

interface CourseProgress { course_id: string; title: string; completed: boolean; progress: number }
interface StudentRow {
  student_id: string; full_name: string; avatar_url: string | null
  courses: CourseProgress[]
  outstanding: { currency: string; amount: number }[]
}
interface CourseOpt { id: string; title: string }

const CUR: Record<string, string> = { SYP: 'ل.س', USD: '$' }
const fmt = (n: number) => Number(n).toLocaleString('ar')

export function StudentsRoster({ students, publishedCourses }: { students: StudentRow[]; publishedCourses: CourseOpt[] }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'graduate'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const withStatus = useMemo(() => students.map((s) => ({
    ...s,
    isGraduate: s.courses.length > 0 && s.courses.every((c) => c.completed),
  })), [students])

  const shown = withStatus.filter((s) => filter === 'all' || (filter === 'graduate' ? s.isGraduate : !s.isGraduate))
  const counts = { active: withStatus.filter((s) => !s.isGraduate).length, graduate: withStatus.filter((s) => s.isGraduate).length }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-ruwad-navy/60 ml-1">طلاب المعهد</p>
        {([['all', `الكل (${withStatus.length})`], ['active', `نشط (${counts.active})`], ['graduate', `خريجون 🎓 (${counts.graduate})`]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`text-xs font-extrabold px-3 py-1.5 rounded-full border-2 transition ${filter === v ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
            {l}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-8 text-center text-sm text-ruwad-navy/45">لا طلاب في هذا التصنيف.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((s) => {
            const open = expanded === s.student_id
            const hasDue = s.outstanding.some((o) => o.amount > 0)
            return (
              <div key={s.student_id} className={`bg-white rounded-ruwad shadow-card overflow-hidden ${hasDue ? 'ring-2 ring-amber-300' : ''}`}>
                <button onClick={() => setExpanded(open ? null : s.student_id)} className="w-full p-3.5 flex items-center gap-3 text-right">
                  {s.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-ruwad-gray/50 shrink-0" />
                  ) : (
                    <span className="w-11 h-11 rounded-full bg-ruwad-gradient text-white font-black flex items-center justify-center shrink-0">{s.full_name.charAt(0)}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-ruwad-navy truncate flex items-center gap-1.5">
                      <Link href={`/s/${s.student_id}`} onClick={(e) => e.stopPropagation()} className="hover:text-ruwad-blue transition-colors">{s.full_name}</Link>
                      {s.isGraduate ? (
                        <span className="text-[10px] font-extrabold text-green-700 bg-green-50 rounded-full px-2 py-0.5 flex items-center gap-1"><GraduationCap size={10} /> خرّيج</span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-ruwad-blue bg-ruwad-blue/10 rounded-full px-2 py-0.5 flex items-center gap-1"><CircleDot size={9} /> نشط</span>
                      )}
                      {hasDue && (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <AlertTriangle size={10} /> مستحق {s.outstanding.filter((o) => o.amount > 0).map((o) => `${fmt(o.amount)} ${CUR[o.currency]}`).join(' · ')}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] font-bold text-ruwad-navy/45 mt-0.5">{s.courses.length} تدريباً · {s.courses.filter((c) => c.completed).length} مكتمل</p>
                  </div>
                  <ChevronDown size={16} className={`shrink-0 text-ruwad-navy/30 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <div className="border-t border-ruwad-gray/50 p-3.5 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      {s.courses.map((c) => (
                        <div key={c.course_id} className="flex items-center justify-between gap-2 bg-[#F5F6FA] rounded-ruwad-sm px-3 py-2 text-xs">
                          <span className="font-extrabold text-ruwad-navy truncate">{c.title}</span>
                          {c.completed ? (
                            <span className="shrink-0 flex items-center gap-1 text-green-600 font-extrabold"><CheckCircle2 size={12} /> مكتمل</span>
                          ) : (
                            <span className="shrink-0 font-extrabold text-ruwad-navy/50">{Math.round(c.progress)}%</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {publishedCourses.length > 0 && (
                      <InviteToCourseButton studentId={s.student_id} courses={publishedCourses} />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
