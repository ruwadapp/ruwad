'use client'
import { useState, type ReactNode } from 'react'
import {
  Users, PlaySquare, FileText, ListChecks, Trophy, CalendarCheck, MonitorPlay,
  CheckCircle2, Clock, Video, Presentation as PresIcon, CircleDot, ChevronDown,
  Paperclip, ExternalLink, Check,
} from 'lucide-react'

/* ================================================================
   نظرة المعهد الشاملة على التدريب — تبويبات: الطلاب، المحاضرات،
   الامتحانات، الوظائف، التحديات، الحضور، العروض التقديمية
   ================================================================ */

interface Question { id: string; text: string; type: string | null; options: unknown; correct: string | null; marks: number | null; explanation?: string | null; image_url?: string | null }
interface Overview {
  students: { id: string; name: string; avatar: string | null; progress: number | null; enrolled_at: string; completed: boolean }[]
  lectures: { id: string; title: string; order_index: number; duration: number | null; published: boolean; description: string | null; content: string | null; video_url: string | null; presentation_url: string | null; attachments: unknown }[]
  exams: { id: string; title: string; description: string | null; instructions: string | null; total_marks: number | null; passing_marks: number | null; duration: number | null; active: boolean; starts_at: string | null; questions: Question[] }[]
  assignments: { id: string; title: string; description: string | null; instructions: string | null; attachments: unknown; total_marks: number | null; due_date: string | null; active: boolean }[]
  challenges: { id: string; title: string; description: string | null; instructions: string | null; type: string | null; total_marks: number | null; time_limit: number | null; active: boolean; starts_at: string | null; questions: Question[] }[]
  attendance: { id: string; title: string; created_at: string; active: boolean; closed: boolean; present: number; attendees: { name: string; avatar: string | null; status: string }[] }[]
  presentations: { id: string; title: string; description: string | null; created_at: string; slides_count: number; slides: { type: string | null; title: string | null; body: string | null }[] }[]
}

// عناصر مساعدة للمحتوى الموسّع
function asLinks(att: unknown): { name: string; url: string }[] {
  if (!Array.isArray(att)) return []
  return att.map((a) => {
    if (typeof a === 'string') return { name: 'مرفق', url: a }
    const o = a as { name?: string; title?: string; url?: string; link?: string }
    return { name: o.name ?? o.title ?? 'مرفق', url: o.url ?? o.link ?? '' }
  }).filter((x) => x.url)
}

function Expandable({ open, onToggle, header, children }: { open: boolean; onToggle: () => void; header: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-ruwad-sm bg-[#F5F6FA] overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-right">
        {header}
        <ChevronDown size={15} className={`shrink-0 text-ruwad-navy/35 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-white px-3.5 py-3 flex flex-col gap-3 bg-white/60">{children}</div>}
    </div>
  )
}

function QuestionsList({ questions }: { questions: Question[] }) {
  if (questions.length === 0) return <p className="text-[11px] text-ruwad-navy/40">لا أسئلة بعد.</p>
  return (
    <div className="flex flex-col gap-2.5">
      {questions.map((q, i) => {
        const opts = Array.isArray(q.options) ? (q.options as string[]) : []
        return (
          <div key={q.id} className="bg-white rounded-ruwad-sm p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-extrabold text-ruwad-navy leading-relaxed">س{i + 1}. {q.text}</p>
              {q.marks != null && <span className="shrink-0 text-[10px] font-extrabold text-ruwad-blue bg-ruwad-blue/10 rounded-full px-2 py-0.5">{q.marks} د</span>}
            </div>
            {q.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={q.image_url} alt="" className="rounded-lg max-h-40 object-contain self-start" />
            )}
            {opts.length > 0 && (
              <div className="flex flex-col gap-1">
                {opts.map((o, oi) => {
                  const correct = q.correct != null && (String(q.correct) === String(o) || String(q.correct) === String(oi))
                  return (
                    <div key={oi} className={`flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1.5 ${correct ? 'bg-green-50 text-green-700' : 'bg-[#F5F6FA] text-ruwad-navy/60'}`}>
                      {correct && <Check size={11} className="shrink-0" />} {o}
                    </div>
                  )
                })}
              </div>
            )}
            {opts.length === 0 && q.correct && (
              <p className="text-[11px] font-bold text-green-700 bg-green-50 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"><Check size={11} /> الإجابة: {q.correct}</p>
            )}
            {q.explanation && <p className="text-[10px] text-ruwad-navy/50 bg-amber-50/70 rounded-lg px-2.5 py-1.5">💡 {q.explanation}</p>}
          </div>
        )
      })}
    </div>
  )
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
  const [openId, setOpenId] = useState<string | null>(null)
  const toggle = (id: string) => setOpenId(openId === id ? null : id)

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

        {/* ===== المحاضرات — المحتوى الكامل ===== */}
        {tab === 'lectures' && (
          data.lectures.length === 0 ? <EmptyRow label="لا محاضرات بعد." /> : (
            <div className="flex flex-col gap-1.5">
              {data.lectures.map((l) => (
                <Expandable key={l.id} open={openId === l.id} onToggle={() => toggle(l.id)}
                  header={
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-7 h-7 shrink-0 rounded-lg bg-ruwad-blue/10 text-ruwad-blue text-xs font-black flex items-center justify-center">{l.order_index}</span>
                      <p className="text-xs font-extrabold text-ruwad-navy truncate">{l.title}</p>
                      <span className="flex items-center gap-1.5 mr-auto text-ruwad-navy/40">
                        {l.video_url && <Video size={13} className="text-ruwad-blue/70" />}
                        {l.presentation_url && <PresIcon size={13} className="text-violet-500/70" />}
                        {l.duration && <span className="text-[10px] font-bold">{l.duration}د</span>}
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${l.published ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {l.published ? 'منشورة' : 'مخفية'}
                        </span>
                      </span>
                    </div>
                  }>
                  {l.description && <p className="text-[11px] font-bold text-ruwad-navy/60 leading-relaxed">{l.description}</p>}
                  {l.content && (
                    <div className="text-xs text-ruwad-navy/80 leading-relaxed whitespace-pre-wrap bg-white rounded-ruwad-sm p-3 max-h-72 overflow-y-auto">{l.content}</div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {l.video_url && (
                      <a href={l.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-extrabold text-white bg-ruwad-blue rounded-full px-3 py-1.5 hover:opacity-90">
                        <Video size={12} /> مشاهدة الفيديو <ExternalLink size={10} />
                      </a>
                    )}
                    {l.presentation_url && (
                      <a href={l.presentation_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-extrabold text-white bg-violet-500 rounded-full px-3 py-1.5 hover:opacity-90">
                        <PresIcon size={12} /> عرض الشرائح <ExternalLink size={10} />
                      </a>
                    )}
                    {asLinks(l.attachments).map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-extrabold text-ruwad-navy bg-ruwad-gray/40 rounded-full px-3 py-1.5 hover:bg-ruwad-gray/60">
                        <Paperclip size={11} /> {a.name}
                      </a>
                    ))}
                  </div>
                  {!l.description && !l.content && !l.video_url && !l.presentation_url && asLinks(l.attachments).length === 0 && (
                    <p className="text-[11px] text-ruwad-navy/40">لا محتوى مضاف لهذه المحاضرة بعد.</p>
                  )}
                </Expandable>
              ))}
            </div>
          )
        )}

        {/* ===== الامتحانات — بأسئلتها ===== */}
        {tab === 'exams' && (
          data.exams.length === 0 ? <EmptyRow label="لا امتحانات مرتبطة بهذا التدريب." /> : (
            <div className="flex flex-col gap-1.5">
              {data.exams.map((x) => (
                <Expandable key={x.id} open={openId === x.id} onToggle={() => toggle(x.id)}
                  header={
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-ruwad-navy truncate">{x.title}</p>
                        <p className="text-[10px] font-bold text-ruwad-navy/45 mt-0.5">
                          {x.questions.length} سؤالاً
                          {x.total_marks != null && <> · الدرجة {x.total_marks}{x.passing_marks != null && ` (النجاح ${x.passing_marks})`}</>}
                          {x.duration != null && <> · {x.duration}د</>}
                          {x.starts_at && <> · يبدأ {dateAr(x.starts_at)}</>}
                        </p>
                      </div>
                      <ActiveChip active={x.active} />
                    </div>
                  }>
                  {x.description && <p className="text-[11px] font-bold text-ruwad-navy/60">{x.description}</p>}
                  {x.instructions && <p className="text-[11px] text-ruwad-navy/60 bg-white rounded-ruwad-sm p-2.5 whitespace-pre-wrap">{x.instructions}</p>}
                  <QuestionsList questions={x.questions} />
                </Expandable>
              ))}
            </div>
          )
        )}

        {/* ===== الوظائف — بتعليماتها ومرفقاتها ===== */}
        {tab === 'assignments' && (
          data.assignments.length === 0 ? <EmptyRow label="لا وظائف مرتبطة بهذا التدريب." /> : (
            <div className="flex flex-col gap-1.5">
              {data.assignments.map((a) => {
                const late = a.due_date && new Date(a.due_date) < new Date()
                return (
                  <Expandable key={a.id} open={openId === a.id} onToggle={() => toggle(a.id)}
                    header={
                      <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-ruwad-navy truncate">{a.title}</p>
                          <p className="text-[10px] font-bold text-ruwad-navy/45 mt-0.5">
                            {a.total_marks != null && <>الدرجة {a.total_marks} · </>}
                            {a.due_date && <span className={late ? 'text-red-500 font-extrabold' : ''}>التسليم {dateAr(a.due_date)}</span>}
                          </p>
                        </div>
                        <ActiveChip active={a.active} />
                      </div>
                    }>
                    {a.description && <p className="text-[11px] font-bold text-ruwad-navy/60">{a.description}</p>}
                    {a.instructions && <p className="text-[11px] text-ruwad-navy/70 bg-white rounded-ruwad-sm p-2.5 whitespace-pre-wrap leading-relaxed">{a.instructions}</p>}
                    <div className="flex flex-wrap gap-2">
                      {asLinks(a.attachments).map((f, i) => (
                        <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-extrabold text-ruwad-navy bg-ruwad-gray/40 rounded-full px-3 py-1.5 hover:bg-ruwad-gray/60">
                          <Paperclip size={11} /> {f.name}
                        </a>
                      ))}
                    </div>
                    {!a.description && !a.instructions && asLinks(a.attachments).length === 0 && (
                      <p className="text-[11px] text-ruwad-navy/40">لا تفاصيل إضافية.</p>
                    )}
                  </Expandable>
                )
              })}
            </div>
          )
        )}

        {/* ===== التحديات — بأسئلتها ===== */}
        {tab === 'challenges' && (
          data.challenges.length === 0 ? <EmptyRow label="لا تحديات مرتبطة بهذا التدريب." /> : (
            <div className="flex flex-col gap-1.5">
              {data.challenges.map((c) => (
                <Expandable key={c.id} open={openId === c.id} onToggle={() => toggle(c.id)}
                  header={
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-ruwad-navy truncate flex items-center gap-1.5">
                          <Trophy size={12} className="text-amber-500 shrink-0" /> {c.title}
                        </p>
                        <p className="text-[10px] font-bold text-ruwad-navy/45 mt-0.5">
                          {c.questions.length} سؤالاً
                          {c.total_marks != null && <> · الدرجة {c.total_marks}</>}
                          {c.time_limit != null && <> · {c.time_limit}د</>}
                          {c.starts_at && <> · يبدأ {dateAr(c.starts_at)}</>}
                        </p>
                      </div>
                      <ActiveChip active={c.active} />
                    </div>
                  }>
                  {c.description && <p className="text-[11px] font-bold text-ruwad-navy/60">{c.description}</p>}
                  {c.instructions && <p className="text-[11px] text-ruwad-navy/60 bg-white rounded-ruwad-sm p-2.5 whitespace-pre-wrap">{c.instructions}</p>}
                  <QuestionsList questions={c.questions} />
                </Expandable>
              ))}
            </div>
          )
        )}

        {/* ===== الحضور — بأسماء الحاضرين ===== */}
        {tab === 'attendance' && (
          data.attendance.length === 0 ? <EmptyRow label="لا جلسات حضور لهذا التدريب." /> : (
            <div className="flex flex-col gap-1.5">
              {data.attendance.map((s) => (
                <Expandable key={s.id} open={openId === s.id} onToggle={() => toggle(s.id)}
                  header={
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
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
                  }>
                  {s.attendees.length === 0 ? (
                    <p className="text-[11px] text-ruwad-navy/40">لا تسجيلات حضور في هذه الجلسة.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {s.attendees.map((a, i) => (
                        <span key={i} className={`flex items-center gap-1.5 text-[11px] font-extrabold rounded-full pl-3 pr-1 py-1 ${a.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {a.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-white text-[9px] font-black flex items-center justify-center">{a.name.charAt(0)}</span>
                          )}
                          {a.name}{a.status !== 'approved' && ' ⏳'}
                        </span>
                      ))}
                    </div>
                  )}
                </Expandable>
              ))}
            </div>
          )
        )}

        {/* ===== العروض التقديمية — بشرائحها ===== */}
        {tab === 'presentations' && (
          data.presentations.length === 0 ? <EmptyRow label="لا عروض تقديمية لمدرب هذا التدريب." /> : (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold text-ruwad-navy/40 mb-1 flex items-center gap-1"><Clock size={10} /> عروض مدرب التدريب</p>
              {data.presentations.map((p) => (
                <Expandable key={p.id} open={openId === p.id} onToggle={() => toggle(p.id)}
                  header={
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-ruwad-navy truncate flex items-center gap-1.5">
                        <MonitorPlay size={12} className="text-violet-500 shrink-0" /> {p.title}
                      </p>
                      <span className="text-[10px] font-bold text-ruwad-navy/40 shrink-0">{p.slides_count} شريحة · {dateAr(p.created_at)}</span>
                    </div>
                  }>
                  {p.description && <p className="text-[11px] font-bold text-ruwad-navy/60">{p.description}</p>}
                  {p.slides.length === 0 ? (
                    <p className="text-[11px] text-ruwad-navy/40">لا شرائح بعد.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
                      {p.slides.map((sl, i) => (
                        <div key={i} className="bg-white rounded-ruwad-sm p-2.5">
                          <p className="text-[11px] font-extrabold text-ruwad-navy">{i + 1}. {sl.title ?? '(بلا عنوان)'}</p>
                          {sl.body && <p className="text-[10px] text-ruwad-navy/60 mt-1 whitespace-pre-wrap leading-relaxed line-clamp-4">{sl.body}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </Expandable>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
