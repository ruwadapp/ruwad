'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Plus, X, Loader2, UserRound, Briefcase, Clock, CalendarDays,
  Wallet, Trash2, Pencil, Check, XCircle, ChevronDown, Phone, Building2,
} from 'lucide-react'

/* ================================================================
   الفريق — مدربون منضمّون + موظفون إداريون: عقود، دوام، رواتب، إجازات
   ================================================================ */

const DAYS: { key: string; label: string }[] = [
  { key: 'sat', label: 'سبت' }, { key: 'sun', label: 'أحد' }, { key: 'mon', label: 'إثنين' },
  { key: 'tue', label: 'ثلاثاء' }, { key: 'wed', label: 'أربعاء' }, { key: 'thu', label: 'خميس' }, { key: 'fri', label: 'جمعة' },
]
const CUR: Record<string, string> = { SYP: 'ل.س', USD: '$' }
const fmt = (n: number) => Number(n).toLocaleString('ar')

interface TrainerRow {
  membership_id: string; user_id: string; full_name: string; avatar_url: string | null; phone: string | null
  job_title: string | null; hire_date: string | null; work_days: string[]; work_start: string | null; work_end: string | null
  annual_leave_days: number; comp_type: 'percent' | 'fixed_monthly' | null; comp_value: number | null; comp_currency: string | null
  leave_used: number
}
interface StaffRow {
  id: string; full_name: string; phone: string | null; job_title: string; contract_type: 'monthly' | 'hourly'
  salary: number | null; hourly_rate: number | null; currency: string; hire_date: string | null
  work_days: string[]; work_start: string | null; work_end: string | null; annual_leave_days: number
  status: 'active' | 'inactive'; notes: string | null; leave_used: number
}
interface PendingRow { id: string; full_name: string; avatar_url: string | null; created_at: string }
interface SearchTrainer { id: string; name: string; avatar: string | null; bio: string | null; membership: string | null }

export function TeamManager({ instituteId, trainers, staff, pendingInvites, joinRequests }: {
  instituteId: string
  trainers: TrainerRow[]; staff: StaffRow[]
  pendingInvites: PendingRow[]; joinRequests: PendingRow[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState<'trainers' | 'staff'>('trainers')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [staffModal, setStaffModal] = useState<null | StaffRow | 'new'>(null)
  const [hoursModal, setHoursModal] = useState<TrainerRow | null>(null)
  const [compModal, setCompModal] = useState<TrainerRow | null>(null)
  const [leaveTarget, setLeaveTarget] = useState<{ kind: 'trainer' | 'staff'; id: string; name: string; annual: number; used: number } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function respondJoinRequest(id: string, approve: boolean) {
    await supabase.from('institute_members').update({
      status: approve ? 'approved' : 'rejected', responded_at: new Date().toISOString(),
    }).eq('id', id)
    router.refresh()
  }

  async function removeTrainer(t: TrainerRow) {
    if (!confirm(`إزالة "${t.full_name}" من فريق المعهد؟`)) return
    await supabase.from('institute_members').delete().eq('id', t.membership_id)
    router.refresh()
  }

  async function toggleStaffStatus(s: StaffRow) {
    await supabase.from('institute_staff').update({ status: s.status === 'active' ? 'inactive' : 'active' }).eq('id', s.id)
    router.refresh()
  }
  async function removeStaff(s: StaffRow) {
    if (!confirm(`حذف "${s.full_name}" من سجل الموظفين نهائياً؟`)) return
    await supabase.from('institute_staff').delete().eq('id', s.id)
    router.refresh()
  }

  const dayLabels = (days: string[]) => days.length === 0 ? '—' : days.map((d) => DAYS.find((x) => x.key === d)?.label ?? d).join('، ')

  return (
    <div className="flex flex-col gap-5">
      {/* دعوات وطلبات معلّقة */}
      {(pendingInvites.length > 0 || joinRequests.length > 0) && (
        <div className="flex flex-col gap-3">
          {joinRequests.length > 0 && (
            <div className="bg-white rounded-ruwad shadow-card p-4">
              <p className="text-sm font-extrabold text-ruwad-navy mb-3">طلبات انضمام مدربين ({joinRequests.length})</p>
              <div className="flex flex-col gap-2">
                {joinRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 bg-amber-50 rounded-ruwad-sm px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={r.full_name} url={r.avatar_url} />
                      <span className="text-sm font-extrabold text-ruwad-navy truncate">{r.full_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => respondJoinRequest(r.id, true)} className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600"><Check size={14} /></button>
                      <button onClick={() => respondJoinRequest(r.id, false)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"><XCircle size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {pendingInvites.length > 0 && (
            <div className="bg-white rounded-ruwad shadow-card p-4">
              <p className="text-sm font-extrabold text-ruwad-navy/60 mb-3">دعوات أُرسلت وبانتظار الرد ({pendingInvites.length})</p>
              <div className="flex flex-wrap gap-2">
                {pendingInvites.map((r) => (
                  <span key={r.id} className="flex items-center gap-2 bg-[#F5F6FA] rounded-full pl-3 pr-1 py-1">
                    <Avatar name={r.full_name} url={r.avatar_url} size={7} />
                    <span className="text-xs font-bold text-ruwad-navy/60">{r.full_name}</span>
                    <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">بالانتظار</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* تبويبان + أزرار الإضافة */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 bg-white rounded-ruwad shadow-card p-1.5">
          <button onClick={() => setTab('trainers')}
            className={`flex items-center gap-1.5 text-sm font-extrabold px-4 py-2 rounded-ruwad-sm transition ${tab === 'trainers' ? 'bg-ruwad-navy text-white' : 'text-ruwad-navy/50 hover:bg-ruwad-gray/30'}`}>
            <UserRound size={15} /> المدربون ({trainers.length})
          </button>
          <button onClick={() => setTab('staff')}
            className={`flex items-center gap-1.5 text-sm font-extrabold px-4 py-2 rounded-ruwad-sm transition ${tab === 'staff' ? 'bg-ruwad-navy text-white' : 'text-ruwad-navy/50 hover:bg-ruwad-gray/30'}`}>
            <Briefcase size={15} /> الموظفون ({staff.length})
          </button>
        </div>
        <button onClick={() => tab === 'trainers' ? setInviteOpen(true) : setStaffModal('new')}
          className="flex items-center gap-1.5 bg-ruwad-blue text-white text-sm font-extrabold px-4 py-2.5 rounded-ruwad-sm hover:opacity-90 shadow-ruwad transition">
          <Plus size={16} /> {tab === 'trainers' ? 'دعوة مدرب' : 'موظف جديد'}
        </button>
      </div>

      {/* ===== المدربون ===== */}
      {tab === 'trainers' && (
        trainers.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-12 text-center text-sm text-ruwad-navy/50">لا مدربون في الفريق بعد — ابحث وادعُ أول مدرب.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {trainers.map((t) => {
              const open = expanded === t.membership_id
              return (
                <div key={t.membership_id} className="bg-white rounded-ruwad shadow-card overflow-hidden">
                  <button onClick={() => setExpanded(open ? null : t.membership_id)} className="w-full p-4 flex items-center gap-3 text-right">
                    <Avatar name={t.full_name} url={t.avatar_url} size={11} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-ruwad-navy truncate">{t.full_name}</p>
                      <p className="text-[11px] font-bold text-ruwad-navy/45 mt-0.5">
                        {t.job_title || 'مدرب'}
                        {t.comp_type && <> · {t.comp_type === 'percent' ? `${t.comp_value}% من التحصيل` : `${fmt(t.comp_value ?? 0)} ${CUR[t.comp_currency ?? 'SYP']}/شهر`}</>}
                      </p>
                    </div>
                    <ChevronDown size={16} className={`shrink-0 text-ruwad-navy/35 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="border-t border-ruwad-gray/50 p-4 flex flex-col gap-3">
                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        <InfoRow icon={Clock} label="أوقات الدوام" value={t.work_start && t.work_end ? `${t.work_start.slice(0, 5)} – ${t.work_end.slice(0, 5)} (${dayLabels(t.work_days)})` : 'غير محدد'} />
                        <InfoRow icon={Wallet} label="التعاقد" value={t.comp_type ? (t.comp_type === 'percent' ? `نسبة ${t.comp_value}%` : `راتب ثابت ${fmt(t.comp_value ?? 0)} ${CUR[t.comp_currency ?? 'SYP']}`) : 'غير محدد'} />
                        <InfoRow icon={CalendarDays} label="الإجازات" value={`${t.leave_used} / ${t.annual_leave_days} يوماً هذا العام`} />
                        <InfoRow icon={Phone} label="الهاتف" value={t.phone || '—'} />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <ActionBtn onClick={() => setHoursModal(t)} icon={Clock} label="الدوام" />
                        <ActionBtn onClick={() => setCompModal(t)} icon={Wallet} label="التعاقد" />
                        <ActionBtn onClick={() => setLeaveTarget({ kind: 'trainer', id: t.user_id, name: t.full_name, annual: t.annual_leave_days, used: t.leave_used })} icon={CalendarDays} label="تسجيل إجازة" />
                        <ActionBtn onClick={() => removeTrainer(t)} icon={Trash2} label="إزالة" danger />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ===== الموظفون ===== */}
      {tab === 'staff' && (
        staff.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-12 text-center text-sm text-ruwad-navy/50">لا موظفون مسجّلون بعد — أضف أول موظف.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {staff.map((s) => {
              const open = expanded === s.id
              return (
                <div key={s.id} className={`bg-white rounded-ruwad shadow-card overflow-hidden ${s.status === 'inactive' ? 'opacity-60' : ''}`}>
                  <button onClick={() => setExpanded(open ? null : s.id)} className="w-full p-4 flex items-center gap-3 text-right">
                    <Avatar name={s.full_name} url={null} size={11} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-ruwad-navy truncate flex items-center gap-2">
                        {s.full_name}
                        {s.status === 'inactive' && <span className="text-[10px] font-extrabold text-ruwad-navy/40 bg-ruwad-gray/40 rounded-full px-2 py-0.5">غير نشط</span>}
                      </p>
                      <p className="text-[11px] font-bold text-ruwad-navy/45 mt-0.5">
                        {s.job_title} · {s.contract_type === 'monthly' ? `${fmt(s.salary ?? 0)} ${CUR[s.currency]}/شهر` : `${fmt(s.hourly_rate ?? 0)} ${CUR[s.currency]}/ساعة`}
                      </p>
                    </div>
                    <ChevronDown size={16} className={`shrink-0 text-ruwad-navy/35 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="border-t border-ruwad-gray/50 p-4 flex flex-col gap-3">
                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        <InfoRow icon={Clock} label="أوقات الدوام" value={s.work_start && s.work_end ? `${s.work_start.slice(0, 5)} – ${s.work_end.slice(0, 5)} (${dayLabels(s.work_days)})` : 'غير محدد'} />
                        <InfoRow icon={CalendarDays} label="تاريخ التوظيف" value={s.hire_date ? new Date(s.hire_date).toLocaleDateString('ar') : '—'} />
                        <InfoRow icon={CalendarDays} label="الإجازات" value={`${s.leave_used} / ${s.annual_leave_days} يوماً هذا العام`} />
                        <InfoRow icon={Phone} label="الهاتف" value={s.phone || '—'} />
                      </div>
                      {s.notes && <p className="text-xs text-ruwad-navy/55 bg-[#F5F6FA] rounded-ruwad-sm px-3 py-2">{s.notes}</p>}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <ActionBtn onClick={() => setStaffModal(s)} icon={Pencil} label="تعديل" />
                        <ActionBtn onClick={() => setLeaveTarget({ kind: 'staff', id: s.id, name: s.full_name, annual: s.annual_leave_days, used: s.leave_used })} icon={CalendarDays} label="تسجيل إجازة" />
                        <ActionBtn onClick={() => toggleStaffStatus(s)} icon={s.status === 'active' ? XCircle : Check} label={s.status === 'active' ? 'تعطيل' : 'تفعيل'} />
                        <ActionBtn onClick={() => removeStaff(s)} icon={Trash2} label="حذف" danger />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {inviteOpen && <InviteTrainerModal instituteId={instituteId} onClose={() => setInviteOpen(false)} onSent={() => { setInviteOpen(false); router.refresh() }} />}
      {staffModal && <StaffModal instituteId={instituteId} staffMember={staffModal === 'new' ? null : staffModal} onClose={() => setStaffModal(null)} onSaved={() => { setStaffModal(null); router.refresh() }} />}
      {hoursModal && <HoursModal target={hoursModal} onClose={() => setHoursModal(null)} onSaved={() => { setHoursModal(null); router.refresh() }} />}
      {compModal && <TrainerCompModal instituteId={instituteId} trainer={compModal} onClose={() => setCompModal(null)} onSaved={() => { setCompModal(null); router.refresh() }} />}
      {leaveTarget && <LeaveModal instituteId={instituteId} target={leaveTarget} onClose={() => setLeaveTarget(null)} onSaved={() => { setLeaveTarget(null); router.refresh() }} />}
    </div>
  )
}

/* ================= عناصر مساعدة ================= */

function Avatar({ name, url, size = 11 }: { name: string; url: string | null; size?: number }) {
  const px = size * 4
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={{ width: px, height: px }} className="rounded-full object-cover ring-2 ring-ruwad-gray/50 shrink-0" />
  }
  return (
    <span style={{ width: px, height: px }} className="rounded-full bg-ruwad-gradient text-white font-black flex items-center justify-center shrink-0 text-sm">
      {name.charAt(0)}
    </span>
  )
}
function InfoRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#F5F6FA] rounded-ruwad-sm px-3 py-2">
      <Icon size={13} className="text-ruwad-blue shrink-0" />
      <span className="text-ruwad-navy/45 font-bold shrink-0">{label}:</span>
      <span className="text-ruwad-navy font-extrabold truncate">{value}</span>
    </div>
  )
}
function ActionBtn({ onClick, icon: Icon, label, danger }: { onClick: () => void; icon: typeof Clock; label: string; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-2 rounded-full border-2 transition ${
        danger ? 'text-red-500 border-red-200 hover:bg-red-50' : 'text-ruwad-navy/60 border-ruwad-gray hover:border-ruwad-navy/30'}`}>
      <Icon size={12} /> {label}
    </button>
  )
}
function DayPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DAYS.map((d) => {
        const active = value.includes(d.key)
        return (
          <button key={d.key} type="button"
            onClick={() => onChange(active ? value.filter((x) => x !== d.key) : [...value, d.key])}
            className={`text-[11px] font-extrabold px-3 py-1.5 rounded-full border-2 transition ${active ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/50 border-ruwad-gray'}`}>
            {d.label}
          </button>
        )
      })}
    </div>
  )
}
const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-md rounded-t-ruwad sm:rounded-ruwad max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray sticky top-0 bg-white z-10">
          <h3 className="font-extrabold text-ruwad-navy">{title}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  )
}

/* ================= دعوة مدرب (بحث + إرسال) ================= */

function InviteTrainerModal({ instituteId, onClose, onSent }: { instituteId: string; onClose: () => void; onSent: () => void }) {
  const supabase = createClient()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<SearchTrainer[] | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<Record<string, string>>({})

  async function search(term: string) {
    setQ(term)
    if (term.trim().length < 2) { setResults(null); return }
    setBusy(true)
    const { data } = await supabase.rpc('search_directory', { p_query: term.trim() })
    setBusy(false)
    setResults((data as { trainers: SearchTrainer[] } | null)?.trainers ?? [])
  }

  async function invite(t: SearchTrainer) {
    setSending(t.id)
    const { data } = await supabase.rpc('institute_invite_trainer', { p_institute_id: instituteId, p_trainer_id: t.id })
    setSending(null)
    const msgs: Record<string, string> = { ok: 'أُرسلت الدعوة ✓', already_member: 'عضو بالفعل', already_invited: 'أُرسلت له دعوة سابقاً' }
    setSent((s) => ({ ...s, [t.id]: msgs[data as string] ?? 'تعذّر الإرسال' }))
  }

  return (
    <ModalShell title="دعوة مدرب للفريق" onClose={onClose}>
      <div className="relative">
        <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ruwad-navy/35" />
        <input autoFocus value={q} onChange={(e) => search(e.target.value)} placeholder="ابحث باسم المدرب..." className={inputCls + ' pr-10'} />
      </div>
      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
        {busy && <Loader2 size={16} className="animate-spin text-ruwad-navy/30 mx-auto my-4" />}
        {!busy && results?.length === 0 && <p className="text-xs text-ruwad-navy/40 text-center py-6">لا نتائج.</p>}
        {results?.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 bg-[#F5F6FA] rounded-ruwad-sm px-3 py-2.5">
            <Avatar name={t.name} url={t.avatar} size={9} />
            <span className="text-sm font-extrabold text-ruwad-navy truncate flex-1">{t.name}</span>
            {sent[t.id] ? (
              <span className="text-[11px] font-bold text-ruwad-navy/50 shrink-0">{sent[t.id]}</span>
            ) : t.membership === 'approved' ? (
              <span className="text-[11px] font-bold text-green-600 shrink-0">عضو بالفعل</span>
            ) : t.membership === 'pending' ? (
              <span className="text-[11px] font-bold text-amber-600 shrink-0">بالانتظار</span>
            ) : (
              <button onClick={() => invite(t)} disabled={sending === t.id}
                className="shrink-0 text-[11px] font-extrabold text-white bg-ruwad-blue hover:opacity-90 rounded-full px-3.5 py-1.5 transition disabled:opacity-60">
                {sending === t.id ? <Loader2 size={11} className="animate-spin" /> : 'دعوة'}
              </button>
            )}
          </div>
        ))}
      </div>
    </ModalShell>
  )
}

/* ================= إضافة/تعديل موظف ================= */

function StaffModal({ instituteId, staffMember, onClose, onSaved }: { instituteId: string; staffMember: StaffRow | null; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const [fullName, setFullName] = useState(staffMember?.full_name ?? '')
  const [phone, setPhone] = useState(staffMember?.phone ?? '')
  const [jobTitle, setJobTitle] = useState(staffMember?.job_title ?? '')
  const [contractType, setContractType] = useState<'monthly' | 'hourly'>(staffMember?.contract_type ?? 'monthly')
  const [amount, setAmount] = useState(String(staffMember?.contract_type === 'hourly' ? staffMember?.hourly_rate ?? '' : staffMember?.salary ?? ''))
  const [currency, setCurrency] = useState<'SYP' | 'USD'>((staffMember?.currency as 'SYP' | 'USD') ?? 'SYP')
  const [hireDate, setHireDate] = useState(staffMember?.hire_date ?? '')
  const [workDays, setWorkDays] = useState<string[]>(staffMember?.work_days ?? [])
  const [workStart, setWorkStart] = useState(staffMember?.work_start?.slice(0, 5) ?? '09:00')
  const [workEnd, setWorkEnd] = useState(staffMember?.work_end?.slice(0, 5) ?? '17:00')
  const [annualLeave, setAnnualLeave] = useState(String(staffMember?.annual_leave_days ?? 21))
  const [notes, setNotes] = useState(staffMember?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (fullName.trim().length < 2 || jobTitle.trim().length < 2) { setError('اكتب الاسم والمسمى الوظيفي'); return }
    setSaving(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const payload = {
      institute_id: instituteId, full_name: fullName.trim(), phone: phone.trim() || null,
      job_title: jobTitle.trim(), contract_type: contractType,
      salary: contractType === 'monthly' ? Number(amount) || null : null,
      hourly_rate: contractType === 'hourly' ? Number(amount) || null : null,
      currency, hire_date: hireDate || null, work_days: workDays,
      work_start: workStart || null, work_end: workEnd || null,
      annual_leave_days: Number(annualLeave) || 21, notes: notes.trim() || null,
      created_by: session!.user.id,
    }
    const { error: err } = staffMember
      ? await supabase.from('institute_staff').update(payload).eq('id', staffMember.id)
      : await supabase.from('institute_staff').insert(payload)
    setSaving(false)
    if (err) { setError('تعذّر الحفظ'); return }
    onSaved()
  }

  return (
    <ModalShell title={staffMember ? 'تعديل بيانات الموظف' : 'موظف جديد'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل *" className={inputCls + ' col-span-2'} />
        <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="المسمى الوظيفي *" className={inputCls} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="الهاتف" dir="ltr" className={inputCls + ' text-right'} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setContractType('monthly')} className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${contractType === 'monthly' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>راتب شهري</button>
        <button onClick={() => setContractType('hourly')} className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${contractType === 'hourly' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>أجر بالساعة</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={contractType === 'monthly' ? 'الراتب' : 'أجر الساعة'} className={inputCls + ' col-span-2'} />
        <select value={currency} onChange={(e) => setCurrency(e.target.value as 'SYP' | 'USD')} className={inputCls}><option value="SYP">ل.س</option><option value="USD">$</option></select>
      </div>
      <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">تاريخ التوظيف</span><input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className={inputCls} /></label>
      <div className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">أيام الدوام</span><DayPicker value={workDays} onChange={setWorkDays} /></div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">من الساعة</span><input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className={inputCls} /></label>
        <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">حتى الساعة</span><input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className={inputCls} /></label>
      </div>
      <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">رصيد الإجازة السنوي (يوم)</span><input type="number" min={0} value={annualLeave} onChange={(e) => setAnnualLeave(e.target.value)} className={inputCls} /></label>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات (اختياري)" rows={2} className={inputCls + ' resize-none'} />
      {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
      <button onClick={save} disabled={saving} className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
        {saving && <Loader2 size={15} className="animate-spin" />} {staffMember ? 'حفظ التعديلات' : 'إضافة الموظف'}
      </button>
    </ModalShell>
  )
}

/* ================= أوقات دوام المدرب ================= */

function HoursModal({ target, onClose, onSaved }: { target: TrainerRow; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const [jobTitle, setJobTitle] = useState(target.job_title ?? '')
  const [hireDate, setHireDate] = useState(target.hire_date ?? '')
  const [workDays, setWorkDays] = useState<string[]>(target.work_days ?? [])
  const [workStart, setWorkStart] = useState(target.work_start?.slice(0, 5) ?? '')
  const [workEnd, setWorkEnd] = useState(target.work_end?.slice(0, 5) ?? '')
  const [annualLeave, setAnnualLeave] = useState(String(target.annual_leave_days ?? 21))
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('institute_members').update({
      job_title: jobTitle.trim() || null, hire_date: hireDate || null, work_days: workDays,
      work_start: workStart || null, work_end: workEnd || null, annual_leave_days: Number(annualLeave) || 21,
    }).eq('id', target.membership_id)
    setSaving(false)
    onSaved()
  }

  return (
    <ModalShell title={`دوام ${target.full_name}`} onClose={onClose}>
      <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">اللقب الوظيفي (اختياري)</span><input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="مدرب أول" className={inputCls} /></label>
      <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">تاريخ الانضمام</span><input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className={inputCls} /></label>
      <div className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">أيام الدوام</span><DayPicker value={workDays} onChange={setWorkDays} /></div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">من الساعة</span><input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className={inputCls} /></label>
        <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">حتى الساعة</span><input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className={inputCls} /></label>
      </div>
      <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">رصيد الإجازة السنوي (يوم)</span><input type="number" min={0} value={annualLeave} onChange={(e) => setAnnualLeave(e.target.value)} className={inputCls} /></label>
      <button onClick={save} disabled={saving} className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
        {saving && <Loader2 size={15} className="animate-spin" />} حفظ
      </button>
    </ModalShell>
  )
}

/* ================= تعاقد المدرب (نسبة/راتب) ================= */

function TrainerCompModal({ instituteId, trainer, onClose, onSaved }: { instituteId: string; trainer: TrainerRow; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const [compType, setCompType] = useState<'percent' | 'fixed_monthly'>(trainer.comp_type ?? 'percent')
  const [value, setValue] = useState(String(trainer.comp_value ?? ''))
  const [currency, setCurrency] = useState<'SYP' | 'USD'>((trainer.comp_currency as 'SYP' | 'USD') ?? 'SYP')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    const v = Number(value)
    if (!v || v <= 0 || (compType === 'percent' && v > 100)) { setError('أدخل قيمة صحيحة'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('trainer_compensations')
      .upsert({ institute_id: instituteId, trainer_id: trainer.user_id, comp_type: compType, value: v, currency }, { onConflict: 'institute_id,trainer_id' })
    setSaving(false)
    if (err) { setError('تعذّر الحفظ'); return }
    onSaved()
  }

  return (
    <ModalShell title={`تعاقد ${trainer.full_name}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setCompType('percent')} className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${compType === 'percent' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>نسبة من التحصيل</button>
        <button onClick={() => setCompType('fixed_monthly')} className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${compType === 'fixed_monthly' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>راتب شهري ثابت</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input type="number" min={1} max={compType === 'percent' ? 100 : undefined} value={value} onChange={(e) => setValue(e.target.value)}
          placeholder={compType === 'percent' ? 'النسبة %' : 'المبلغ الشهري'} className={inputCls + ' col-span-2'} />
        <select value={currency} onChange={(e) => setCurrency(e.target.value as 'SYP' | 'USD')} className={inputCls}><option value="SYP">ل.س</option><option value="USD">$</option></select>
      </div>
      {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
      <button onClick={save} disabled={saving} className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
        {saving && <Loader2 size={15} className="animate-spin" />} حفظ الاتفاق
      </button>
    </ModalShell>
  )
}

/* ================= تسجيل إجازة ================= */

function LeaveModal({ instituteId, target, onClose, onSaved }: {
  instituteId: string; target: { kind: 'trainer' | 'staff'; id: string; name: string; annual: number; used: number }
  onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [leaveType, setLeaveType] = useState<'annual' | 'sick' | 'unpaid' | 'other'>('annual')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const remaining = Math.max(target.annual - target.used, 0)

  async function save() {
    if (endDate < startDate) { setError('تاريخ النهاية قبل البداية'); return }
    setSaving(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const { error: err } = await supabase.from('institute_leaves').insert({
      institute_id: instituteId, member_kind: target.kind,
      trainer_user_id: target.kind === 'trainer' ? target.id : null,
      staff_id: target.kind === 'staff' ? target.id : null,
      leave_type: leaveType, start_date: startDate, end_date: endDate,
      note: note.trim() || null, created_by: session!.user.id,
    })
    setSaving(false)
    if (err) { setError('تعذّر الحفظ'); return }
    onSaved()
  }

  return (
    <ModalShell title={`تسجيل إجازة — ${target.name}`} onClose={onClose}>
      <p className="text-[11px] font-bold text-ruwad-navy/50 bg-ruwad-blue/5 rounded-ruwad-sm px-3 py-2">الرصيد المتبقي هذا العام: {remaining} من {target.annual} يوماً</p>
      <div className="grid grid-cols-4 gap-1.5">
        {([['annual', 'سنوية'], ['sick', 'مرضية'], ['unpaid', 'بلا أجر'], ['other', 'أخرى']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setLeaveType(v)} className={`py-2 rounded-ruwad-sm text-[11px] font-extrabold border-2 transition ${leaveType === v ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">من</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} /></label>
        <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">إلى</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} /></label>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة (اختياري)" className={inputCls} />
      {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
      <button onClick={save} disabled={saving} className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
        {saving && <Loader2 size={15} className="animate-spin" />} تسجيل الإجازة
      </button>
    </ModalShell>
  )
}
