'use client'
import { useState } from 'react'
import {
  Users, PlaySquare, FileText, ListChecks, Trophy, CalendarCheck, MonitorPlay,
  CheckCircle2, Clock, Video, Presentation as PresIcon, CircleDot,
} from 'lucide-react'

/* ================================================================
   نظرة المعهد الشاملة على التدريب — تبويبات: الطلاب، المحاضرات،
   الامتحانات، الوظائف، التحديات، الحضور، العروض التقديمية
   ================================================================ */

interface Overview {
  students: { id: string; name: string; avatar: string | null; progress: number | null; enrolled_at: string; completed: boolean }[]
  lectures: { id: string; title: string; order_index: number; duration: number | null; published: boolean; has_video: boolean; has_presentation: boolean }[]
  exams: { id: string; title: string; total_marks: number | null; duration: number | null; active: boolean; starts_at: string | null }[]
  assignments: { id: string; title: string; total_marks: number | null; due_date: string | null; active: boolean }[]
  challenges: { id: string; title: string; type: string | null; total_marks: number | null; active: boolean; starts_at: string | null }[]
  attendance: { id: string; title: string; created_at: string; active: boolean; closed: boolean; present: number }[]
  presentations: { id: string; title: string; created_at: string }[]
}

const TABS = [
  { key: 'students', label: 'الطلاب', icon: Users },
  { key: 'lectures', label: 'المحاضرات', icon: PlaySquare },
  { key: 'exams', label: 'الامتحانات', icon: FileText },
  { key: 'assignments', label: 'الوظائف', icon: ListChecks },
  { key: 'challenges', label: 'التحديات', icon: Trophy },
  { key: 'attendance', label: 'الحضور', icon: CalendarCheck },
  { key: 'presentations', label: 'العروض', icon: MonitorPlay },
] as const
type TabKey = typeof TABS[number]['key']

const dateAr = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' }) : null

function ActiveChip({ active }: { active: boolean }) {
  return (
    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${active ? 'bg-green-50 text-green-600' : 'bg-ruwad-gray/40 text-ruwad-navy/45'}`}>
      {active ? 'نشط' : 'غير نشط'}
    </span>
  )
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-xs text-ruwad-navy/45 text-center py-8">{label}</p>
}

export function CourseOverviewTabs({ data }: { data: Overview }) {
  const [tab, setTab] = useState<TabKey>('students')

  const count = (k: TabKey) => (data[k] as unknown[]).length

  return (
    <div className="flex flex-col gap-4">
      {/* شريط التبويبات */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2.5 rounded-full border-2 transition ${
                active ? 'bg-ruwad-navy text-white border-ruwad-navy shadow-card' : 'bg-white text-ruwad-navy/60 border-ruwad-gray hover:border-ruwad-navy/30'}`}>
              <Icon size={14} /> {t.label}
              <span className={`text-[10px] font-black rounded-full px-1.5 ${active ? 'bg-white/20' : 'bg-ruwad-gray/50'}`}>{count(t.key)}</span>
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-ruwad shadow-card p-4">
        {/* ===== الطلاب — عرض مميز ===== */}
        {tab === 'students' && (
          data.students.length === 0 ? <EmptyRow label="لا طلاب مقبولون بعد في هذا التدريب." /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.students.map((s) => {
                const pct = Math.min(Math.round(Number(s.progress ?? 0)), 100)
                return (
                  <div key={s.id} className="rounded-ruwad-sm bg-[#F7F8FC] hover:bg-ruwad-blue/5 border-2 border-transparent hover:border-ruwad-blue/20 p-3.5 flex flex-col items-center text-center gap-2 transition">
                    <div className="relative">
                      {s.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.avatar} alt="" className="w-14 h-14 rounded-full object-cover ring-4 ring-white shadow" />
                      ) : (
                        <span className="w-14 h-14 rounded-full bg-ruwad-gradient text-white text-lg font-black flex items-center justify-center ring-4 ring-white shadow">
                          {s.name.charAt(0)}
                        </span>
                      )}
                      {s.completed && (
                        <span className="absolute -bottom-0.5 -left-0.5 bg-green-500 text-white rounded-full p-0.5 ring-2 ring-white"><CheckCircle2 size={12} /></span>
                      )}
                    </div>
                    <p className="text-xs font-extrabold text-ruwad-navy leading-tight line-clamp-2">{s.name}</p>
                    <div className="w-full">
                      <div className="h-1.5 rounded-full bg-white overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-ruwad-blue'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] font-bold text-ruwad-navy/45 mt-1">تقدّم {pct}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ===== المحاضرات ===== */}
        {tab === 'lectures' && (
          data.lectures.length === 0 ? <EmptyRow label="لا محاضرات بعد." /> : (
            <div className="flex flex-col gap-1.5">
              {data.lectures.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-2 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 shrink-0 rounded-lg bg-ruwad-blue/10 text-ruwad-blue text-xs font-black flex items-center justify-center">{l.order_index}</span>
                    <p className="text-xs font-extrabold text-ruwad-navy truncate">{l.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-ruwad-navy/40">
                    {l.has_video && <Video size={13} className="text-ruwad-blue/70" />}
                    {l.has_presentation && <PresIcon size={13} className="text-violet-500/70" />}
                    {l.duration && <span className="text-[10px] font-bold">{l.duration}د</span>}
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${l.published ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {l.published ? 'منشورة' : 'مخفية'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ===== الامتحانات ===== */}
        {tab === 'exams' && (
          data.exams.length === 0 ? <EmptyRow label="لا امتحانات مرتبطة بهذا التدريب." /> : (
            <div className="flex flex-col gap-1.5">
              {data.exams.map((x) => (
                <div key={x.id} className="flex items-center justify-between gap-2 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-ruwad-navy truncate">{x.title}</p>
                    <p className="text-[10px] font-bold text-ruwad-navy/45 mt-0.5">
                      {x.total_marks != null && <>الدرجة {x.total_marks} · </>}
                      {x.duration != null && <>المدة {x.duration}د · </>}
                      {x.starts_at && <>يبدأ {dateAr(x.starts_at)}</>}
                    </p>
                  </div>
                  <ActiveChip active={x.active} />
                </div>
              ))}
            </div>
          )
        )}

        {/* ===== الوظائف ===== */}
        {tab === 'assignments' && (
          data.assignments.length === 0 ? <EmptyRow label="لا وظائف مرتبطة بهذا التدريب." /> : (
            <div className="flex flex-col gap-1.5">
              {data.assignments.map((a) => {
                const late = a.due_date && new Date(a.due_date) < new Date()
                return (
                  <div key={a.id} className="flex items-center justify-between gap-2 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-ruwad-navy truncate">{a.title}</p>
                      <p className="text-[10px] font-bold text-ruwad-navy/45 mt-0.5">
                        {a.total_marks != null && <>الدرجة {a.total_marks} · </>}
                        {a.due_date && <span className={late ? 'text-red-500 font-extrabold' : ''}>التسليم {dateAr(a.due_date)}</span>}
                      </p>
                    </div>
                    <ActiveChip active={a.active} />
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ===== التحديات ===== */}
        {tab === 'challenges' && (
          data.challenges.length === 0 ? <EmptyRow label="لا تحديات مرتبطة بهذا التدريب." /> : (
            <div className="flex flex-col gap-1.5">
              {data.challenges.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-ruwad-navy truncate flex items-center gap-1.5">
                      <Trophy size={12} className="text-amber-500 shrink-0" /> {c.title}
                    </p>
                    <p className="text-[10px] font-bold text-ruwad-navy/45 mt-0.5">
                      {c.total_marks != null && <>الدرجة {c.total_marks} · </>}
                      {c.starts_at && <>يبدأ {dateAr(c.starts_at)}</>}
                    </p>
                  </div>
                  <ActiveChip active={c.active} />
                </div>
              ))}
            </div>
          )
        )}

        {/* ===== الحضور ===== */}
        {tab === 'attendance' && (
          data.attendance.length === 0 ? <EmptyRow label="لا جلسات حضور لهذا التدريب." /> : (
            <div className="flex flex-col gap-1.5">
              {data.attendance.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-ruwad-navy truncate flex items-center gap-1.5">
                      {s.active && <CircleDot size={11} className="text-green-500 animate-pulse shrink-0" />} {s.title}
                    </p>
                    <p className="text-[10px] font-bold text-ruwad-navy/45 mt-0.5">{dateAr(s.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-extrabold text-green-600 bg-green-50 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <Users size={10} /> {s.present} حاضر
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${s.active ? 'bg-green-50 text-green-600' : s.closed ? 'bg-ruwad-gray/40 text-ruwad-navy/45' : 'bg-amber-50 text-amber-600'}`}>
                      {s.active ? 'نشطة' : s.closed ? 'مغلقة' : 'لم تُفعَّل'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ===== العروض التقديمية ===== */}
        {tab === 'presentations' && (
          data.presentations.length === 0 ? <EmptyRow label="لا عروض تقديمية لمدرب هذا التدريب." /> : (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold text-ruwad-navy/40 mb-1 flex items-center gap-1"><Clock size={10} /> عروض مدرب التدريب</p>
              {data.presentations.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">
                  <p className="text-xs font-extrabold text-ruwad-navy truncate flex items-center gap-1.5">
                    <MonitorPlay size={12} className="text-violet-500 shrink-0" /> {p.title}
                  </p>
                  <span className="text-[10px] font-bold text-ruwad-navy/40 shrink-0">{dateAr(p.created_at)}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
