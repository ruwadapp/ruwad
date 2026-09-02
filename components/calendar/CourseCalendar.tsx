'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronRight, ChevronLeft, Plus, X, Clock, MapPin, BookOpen,
  Building2, UserRound, Trash2, Pencil, CalendarDays, Loader2, ClipboardCheck,
} from 'lucide-react'

/* ================= الأنواع ================= */

export interface CalCourse { id: string; title: string }

export interface CalendarMeta {
  mode: 'trainer' | 'institute' | 'student'
  userId: string
  /** للمعهد فقط: يُسجَّل على الأحداث الجديدة */
  instituteId?: string
  /** الكورسات المتاحة للإضافة (المدرب: كورساته، المعهد: المشتركة معه) وللفلترة */
  courses: CalCourse[]
}

interface CalEvent {
  id: string
  course_id: string
  institute_id: string | null
  created_by: string
  title: string
  description: string | null
  location: string | null
  color: string | null
  starts_at: string
  ends_at: string | null
  attendance_session_id: string | null
  course: { title: string } | null
  institute: { name: string } | null
  attendance_session: { session_code: string; is_active: boolean; closed_at: string | null } | null
}

/* ================= أدوات التاريخ (الأسبوع يبدأ السبت) ================= */

const DAY_NAMES = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
const MONTH_FMT = new Intl.DateTimeFormat('ar', { month: 'long', year: 'numeric' })
const TIME_FMT = new Intl.DateTimeFormat('ar', { hour: 'numeric', minute: '2-digit' })
const DAY_FMT = new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long' })

function startOfGrid(view: Date) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const back = (first.getDay() + 1) % 7 // السبت=0 في شبكتنا
  const d = new Date(first)
  d.setDate(d.getDate() - back)
  return d
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function toLocalInputs(iso: string) {
  const d = new Date(iso)
  return { date: ymd(d), time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
}

const PALETTE = ['#3A4EFB', '#33A4FA', '#252943', '#16a34a', '#d97706', '#dc2626']

/* ================= المكوّن الرئيسي ================= */

export function CourseCalendar({ meta }: { meta: CalendarMeta }) {
  const supabase = createClient()
  const canEditAny = meta.mode !== 'student'

  const [view, setView] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>(ymd(new Date()))
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [modal, setModal] = useState<{ open: boolean; event?: CalEvent; day?: string }>({ open: false })

  const gridStart = useMemo(() => startOfGrid(view), [view])
  const days = useMemo(() => Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(d.getDate() + i); return d
  }), [gridStart])

  const load = useCallback(async () => {
    setLoading(true)
    const from = new Date(gridStart); const to = new Date(gridStart); to.setDate(to.getDate() + 42)
    const { data } = await supabase
      .from('calendar_events')
      .select('*, course:courses(title), institute:institutes(name), attendance_session:attendance_sessions(session_code, is_active, closed_at)')
      .gte('starts_at', from.toISOString())
      .lt('starts_at', to.toISOString())
      .order('starts_at')
    setEvents((data as CalEvent[]) ?? [])
    setLoading(false)
  }, [supabase, gridStart])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(
    () => courseFilter === 'all' ? events : events.filter((e) => e.course_id === courseFilter),
    [events, courseFilter],
  )
  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>()
    for (const e of filtered) {
      const k = ymd(new Date(e.starts_at))
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(e)
    }
    return m
  }, [filtered])

  const todayKey = ymd(new Date())
  const dayEvents = byDay.get(selectedDay) ?? []

  function canEdit(e: CalEvent) {
    if (meta.mode === 'student') return false
    if (e.created_by === meta.userId) return true
    return meta.mode === 'institute' && !!meta.instituteId && e.institute_id === meta.instituteId
  }
  function eventColor(e: CalEvent) {
    return e.color ?? (e.institute_id ? '#252943' : '#3A4EFB')
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      {/* شريط التحكم */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))} aria-label="الشهر السابق"
            className="w-9 h-9 rounded-full bg-white border-2 border-ruwad-navy shadow-hard-sm hover-pop flex items-center justify-center">
            <ChevronRight size={16} className="text-ruwad-navy" />
          </button>
          <h2 className="text-lg sm:text-xl font-extrabold text-ruwad-navy min-w-[9rem] text-center">{MONTH_FMT.format(view)}</h2>
          <button onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))} aria-label="الشهر التالي"
            className="w-9 h-9 rounded-full bg-white border-2 border-ruwad-navy shadow-hard-sm hover-pop flex items-center justify-center">
            <ChevronLeft size={16} className="text-ruwad-navy" />
          </button>
          <button onClick={() => { const d = new Date(); setView(new Date(d.getFullYear(), d.getMonth(), 1)); setSelectedDay(ymd(d)) }}
            className="text-xs font-extrabold text-ruwad-navy bg-ruwad-lime border-2 border-ruwad-navy rounded-full px-3.5 py-1.5 shadow-hard-sm hover-pop">
            اليوم
          </button>
          {loading && <Loader2 size={16} className="animate-spin text-ruwad-navy/40" />}
        </div>

        <div className="flex items-center gap-3">
          {meta.courses.length > 1 && (
            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}
              className="text-sm font-bold text-ruwad-navy bg-white border-2 border-ruwad-navy rounded-ruwad-sm px-3 py-2 shadow-hard-sm">
              <option value="all">كل التدريبات</option>
              {meta.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          )}
          {canEditAny && (
            <button onClick={() => setModal({ open: true, day: selectedDay })}
              className="flex items-center gap-1.5 bg-ruwad-blue text-white text-sm font-extrabold px-4 py-2.5 rounded-ruwad-sm border-2 border-ruwad-navy shadow-hard-sm hover-pop">
              <Plus size={16} /> إضافة موعد
            </button>
          )}
        </div>
      </div>

      {/* دليل الألوان */}
      <div className="flex items-center gap-4 text-xs font-bold text-ruwad-navy/60">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-ruwad-blue" /> موعد مدرب</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-ruwad-navy" /> موعد معهد</span>
      </div>

      {/* الشبكة الشهرية */}
      <div className="bg-white border-2 border-ruwad-navy rounded-ruwad shadow-hard overflow-hidden">
        <div className="grid grid-cols-7 bg-ruwad-navy">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[11px] sm:text-xs font-extrabold text-white py-2.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const key = ymd(d)
            const inMonth = d.getMonth() === view.getMonth()
            const evs = byDay.get(key) ?? []
            const isToday = key === todayKey
            const isSelected = key === selectedDay
            return (
              <button key={key} onClick={() => setSelectedDay(key)}
                className={`min-h-[4.2rem] sm:min-h-[5.5rem] border-t border-l border-ruwad-gray/60 p-1 sm:p-1.5 flex flex-col items-stretch gap-1 text-start transition-colors
                  ${inMonth ? 'bg-white' : 'bg-ruwad-gray/20'}
                  ${isSelected ? 'ring-2 ring-inset ring-ruwad-blue' : 'hover:bg-ruwad-gray/25'}`}>
                <span className={`self-end text-[11px] sm:text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-ruwad-lime border-2 border-ruwad-navy text-ruwad-navy' : inMonth ? 'text-ruwad-navy' : 'text-ruwad-navy/30'}`}>
                  {d.getDate()}
                </span>
                <span className="hidden sm:flex flex-col gap-0.5">
                  {evs.slice(0, 2).map((e) => (
                    <span key={e.id} className="truncate text-[10px] font-bold text-white rounded px-1 py-0.5"
                      style={{ backgroundColor: eventColor(e) }}>
                      {e.title}
                    </span>
                  ))}
                  {evs.length > 2 && <span className="text-[10px] font-extrabold text-ruwad-blue">+{evs.length - 2}</span>}
                </span>
                {evs.length > 0 && (
                  <span className="sm:hidden flex gap-0.5 justify-center">
                    {evs.slice(0, 3).map((e) => (
                      <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: eventColor(e) }} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* مواعيد اليوم المحدد */}
      <div className="bg-white border-2 border-ruwad-navy rounded-ruwad shadow-hard p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-ruwad-navy flex items-center gap-2">
            <CalendarDays size={18} className="text-ruwad-blue" />
            {DAY_FMT.format(new Date(selectedDay + 'T12:00:00'))}
          </h3>
          {canEditAny && (
            <button onClick={() => setModal({ open: true, day: selectedDay })}
              className="text-xs font-extrabold text-ruwad-blue hover:underline flex items-center gap-1">
              <Plus size={13} /> موعد في هذا اليوم
            </button>
          )}
        </div>
        {dayEvents.length === 0 ? (
          <p className="text-sm text-ruwad-navy/50 font-medium">لا مواعيد في هذا اليوم.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {dayEvents.map((e) => (
              <li key={e.id} className="flex items-start gap-3 border-2 border-ruwad-gray rounded-ruwad-sm p-3.5">
                <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: eventColor(e) }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-ruwad-navy">{e.title}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border
                      ${e.institute_id ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-ruwad-blue/10 text-ruwad-blue border-ruwad-blue/30'}`}>
                      {e.institute_id ? <><Building2 size={10} /> {e.institute?.name ?? 'معهد'}</> : <><UserRound size={10} /> المدرب</>}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-ruwad-navy/60 font-medium">
                    <span className="flex items-center gap-1"><Clock size={12} />
                      {TIME_FMT.format(new Date(e.starts_at))}{e.ends_at ? ` – ${TIME_FMT.format(new Date(e.ends_at))}` : ''}
                    </span>
                    {e.course?.title && <span className="flex items-center gap-1"><BookOpen size={12} /> {e.course.title}</span>}
                    {e.location && <span className="flex items-center gap-1"><MapPin size={12} /> {e.location}</span>}
                  </div>
                  {e.description && <p className="text-xs text-ruwad-navy/70 mt-1.5 leading-relaxed">{e.description}</p>}
                  {e.attendance_session_id && e.attendance_session && (
                    e.attendance_session.is_active ? (
                      <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border-2 border-emerald-300 rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        الحضور مفتوح الآن
                        {meta.mode !== 'student' && <span className="font-black tracking-widest">· {e.attendance_session.session_code}</span>}
                      </span>
                    ) : e.attendance_session.closed_at ? (
                      <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-ruwad-navy/45 bg-ruwad-gray/25 rounded-full px-2.5 py-1">
                        <ClipboardCheck size={11} /> انتهت جلسة الحضور
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-ruwad-blue bg-ruwad-blue/10 border border-ruwad-blue/25 rounded-full px-2.5 py-1">
                        <ClipboardCheck size={11} /> حضور تلقائي عند بدء الموعد
                      </span>
                    )
                  )}
                </div>
                {canEdit(e) && (
                  <button onClick={() => setModal({ open: true, event: e })} aria-label="تعديل"
                    className="w-8 h-8 rounded-full border-2 border-ruwad-gray hover:border-ruwad-blue hover:text-ruwad-blue text-ruwad-navy/50 flex items-center justify-center shrink-0">
                    <Pencil size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal.open && (
        <EventModal meta={meta} event={modal.event} defaultDay={modal.day ?? selectedDay}
          onClose={() => setModal({ open: false })}
          onSaved={() => { setModal({ open: false }); load() }} />
      )}
    </div>
  )
}

/* ================= نافذة إضافة/تعديل ================= */

function EventModal({ meta, event, defaultDay, onClose, onSaved }: {
  meta: CalendarMeta; event?: CalEvent; defaultDay: string; onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const start = event ? toLocalInputs(event.starts_at) : { date: defaultDay, time: '16:00' }
  const end = event?.ends_at ? toLocalInputs(event.ends_at) : null

  const [title, setTitle] = useState(event?.title ?? '')
  const [courseId, setCourseId] = useState(event?.course_id ?? meta.courses[0]?.id ?? '')
  const [date, setDate] = useState(start.date)
  const [startTime, setStartTime] = useState(start.time)
  const [endTime, setEndTime] = useState(end?.time ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [color, setColor] = useState(event?.color ?? (meta.mode === 'institute' ? '#252943' : '#3A4EFB'))
  const [autoAttendance, setAutoAttendance] = useState(!!event?.attendance_session_id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!title.trim() || !courseId || !date || !startTime) { setError('العنوان والتدريب والتاريخ ووقت البداية مطلوبة'); return }
    const starts = new Date(`${date}T${startTime}`)
    const ends = endTime ? new Date(`${date}T${endTime}`) : null
    if (ends && ends <= starts) { setError('وقت النهاية يجب أن يكون بعد البداية'); return }
    if (autoAttendance && !ends) { setError('الحضور التلقائي يتطلب تحديد وقت نهاية — منه تُحسب مدة الجلسة'); return }
    setSaving(true); setError('')
    const payload = {
      title: title.trim(), course_id: courseId, location: location.trim() || null,
      description: description.trim() || null, color,
      starts_at: starts.toISOString(), ends_at: ends ? ends.toISOString() : null,
    }
    let eventId = event?.id ?? null
    if (event) {
      const { error: err } = await supabase.from('calendar_events').update(payload).eq('id', event.id)
      if (err) { setSaving(false); setError('تعذّر الحفظ — تأكد من صلاحياتك على هذا التدريب'); return }
    } else {
      const { data: created, error: err } = await supabase.from('calendar_events').insert({
        ...payload, created_by: meta.userId,
        institute_id: meta.mode === 'institute' ? meta.instituteId : null,
      }).select('id').single()
      if (err || !created) { setSaving(false); setError('تعذّر الحفظ — تأكد من صلاحياتك على هذا التدريب'); return }
      eventId = created.id
    }
    // مزامنة الحضور التلقائي (إنشاء الجلسة أو حذفها/فك ربطها)
    if (eventId && autoAttendance !== !!event?.attendance_session_id) {
      const { error: attErr } = await supabase.rpc('set_event_auto_attendance', { p_event_id: eventId, p_enabled: autoAttendance })
      if (attErr) { setSaving(false); setError('حُفظ الموعد لكن تعذّر ضبط جلسة الحضور — أعد المحاولة من التعديل'); return }
    }
    setSaving(false)
    onSaved()
  }

  async function remove() {
    if (!event || !confirm('حذف هذا الموعد نهائياً؟')) return
    setSaving(true)
    const { error: err } = await supabase.from('calendar_events').delete().eq('id', event.id)
    setSaving(false)
    if (err) { setError('تعذّر الحذف'); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-ruwad-navy/50 backdrop-blur-sm p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-lg rounded-t-ruwad sm:rounded-ruwad border-2 border-ruwad-navy shadow-hard max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray sticky top-0 bg-white">
          <h3 className="font-extrabold text-ruwad-navy">{event ? 'تعديل الموعد' : 'موعد جديد'}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>

        <div className="p-5 grid sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">عنوان الموعد *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: محاضرة الوحدة الثالثة"
              className="border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none" />
          </label>

          <label className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">التدريب *</span>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
              className="border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none bg-white">
              {meta.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">التاريخ *</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">البداية *</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3 py-2.5 text-sm font-semibold text-ruwad-navy outline-none" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">النهاية</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3 py-2.5 text-sm font-semibold text-ruwad-navy outline-none" />
            </label>
          </div>

          <label className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">المكان</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="قاعة، رابط زوم…"
              className="border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none" />
          </label>

          <label className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">وصف</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none resize-none" />
          </label>

          <button type="button" onClick={() => setAutoAttendance((v) => !v)}
            className={`sm:col-span-2 flex items-center gap-3 rounded-ruwad-sm border-2 px-3.5 py-3 text-right transition ${
              autoAttendance ? 'border-emerald-400 bg-emerald-50' : 'border-ruwad-gray bg-white hover:border-emerald-300'}`}>
            <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${autoAttendance ? 'bg-emerald-500' : 'bg-ruwad-gray'}`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${autoAttendance ? 'right-6' : 'right-1'}`} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-ruwad-navy flex items-center gap-1.5">
                <ClipboardCheck size={15} className={autoAttendance ? 'text-emerald-600' : 'text-ruwad-navy/40'} /> جلسة حضور تلقائية
              </span>
              <span className="block text-[11px] text-ruwad-navy/55 font-medium mt-0.5">
                تُفعَّل عند بدء الموعد وتُغلق عند نهايته، مع إشعار طلاب الكورس بالكود — تتطلب وقت نهاية
              </span>
              {event?.attendance_session_id && event.attendance_session && autoAttendance && (
                <span className="block text-[11px] font-extrabold text-emerald-700 mt-1">
                  كود الجلسة: <span className="tracking-widest font-black">{event.attendance_session.session_code}</span>
                </span>
              )}
            </span>
          </button>

          <div className="sm:col-span-2 flex items-center gap-2.5">
            <span className="text-xs font-extrabold text-ruwad-navy">اللون:</span>
            {PALETTE.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-label={`لون ${c}`}
                className={`w-7 h-7 rounded-full border-2 transition ${color === c ? 'border-ruwad-navy scale-110 shadow-hard-sm' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>

          {error && <p className="sm:col-span-2 text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
        </div>

        <div className="flex items-center gap-3 px-5 pb-5">
          <button onClick={save} disabled={saving}
            className="flex-1 bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm border-2 border-ruwad-navy shadow-hard-sm hover-pop disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={15} className="animate-spin" />} {event ? 'حفظ التعديلات' : 'إضافة الموعد'}
          </button>
          {event && (
            <button onClick={remove} disabled={saving} aria-label="حذف"
              className="w-12 h-12 rounded-ruwad-sm border-2 border-red-300 text-red-500 hover:bg-red-50 flex items-center justify-center">
              <Trash2 size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
