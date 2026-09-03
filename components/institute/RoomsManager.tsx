'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DoorOpen, Plus, X, Loader2, Users, Wrench, Pencil, Trash2, CircleDot,
  CalendarPlus, Clock, ChevronDown, AlertTriangle, BookOpen,
} from 'lucide-react'

/* ================================================================
   قاعات المعهد — مواصفات وتجهيزات، حالة حية (متاحة/مشغولة الآن)،
   وحجز القاعة لتدريب بوقت محدد مع كشف التعارضات قبل الحفظ
   ================================================================ */

interface Room {
  id: string; name: string; capacity: number | null; notes: string | null
  equipment: string[]
}
interface RoomStatus {
  room_id: string; busy_now: boolean
  now_title: string | null; now_course: string | null; now_until: string | null
  next_title: string | null; next_starts: string | null
}
interface Booking {
  id: string; title: string; starts_at: string; ends_at: string | null
  room_id: string | null
  course: { title: string } | null
}
interface CourseOpt { id: string; title: string }

const TIME_FMT = new Intl.DateTimeFormat('ar', { hour: 'numeric', minute: '2-digit' })
const dateAr = (iso: string) => new Date(iso).toLocaleDateString('ar', { weekday: 'short', day: 'numeric', month: 'short' })

export function RoomsManager({ instituteId, initialRooms, statuses, bookings, courses }: {
  instituteId: string
  initialRooms: Room[]
  statuses: RoomStatus[]
  bookings: Booking[]
  courses: CourseOpt[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [editing, setEditing] = useState<Room | 'new' | null>(null)
  const [booking, setBooking] = useState<Room | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const statusOf = (id: string) => statuses.find((s) => s.room_id === id)
  const roomBookings = (id: string) => bookings.filter((b) => b.room_id === id)

  async function removeRoom(r: Room) {
    const n = roomBookings(r.id).length
    if (!confirm(`حذف قاعة "${r.name}"؟${n ? `\nستُفكّ عنها ${n} حجوزات قادمة (تبقى المواعيد بلا قاعة).` : ''}`)) return
    await supabase.from('institute_rooms').delete().eq('id', r.id)
    router.refresh()
  }

  async function removeBooking(b: Booking) {
    if (!confirm(`إلغاء حجز "${b.title}"؟\nسيُحذف الموعد من التقويم.`)) return
    await supabase.from('calendar_events').delete().eq('id', b.id)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ruwad-navy/60">{initialRooms.length} قاعة</p>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 bg-ruwad-blue text-white text-sm font-extrabold px-4 py-2.5 rounded-ruwad-sm hover:opacity-90 shadow-ruwad transition">
          <Plus size={16} /> قاعة جديدة
        </button>
      </div>

      {initialRooms.length === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-12 text-center flex flex-col items-center gap-3">
          <DoorOpen size={34} className="text-ruwad-blue/30" />
          <p className="text-sm text-ruwad-navy/50 font-medium">لا قاعات بعد — أضف أول قاعة لتبدأ جدولة تدريباتك عليها.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {initialRooms.map((r) => {
            const st = statusOf(r.id)
            const busy = st?.busy_now
            const list = roomBookings(r.id)
            const open = expanded === r.id
            return (
              <div key={r.id} className={`bg-white rounded-ruwad shadow-card overflow-hidden flex flex-col ${busy ? 'ring-2 ring-red-300' : ''}`}>
                {/* شريط الحالة */}
                <div className={`h-1.5 w-full ${busy ? 'bg-red-500' : 'bg-green-500'}`} />
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-ruwad-navy flex items-center gap-1.5"><DoorOpen size={16} className="text-ruwad-blue shrink-0" /> {r.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] font-bold text-ruwad-navy/50">
                        {r.capacity != null && <span className="flex items-center gap-1"><Users size={11} /> تتسع {r.capacity} طالباً</span>}
                        {r.notes && <span>{r.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditing(r)} title="تعديل"
                        className="w-8 h-8 rounded-full text-ruwad-navy/35 hover:text-ruwad-blue hover:bg-ruwad-blue/10 flex items-center justify-center transition"><Pencil size={14} /></button>
                      <button onClick={() => removeRoom(r)} title="حذف"
                        className="w-8 h-8 rounded-full text-ruwad-navy/25 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* التجهيزات */}
                  {r.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.equipment.map((e, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] font-extrabold text-ruwad-navy/60 bg-[#F5F6FA] rounded-full px-2.5 py-1">
                          <Wrench size={9} /> {e}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* الحالة الآن */}
                  <div className={`rounded-ruwad-sm px-3.5 py-2.5 ${busy ? 'bg-red-50' : 'bg-green-50'}`}>
                    {busy ? (
                      <>
                        <p className="text-xs font-extrabold text-red-600 flex items-center gap-1.5">
                          <CircleDot size={12} className="animate-pulse" /> مشغولة الآن — {st?.now_course ?? st?.now_title}
                        </p>
                        {st?.now_until && <p className="text-[10px] font-bold text-red-500/70 mt-0.5">حتى {TIME_FMT.format(new Date(st.now_until))}</p>}
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-extrabold text-green-600 flex items-center gap-1.5"><CircleDot size={12} /> متاحة الآن</p>
                        {st?.next_starts && (
                          <p className="text-[10px] font-bold text-green-700/60 mt-0.5">
                            الحجز القادم: {st.next_title} · {dateAr(st.next_starts)} {TIME_FMT.format(new Date(st.next_starts))}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* الحجوزات */}
                  <div className="mt-auto flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setBooking(r)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-ruwad-navy text-white text-xs font-extrabold py-2.5 rounded-ruwad-sm hover:opacity-90 transition">
                        <CalendarPlus size={14} /> حجز القاعة
                      </button>
                      <button onClick={() => setExpanded(open ? null : r.id)}
                        className="flex items-center gap-1 text-[11px] font-extrabold text-ruwad-navy/50 bg-[#F5F6FA] hover:bg-ruwad-gray/40 rounded-ruwad-sm px-3 py-2.5 transition">
                        الحجوزات ({list.length}) <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {open && (
                      list.length === 0 ? (
                        <p className="text-[11px] text-ruwad-navy/40 text-center py-2">لا حجوزات قادمة.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {list.map((b) => (
                            <div key={b.id} className="flex items-center justify-between gap-2 text-[11px] bg-[#F5F6FA] rounded-lg px-3 py-2">
                              <span className="font-extrabold text-ruwad-navy truncate flex items-center gap-1.5">
                                <Clock size={11} className="text-ruwad-blue shrink-0" />
                                {dateAr(b.starts_at)} {TIME_FMT.format(new Date(b.starts_at))}
                                {b.ends_at && <>–{TIME_FMT.format(new Date(b.ends_at))}</>}
                                <span className="text-ruwad-navy/50 font-bold">· {b.course?.title ?? b.title}</span>
                              </span>
                              <button onClick={() => removeBooking(b)} className="text-ruwad-navy/25 hover:text-red-500 shrink-0"><Trash2 size={12} /></button>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <RoomModal instituteId={instituteId} room={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh() }} />
      )}
      {booking && (
        <BookingModal instituteId={instituteId} room={booking} courses={courses}
          onClose={() => setBooking(null)} onSaved={() => { setBooking(null); router.refresh() }} />
      )}
    </div>
  )
}

/* ================= إضافة/تعديل قاعة ================= */

function RoomModal({ instituteId, room, onClose, onSaved }: {
  instituteId: string; room: Room | null; onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [name, setName] = useState(room?.name ?? '')
  const [capacity, setCapacity] = useState(room?.capacity ? String(room.capacity) : '')
  const [equipment, setEquipment] = useState<string[]>(room?.equipment ?? [])
  const [equipDraft, setEquipDraft] = useState('')
  const [notes, setNotes] = useState(room?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addEquip() {
    const v = equipDraft.trim()
    if (v && !equipment.includes(v)) setEquipment([...equipment, v])
    setEquipDraft('')
  }

  async function save() {
    if (name.trim().length < 1) { setError('اكتب اسم القاعة'); return }
    setSaving(true); setError('')
    const payload = {
      institute_id: instituteId,
      name: name.trim(),
      capacity: capacity ? Number(capacity) : null,
      equipment,
      notes: notes.trim() || null,
    }
    const { error: err } = room
      ? await supabase.from('institute_rooms').update(payload).eq('id', room.id)
      : await supabase.from('institute_rooms').insert(payload)
    setSaving(false)
    if (err) { setError(err.code === '23505' ? 'يوجد قاعة بهذا الاسم' : 'تعذّر الحفظ'); return }
    onSaved()
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'
  const SUGGESTED = ['بروجكتور', 'سبورة ذكية', 'تكييف', 'حواسيب', 'إنترنت', 'ميكروفون']

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-md rounded-t-ruwad sm:rounded-ruwad max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray sticky top-0 bg-white">
          <h3 className="font-extrabold text-ruwad-navy">{room ? 'تعديل القاعة' : 'قاعة جديدة'}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">اسم القاعة *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="القاعة الكبرى" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">السعة</span>
              <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="30" className={inputCls} />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-extrabold text-ruwad-navy">التجهيزات</span>
            <div className="flex gap-2">
              <input value={equipDraft} onChange={(e) => setEquipDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEquip() } }}
                placeholder="اكتب تجهيزاً واضغط +" className={inputCls} />
              <button onClick={addEquip} className="shrink-0 w-11 rounded-ruwad-sm bg-ruwad-navy text-white flex items-center justify-center"><Plus size={16} /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED.filter((s) => !equipment.includes(s)).map((s) => (
                <button key={s} onClick={() => setEquipment([...equipment, s])}
                  className="text-[10px] font-extrabold text-ruwad-navy/50 border-2 border-dashed border-ruwad-gray rounded-full px-2.5 py-1 hover:border-ruwad-blue hover:text-ruwad-blue transition">
                  + {s}
                </button>
              ))}
            </div>
            {equipment.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {equipment.map((e) => (
                  <span key={e} className="flex items-center gap-1 text-[11px] font-extrabold text-white bg-ruwad-blue rounded-full pr-3 pl-1.5 py-1">
                    {e}
                    <button onClick={() => setEquipment(equipment.filter((x) => x !== e))} className="hover:bg-white/20 rounded-full p-0.5"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">ملاحظات</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="الطابق الثاني، تحتاج تهوية..." className={inputCls} />
          </label>

          {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
          <button onClick={save} disabled={saving}
            className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
            {saving && <Loader2 size={15} className="animate-spin" />} {room ? 'حفظ التعديلات' : 'إضافة القاعة'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================= حجز القاعة لتدريب (مع كشف التعارضات) ================= */

function BookingModal({ instituteId, room, courses, onClose, onSaved }: {
  instituteId: string; room: Room; courses: CourseOpt[]
  onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [courseId, setCourseId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('16:00')
  const [duration, setDuration] = useState(2)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [trainerWarning, setTrainerWarning] = useState<string | null>(null)

  const startsIso = useMemo(() => new Date(`${date}T${startTime}:00`).toISOString(), [date, startTime])
  const endsIso = useMemo(() => new Date(new Date(startsIso).getTime() + duration * 3600000).toISOString(), [startsIso, duration])

  async function save(ignoreTrainerConflict = false) {
    if (!courseId) { setError('اختر التدريب'); return }
    setSaving(true); setError(''); setTrainerWarning(null)

    // كشف التعارضات قبل الحفظ: تعارض القاعة يمنع، تعارض المدرب يحذّر
    const { data: conflicts } = await supabase.rpc('check_event_conflicts', {
      p_course_id: courseId,
      p_starts_at: startsIso,
      p_ends_at: endsIso,
      p_room_id: room.id,
    })
    const conf = conflicts as { room: { title: string; starts_at: string } | null; trainer: { title: string; starts_at: string } | null } | null
    if (conf?.room) {
      setSaving(false)
      setError(`القاعة محجوزة في هذا الوقت: "${conf.room.title}" (${TIME_FMT.format(new Date(conf.room.starts_at))}) — اختر وقتاً آخر`)
      return
    }
    if (conf?.trainer && !ignoreTrainerConflict) {
      setSaving(false)
      setTrainerWarning(`مدرب هذا التدريب لديه موعد متداخل: "${conf.trainer.title}" — هل تريد الحجز رغم ذلك؟`)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    const courseTitle = courses.find((c) => c.id === courseId)?.title ?? 'تدريب'
    const { error: err } = await supabase.from('calendar_events').insert({
      course_id: courseId,
      institute_id: instituteId,
      room_id: room.id,
      created_by: session!.user.id,
      title: title.trim() || `${courseTitle} — ${room.name}`,
      starts_at: startsIso,
      ends_at: endsIso,
    })
    setSaving(false)
    if (err) { setError('تعذّر الحجز — أعد المحاولة'); return }
    onSaved()
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-md rounded-t-ruwad sm:rounded-ruwad max-h-[92vh] overflow-y-auto">
        <div className="h-1.5 w-full bg-ruwad-gradient" />
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray">
          <h3 className="font-extrabold text-ruwad-navy flex items-center gap-1.5"><DoorOpen size={16} className="text-ruwad-blue" /> حجز {room.name}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">التدريب *</span>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
              <option value="">— اختر —</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">اليوم *</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">الساعة *</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">المدة</span>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls}>
                {[1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].map((h) => <option key={h} value={h}>{h} ساعة</option>)}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">عنوان الموعد (اختياري)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="يُولَّد تلقائياً من التدريب والقاعة" className={inputCls} />
          </label>
          <p className="text-[11px] font-bold text-ruwad-navy/50 bg-ruwad-blue/5 rounded-ruwad-sm px-3 py-2 flex items-center gap-1.5">
            <BookOpen size={12} className="text-ruwad-blue shrink-0" /> سيظهر الحجز في تقويم المعهد والمدرب وطلاب التدريب تلقائياً.
          </p>

          {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
          {trainerWarning ? (
            <div className="flex flex-col gap-2 bg-amber-50 border-2 border-amber-300 rounded-ruwad-sm p-3">
              <p className="text-xs font-extrabold text-amber-700 flex items-start gap-1.5"><AlertTriangle size={14} className="shrink-0 mt-0.5" /> {trainerWarning}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => save(true)} disabled={saving}
                  className="bg-amber-500 text-white text-xs font-extrabold py-2.5 rounded-ruwad-sm hover:bg-amber-600 disabled:opacity-60">احجز رغم التعارض</button>
                <button onClick={() => setTrainerWarning(null)}
                  className="bg-white text-ruwad-navy/60 text-xs font-extrabold py-2.5 rounded-ruwad-sm border-2 border-ruwad-gray">تغيير الوقت</button>
              </div>
            </div>
          ) : (
            <button onClick={() => save(false)} disabled={saving}
              className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
              {saving && <Loader2 size={15} className="animate-spin" />} <CalendarPlus size={16} /> تأكيد الحجز
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
