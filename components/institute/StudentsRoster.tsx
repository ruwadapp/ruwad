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
type SortKey = 'name' | 'progress' | 'courses' | 'debt'

export function StudentsRoster({ students, publishedCourses }: { students: StudentRow[]; publishedCourses: CourseOpt[] }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'graduate'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [debtOnly, setDebtOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('name')

  const withStatus = useMemo(() => students.map((s) => ({
    ...s,
    isGraduate: s.courses.length > 0 && s.courses.every((c) => c.completed),
    avgProgress: s.courses.length ? s.courses.reduce((a, c) => a + c.progress, 0) / s.courses.length : 0,
    hasDebt: s.outstanding.some((o) => o.amount > 0),
  })), [students])

  const courseOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of students) for (const c of s.courses) m.set(c.course_id, c.title)
    return [...m.entries()].map(([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title, 'ar'))
  }, [students])

  const shown = useMemo(() => {
    const term = q.trim()
    let list = withStatus.filter((s) => {
      if (filter !== 'all' && (filter === 'graduate' ? !s.isGraduate : s.isGraduate)) return false
      if (term && !s.full_name.includes(term)) return false
      if (courseFilter !== 'all' && !s.courses.some((c) => c.course_id === courseFilter)) return false
      if (debtOnly && !s.hasDebt) return false
      return true
    })
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'progress': return b.avgProgress - a.avgProgress
        case 'courses': return b.courses.length - a.courses.length
        case 'debt': return Number(b.hasDebt) - Number(a.hasDebt)
        default: return a.full_name.localeCompare(b.full_name, 'ar')
      }
    })
    return list
  }, [withStatus, q, filter, courseFilter, debtOnly, sort])

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

      <div className="bg-white rounded-ruwad shadow-card p-3 flex flex-col sm:flex-row gap-2.5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الطالب..."
          className="flex-1 border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2 text-sm font-semibold text-ruwad-navy outline-none" />
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}
          className="border-2 border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm font-bold text-ruwad-navy outline-none bg-white">
          <option value="all">كل التدريبات</option>
          {courseOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="border-2 border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm font-bold text-ruwad-navy outline-none bg-white">
          <option value="name">الاسم أبجدياً</option>
          <option value="progress">الأعلى تقدماً</option>
          <option value="courses">الأكثر تدريبات</option>
          <option value="debt">عليهم مستحقات أولاً</option>
        </select>
        <button onClick={() => setDebtOnly(!debtOnly)}
          className={`shrink-0 text-xs font-extrabold px-3 py-2 rounded-ruwad-sm border-2 transition ${debtOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
          عليهم مستحقات فقط
        </button>
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
