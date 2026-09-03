'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Banknote, HandCoins, ReceiptText, PiggyBank, X, Loader2, Printer,
  TrendingUp, TrendingDown, Scale, AlertTriangle, UserRound, Trash2,
  Filter, BarChart3, CalendarClock,
} from 'lucide-react'

/* ================================================================
   النظام المالي v2 — دفتر قيود موحّد بنافذة إدخال واحدة:
   قبض 🟢 / مستحق 🟡 / مصروف 🔴 / سحب 🟣 + إحصائيات ورسم شهري
   ================================================================ */

export type EntryType = 'income' | 'due' | 'expense' | 'withdrawal'

export interface LedgerEntry {
  id: string; entry_type: EntryType
  student_id: string | null; course_id: string | null; party_name: string | null
  category: string | null; trainer_id: string | null; due_link: string | null
  amount: number; currency: 'SYP' | 'USD'; method: string | null
  description: string | null; due_date: string | null; occurred_at: string
  receipt_code: string | null
  student: { full_name: string } | null
  trainer: { full_name: string } | null
  course: { title: string } | null
}
interface Stats {
  month: { currency: string; type: string; amount: number }[]
  dues: { currency: string; outstanding: number; overdue: number; open_count: number }[]
  series: { ym: string; currency: string; income: number; outgo: number }[]
  trainer_dues: { trainer_id: string; name: string; comp_type: string; value: number; currency: string; owed: number; paid: number }[]
}
interface Person { user_id: string; profile: { full_name: string } }
interface Compensation { id: string; trainer_id: string; comp_type: 'percent' | 'fixed_monthly'; value: number; currency: string; trainer: { full_name: string } }

const CUR: Record<string, string> = { SYP: 'ل.س', USD: '$' }
const CAT_AR: Record<string, string> = { salary: 'راتب', rent: 'إيجار', utilities: 'فواتير', supplies: 'مستلزمات', marketing: 'تسويق', other: 'أخرى' }
const fmt = (n: number) => Number(n).toLocaleString('ar')
const todayStr = () => new Date().toISOString().slice(0, 10)

export const TYPE_UI: Record<EntryType, { label: string; icon: typeof Banknote; bg: string; soft: string; text: string }> = {
  income: { label: 'قبض', icon: Banknote, bg: '#16a34a', soft: '#f0fdf4', text: '#15803d' },
  due: { label: 'مستحق', icon: HandCoins, bg: '#d97706', soft: '#fffbeb', text: '#b45309' },
  expense: { label: 'مصروف', icon: ReceiptText, bg: '#dc2626', soft: '#fef2f2', text: '#b91c1c' },
  withdrawal: { label: 'سحب', icon: PiggyBank, bg: '#7c3aed', soft: '#f5f3ff', text: '#6d28d9' },
}

export function dueRemaining(due: LedgerEntry, all: LedgerEntry[]) {
  const paid = all.filter((e) => e.due_link === due.id).reduce((s, e) => s + Number(e.amount), 0)
  return { paid, remaining: Math.max(Number(due.amount) - paid, 0) }
}

export function FinanceHub({ instituteId, stats, ledger, students, courses, trainers, compensations }: {
  instituteId: string
  stats: Stats | null
  ledger: LedgerEntry[]
  students: Person[]
  courses: { id: string; title: string }[]
  trainers: Person[]
  compensations: Compensation[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [modal, setModal] = useState<null | { type: EntryType; preset?: Partial<PresetEntry> }>(null)
  const [compEditing, setCompEditing] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | EntryType>('all')
  const [chartCur, setChartCur] = useState<'SYP' | 'USD'>('SYP')

  const monthAmt = (t: string, c: string) =>
    (stats?.month ?? []).filter((m) => m.type === t && m.currency === c).reduce((s, m) => s + Number(m.amount), 0)
  const currencies = (['SYP', 'USD'] as const).filter((c) =>
    (stats?.month ?? []).some((m) => m.currency === c) || (stats?.dues ?? []).some((d) => d.currency === c && Number(d.outstanding) > 0))
  const activeCurrencies = currencies.length ? currencies : (['SYP'] as const)

  const openDues = useMemo(() => ledger
    .filter((e) => e.entry_type === 'due')
    .map((d) => ({ ...d, ...dueRemaining(d, ledger) }))
    .filter((d) => d.remaining > 0)
    .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')), [ledger])

  const shownLedger = useMemo(() =>
    (typeFilter === 'all' ? ledger : ledger.filter((e) => e.entry_type === typeFilter)).slice(0, 80), [ledger, typeFilter])

  async function removeEntry(e: LedgerEntry) {
    const linked = e.entry_type === 'due' ? ledger.filter((x) => x.due_link === e.id).length : 0
    if (!confirm(`حذف قيد "${TYPE_UI[e.entry_type].label} — ${fmt(e.amount)} ${CUR[e.currency]}"؟${linked ? `\nستُفكّ عنه ${linked} دفعة مرتبطة.` : ''}`)) return
    await supabase.from('finance_ledger').delete().eq('id', e.id)
    router.refresh()
  }

  // بيانات الرسم: آخر 6 أشهر للعملة المختارة
  const chart = useMemo(() => {
    const months: { ym: string; label: string; income: number; outgo: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const row = (stats?.series ?? []).find((s) => s.ym === ym && s.currency === chartCur)
      months.push({ ym, label: d.toLocaleDateString('ar', { month: 'short' }), income: Number(row?.income ?? 0), outgo: Number(row?.outgo ?? 0) })
    }
    const max = Math.max(...months.map((m) => Math.max(m.income, m.outgo)), 1)
    return { months, max }
  }, [stats, chartCur])

  return (
    <div className="flex flex-col gap-5">
      {/* أزرار الإدخال الأربعة */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {(Object.keys(TYPE_UI) as EntryType[]).map((t) => {
          const ui = TYPE_UI[t]; const Icon = ui.icon
          return (
            <button key={t} onClick={() => setModal({ type: t })}
              className="group rounded-ruwad p-3 sm:p-4 flex flex-col items-center gap-1.5 text-white shadow-card hover:-translate-y-0.5 hover:shadow-ruwad-lg transition-all"
              style={{ background: ui.bg }}>
              <Icon size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-extrabold">{ui.label}</span>
            </button>
          )
        })}
      </div>

      {/* ملخص الشهر لكل عملة */}
      {activeCurrencies.map((c) => {
        const inc = monthAmt('income', c)
        const exp = monthAmt('expense', c)
        const wd = monthAmt('withdrawal', c)
        const net = inc - exp - wd
        const duesRow = (stats?.dues ?? []).find((d) => d.currency === c)
        return (
          <div key={c} className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
            <div className="bg-white rounded-ruwad shadow-card p-3.5 flex flex-col gap-1">
              <TrendingUp size={15} className="text-green-500" />
              <p className="text-[10px] font-bold text-ruwad-navy/50">دخل الشهر ({CUR[c]})</p>
              <p className="text-lg font-black text-green-600">{fmt(inc)}</p>
            </div>
            <div className="bg-white rounded-ruwad shadow-card p-3.5 flex flex-col gap-1">
              <TrendingDown size={15} className="text-red-400" />
              <p className="text-[10px] font-bold text-ruwad-navy/50">مصاريف ({CUR[c]})</p>
              <p className="text-lg font-black text-red-500">{fmt(exp)}</p>
            </div>
            <div className="bg-white rounded-ruwad shadow-card p-3.5 flex flex-col gap-1">
              <PiggyBank size={15} className="text-violet-500" />
              <p className="text-[10px] font-bold text-ruwad-navy/50">سحوبات ({CUR[c]})</p>
              <p className="text-lg font-black text-violet-600">{fmt(wd)}</p>
            </div>
            <div className={`rounded-ruwad shadow-card p-3.5 flex flex-col gap-1 text-white ${net >= 0 ? 'bg-ruwad-gradient' : 'bg-red-500'}`}>
              <Scale size={15} className="opacity-85" />
              <p className="text-[10px] font-bold opacity-85">صافي الشهر ({CUR[c]})</p>
              <p className="text-lg font-black">{fmt(net)}</p>
            </div>
            <div className={`rounded-ruwad shadow-card p-3.5 flex flex-col gap-1 col-span-2 lg:col-span-1 ${Number(duesRow?.overdue ?? 0) > 0 ? 'bg-amber-50 ring-2 ring-amber-300' : 'bg-white'}`}>
              <AlertTriangle size={15} className="text-amber-500" />
              <p className="text-[10px] font-bold text-ruwad-navy/50">مستحقات معلّقة ({CUR[c]})</p>
              <p className="text-lg font-black text-amber-600">{fmt(Number(duesRow?.outstanding ?? 0))}</p>
              {Number(duesRow?.overdue ?? 0) > 0 && (
                <p className="text-[10px] font-extrabold text-red-500">منها متأخر: {fmt(Number(duesRow!.overdue))}</p>
              )}
            </div>
          </div>
        )
      })}

      {/* الرسم الشهري */}
      <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-extrabold text-ruwad-navy flex items-center gap-1.5"><BarChart3 size={15} className="text-ruwad-blue" /> آخر 6 أشهر</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-bold text-ruwad-navy/50"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> دخل</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-ruwad-navy/50"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> صرف</span>
            <button onClick={() => setChartCur(chartCur === 'SYP' ? 'USD' : 'SYP')}
              className="text-[11px] font-extrabold text-ruwad-blue bg-ruwad-blue/10 rounded-full px-2.5 py-1">{CUR[chartCur]}</button>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-36">
          {chart.months.map((m) => (
            <div key={m.ym} className="flex-1 flex flex-col items-center gap-1.5 h-full">
              <div className="flex-1 w-full flex items-end justify-center gap-1">
                <div className="w-3.5 sm:w-5 rounded-t-md bg-green-500 transition-all" title={`دخل ${fmt(m.income)}`}
                  style={{ height: `${(m.income / chart.max) * 100}%`, minHeight: m.income > 0 ? 4 : 0 }} />
                <div className="w-3.5 sm:w-5 rounded-t-md bg-red-400 transition-all" title={`صرف ${fmt(m.outgo)}`}
                  style={{ height: `${(m.outgo / chart.max) * 100}%`, minHeight: m.outgo > 0 ? 4 : 0 }} />
              </div>
              <span className="text-[10px] font-bold text-ruwad-navy/45">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* المستحقات المفتوحة */}
      <div className="bg-white rounded-ruwad shadow-card p-4">
        <p className="text-sm font-extrabold text-ruwad-navy mb-3 flex items-center gap-1.5">
          <HandCoins size={15} className="text-amber-500" /> المستحقات المفتوحة ({openDues.length})
        </p>
        {openDues.length === 0 ? (
          <p className="text-xs text-ruwad-navy/45 py-2">لا مستحقات معلّقة — كل الحسابات صافية 🎉</p>
        ) : (
          <div className="flex flex-col gap-2">
            {openDues.map((d) => {
              const late = d.due_date && d.due_date < todayStr()
              const pct = Math.min(Math.round((d.paid / Number(d.amount)) * 100), 100)
              return (
                <div key={d.id} className={`rounded-ruwad-sm px-3.5 py-3 ${late ? 'bg-red-50 ring-1 ring-red-200' : 'bg-[#F5F6FA]'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-ruwad-navy truncate">
                        {d.student?.full_name ?? d.party_name}
                        {d.course?.title && <span className="text-[11px] font-bold text-ruwad-navy/45"> — {d.course.title}</span>}
                      </p>
                      <p className="text-[11px] font-bold text-ruwad-navy/50 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        {d.due_date && <span className={`flex items-center gap-1 ${late ? 'text-red-500 font-extrabold' : ''}`}><CalendarClock size={11} /> {late ? 'تأخر منذ' : 'يستحق'} {new Date(d.due_date).toLocaleDateString('ar')}</span>}
                        <span>مدفوع {fmt(d.paid)} من {fmt(d.amount)} {CUR[d.currency]}</span>
                      </p>
                      <div className="h-1.5 rounded-full bg-white overflow-hidden mt-1.5 max-w-[220px]">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <button onClick={() => setModal({ type: 'income', preset: { studentId: d.student_id ?? undefined, partyName: d.party_name ?? undefined, courseId: d.course_id ?? undefined, dueLink: d.id, amount: d.remaining, currency: d.currency as 'SYP' | 'USD' } })}
                      className="shrink-0 flex items-center gap-1 text-[11px] font-extrabold text-white bg-green-500 hover:bg-green-600 rounded-full px-3.5 py-2 transition">
                      <Banknote size={12} /> قبض {fmt(d.remaining)}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* مستحقات المدربين */}
      <div className="bg-white rounded-ruwad shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-extrabold text-ruwad-navy flex items-center gap-1.5"><UserRound size={15} className="text-ruwad-blue" /> مستحقات المدربين (هذا الشهر)</p>
          <button onClick={() => setCompEditing(true)} className="text-[11px] font-extrabold text-ruwad-blue hover:underline">إدارة الاتفاقات</button>
        </div>
        {(stats?.trainer_dues ?? []).length === 0 ? (
          <p className="text-xs text-ruwad-navy/45 py-2">لا اتفاقات تعويض — أضفها من «إدارة الاتفاقات».</p>
        ) : (
          <div className="flex flex-col gap-2">
            {stats!.trainer_dues.map((d) => {
              const remaining = Math.max(Number(d.owed) - Number(d.paid), 0)
              return (
                <div key={d.trainer_id + d.currency} className="flex items-center justify-between gap-3 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-ruwad-navy truncate">{d.name}</p>
                    <p className="text-[11px] font-bold text-ruwad-navy/45">
                      {d.comp_type === 'percent' ? `${d.value}% من التحصيل` : `${fmt(d.value)} ${CUR[d.currency]} شهرياً`}
                      {' · '}مستحق {fmt(d.owed)} · مدفوع {fmt(d.paid)} {CUR[d.currency]}
                    </p>
                  </div>
                  {remaining > 0 ? (
                    <button onClick={() => setModal({ type: 'expense', preset: { category: 'salary', trainerId: d.trainer_id, amount: remaining, currency: d.currency as 'SYP' | 'USD' } })}
                      className="shrink-0 text-[11px] font-extrabold text-white bg-red-500 hover:bg-red-600 rounded-full px-3.5 py-2 flex items-center gap-1 transition">
                      <Banknote size={12} /> دفع {fmt(remaining)}
                    </button>
                  ) : (
                    <span className="text-[11px] font-extrabold text-green-600">مسدَّد ✓</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* سجل الحركات */}
      <div className="bg-white rounded-ruwad shadow-card p-4">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <p className="text-sm font-extrabold text-ruwad-navy flex items-center gap-1.5"><Filter size={14} className="text-ruwad-blue" /> سجل الحركات</p>
          <div className="flex gap-1.5 overflow-x-auto">
            <button onClick={() => setTypeFilter('all')}
              className={`shrink-0 text-[11px] font-extrabold px-3 py-1.5 rounded-full border-2 transition ${typeFilter === 'all' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
              الكل
            </button>
            {(Object.keys(TYPE_UI) as EntryType[]).map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className="shrink-0 text-[11px] font-extrabold px-3 py-1.5 rounded-full border-2 transition"
                style={typeFilter === t
                  ? { background: TYPE_UI[t].bg, borderColor: TYPE_UI[t].bg, color: '#fff' }
                  : { background: '#fff', borderColor: '#DEE0ED', color: TYPE_UI[t].text }}>
                {TYPE_UI[t].label}
              </button>
            ))}
          </div>
        </div>
        {shownLedger.length === 0 ? (
          <p className="text-xs text-ruwad-navy/45 py-2">لا حركات بعد — ابدأ بأزرار الإدخال أعلاه.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {shownLedger.map((e) => {
              const ui = TYPE_UI[e.entry_type]
              const who = e.student?.full_name ?? e.trainer?.full_name ?? e.party_name
              return (
                <div key={e.id} className="flex items-center justify-between gap-2 rounded-ruwad-sm px-3 py-2.5" style={{ background: ui.soft }}>
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span className="shrink-0 text-[10px] font-extrabold text-white px-2 py-1 rounded-full" style={{ background: ui.bg }}>{ui.label}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-ruwad-navy truncate">
                        {e.entry_type === 'expense' ? (CAT_AR[e.category ?? ''] ?? '') : ''}
                        {e.entry_type === 'expense' && who ? ' — ' : ''}{who ?? (e.entry_type === 'withdrawal' ? 'سحب صاحب المعهد' : '')}
                        {e.course?.title && <span className="text-ruwad-navy/45 font-bold"> · {e.course.title}</span>}
                      </p>
                      <p className="text-[10px] font-bold text-ruwad-navy/40">
                        {new Date(e.occurred_at).toLocaleDateString('ar')}
                        {e.receipt_code && <span dir="ltr"> · {e.receipt_code}</span>}
                        {e.description && ` · ${e.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-black" style={{ color: ui.text }}>
                      {e.entry_type === 'income' ? '+' : e.entry_type === 'due' ? '' : '−'}{fmt(e.amount)} {CUR[e.currency]}
                    </span>
                    {e.entry_type === 'income' && (
                      <Link href={`/org/finance/receipt/${e.id}`} target="_blank" title="الإيصال"
                        className="text-ruwad-navy/30 hover:text-ruwad-blue"><Printer size={13} /></Link>
                    )}
                    <button onClick={() => removeEntry(e)} aria-label="حذف" className="text-ruwad-navy/20 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && (
        <EntryModal instituteId={instituteId} initialType={modal.type} preset={modal.preset}
          students={students} courses={courses} trainers={trainers} openDues={openDues}
          onClose={() => setModal(null)} onSaved={() => { setModal(null); router.refresh() }} />
      )}
      {compEditing && (
        <CompensationsModal instituteId={instituteId} trainers={trainers} compensations={compensations}
          onClose={() => setCompEditing(false)} onSaved={() => { setCompEditing(false); router.refresh() }} />
      )}
    </div>
  )
}

/* ================= نافذة الإدخال الموحّدة ================= */

interface PresetEntry {
  studentId: string; partyName: string; courseId: string; dueLink: string
  amount: number; currency: 'SYP' | 'USD'; category: string; trainerId: string
}

function EntryModal({ instituteId, initialType, preset, students, courses, trainers, openDues, onClose, onSaved }: {
  instituteId: string; initialType: EntryType; preset?: Partial<PresetEntry>
  students: Person[]; courses: { id: string; title: string }[]; trainers: Person[]
  openDues: (LedgerEntry & { remaining: number })[]
  onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [type, setType] = useState<EntryType>(initialType)
  const [studentId, setStudentId] = useState(preset?.studentId ?? '')
  const [external, setExternal] = useState(!!preset?.partyName)
  const [partyName, setPartyName] = useState(preset?.partyName ?? '')
  const [courseId, setCourseId] = useState(preset?.courseId ?? '')
  const [dueLink, setDueLink] = useState(preset?.dueLink ?? '')
  const [category, setCategory] = useState(preset?.category ?? 'other')
  const [trainerId, setTrainerId] = useState(preset?.trainerId ?? '')
  const [amount, setAmount] = useState(preset?.amount ? String(preset.amount) : '')
  const [currency, setCurrency] = useState<'SYP' | 'USD'>(preset?.currency ?? 'SYP')
  const [method, setMethod] = useState<'cash' | 'transfer' | 'other'>('cash')
  const [dueDate, setDueDate] = useState(todayStr())
  const [occurredAt, setOccurredAt] = useState(todayStr())
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [receiptId, setReceiptId] = useState<string | null>(null)

  const ui = TYPE_UI[type]
  const needsParty = type === 'income' || type === 'due'
  const studentDues = openDues.filter((d) => (studentId && d.student_id === studentId))

  async function save() {
    const a = Number(amount)
    if (!a || a <= 0) { setError('أدخل مبلغاً صحيحاً'); return }
    if (needsParty && !external && !studentId) { setError('اختر الطالب أو فعّل «طرف خارجي»'); return }
    if (needsParty && external && partyName.trim().length < 2) { setError('اكتب اسم الطرف الخارجي'); return }
    if (type === 'expense' && category === 'salary' && !trainerId) { setError('اختر المدرب للراتب'); return }
    setSaving(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    let receipt_code: string | null = null
    if (type === 'income') {
      const { data } = await supabase.rpc('generate_receipt_code')
      receipt_code = data as string
    }
    const { data: row, error: err } = await supabase.from('finance_ledger').insert({
      institute_id: instituteId,
      entry_type: type,
      student_id: needsParty && !external ? studentId : null,
      party_name: needsParty && external ? partyName.trim() : null,
      course_id: needsParty && courseId ? courseId : null,
      due_link: type === 'income' && dueLink ? dueLink : null,
      category: type === 'expense' ? category : null,
      trainer_id: type === 'expense' && category === 'salary' ? trainerId : null,
      amount: a, currency,
      method: type === 'income' ? method : null,
      due_date: type === 'due' ? dueDate : null,
      occurred_at: new Date(occurredAt + 'T12:00:00').toISOString(),
      description: description.trim() || null,
      receipt_code,
      created_by: session!.user.id,
    }).select('id').single()
    setSaving(false)
    if (err || !row) { setError('تعذّر الحفظ — أعد المحاولة'); return }
    if (type === 'income') { setReceiptId(row.id); return }
    onSaved()
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-lg rounded-t-ruwad sm:rounded-ruwad max-h-[94vh] overflow-y-auto">
        <div className="h-1.5 w-full" style={{ background: ui.bg }} />
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray sticky top-0 bg-white z-10">
          <h3 className="font-extrabold text-ruwad-navy">قيد جديد — {ui.label}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>

        {receiptId ? (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <span className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl">✓</span>
            <p className="font-extrabold text-ruwad-navy">سُجّل القبض بنجاح</p>
            <Link href={`/org/finance/receipt/${receiptId}`} target="_blank"
              className="flex items-center gap-2 bg-ruwad-blue text-white text-sm font-extrabold px-5 py-2.5 rounded-ruwad-sm hover:opacity-90 transition">
              <Printer size={15} /> فتح الإيصال للطباعة
            </Link>
            <button onClick={onSaved} className="text-xs font-bold text-ruwad-navy/50 hover:text-ruwad-navy">إغلاق</button>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            {/* مبدّل النوع — نفس النافذة لكل القيود */}
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(TYPE_UI) as EntryType[]).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className="py-2.5 rounded-ruwad-sm text-xs font-extrabold border-2 transition"
                  style={type === t
                    ? { background: TYPE_UI[t].bg, borderColor: TYPE_UI[t].bg, color: '#fff' }
                    : { background: '#fff', borderColor: '#DEE0ED', color: TYPE_UI[t].text }}>
                  {TYPE_UI[t].label}
                </button>
              ))}
            </div>

            {needsParty && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-ruwad-navy">{type === 'income' ? 'القبض من' : 'المستحق على'} *</span>
                  <button onClick={() => { setExternal(!external); setStudentId(''); setDueLink('') }}
                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border-2 transition ${external ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'text-ruwad-navy/50 border-ruwad-gray'}`}>
                    طرف خارجي
                  </button>
                </div>
                {external ? (
                  <input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="اسم الجهة أو الشخص" className={inputCls} />
                ) : (
                  <select value={studentId} onChange={(e) => { setStudentId(e.target.value); setDueLink('') }} className={inputCls}>
                    <option value="">— اختر الطالب —</option>
                    {students.map((s) => <option key={s.user_id} value={s.user_id}>{s.profile.full_name}</option>)}
                  </select>
                )}
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
                  <option value="">التدريب (اختياري)</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                {type === 'income' && !external && studentDues.length > 0 && (
                  <select value={dueLink} onChange={(e) => {
                    setDueLink(e.target.value)
                    const d = studentDues.find((x) => x.id === e.target.value)
                    if (d) { setAmount(String(d.remaining)); setCurrency(d.currency as 'SYP' | 'USD') }
                  }} className={inputCls + ' border-amber-300 bg-amber-50/50'}>
                    <option value="">تسديد مستحق معيّن (اختياري)</option>
                    {studentDues.map((d) => (
                      <option key={d.id} value={d.id}>
                        متبقٍ {fmt(d.remaining)} {CUR[d.currency]}{d.course?.title ? ` — ${d.course.title}` : ''}{d.due_date ? ` — ${new Date(d.due_date).toLocaleDateString('ar')}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}

            {type === 'expense' && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-extrabold text-ruwad-navy">الفئة</span>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                    {Object.entries(CAT_AR).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
                {category === 'salary' && (
                  <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className={inputCls}>
                    <option value="">— اختر المدرب —</option>
                    {trainers.map((t) => <option key={t.user_id} value={t.user_id}>{t.profile.full_name}</option>)}
                  </select>
                )}
              </>
            )}

            <div className="grid grid-cols-3 gap-3">
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="text-xs font-extrabold text-ruwad-navy">المبلغ *</span>
                <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold text-ruwad-navy">العملة</span>
                <select value={currency} onChange={(e) => setCurrency(e.target.value as 'SYP' | 'USD')} className={inputCls}>
                  <option value="SYP">ل.س</option><option value="USD">$</option>
                </select>
              </label>
            </div>

            {type === 'income' && (
              <div className="grid grid-cols-3 gap-2">
                {([['cash', 'نقداً'], ['transfer', 'حوالة'], ['other', 'أخرى']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setMethod(v)}
                    className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${method === v ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
                    {l}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {type === 'due' ? (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-extrabold text-ruwad-navy">تاريخ الاستحقاق *</span>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
                </label>
              ) : (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-extrabold text-ruwad-navy">التاريخ</span>
                  <input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className={inputCls} />
                </label>
              )}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold text-ruwad-navy">وصف</span>
                <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
              </label>
            </div>

            {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
            <button onClick={save} disabled={saving}
              className="text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition"
              style={{ background: ui.bg }}>
              {saving && <Loader2 size={15} className="animate-spin" />} تسجيل {ui.label}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================= اتفاقات تعويض المدربين ================= */

function CompensationsModal({ instituteId, trainers, compensations, onClose, onSaved }: {
  instituteId: string; trainers: Person[]; compensations: Compensation[]
  onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [trainerId, setTrainerId] = useState('')
  const [compType, setCompType] = useState<'percent' | 'fixed_monthly'>('percent')
  const [value, setValue] = useState('')
  const [currency, setCurrency] = useState<'SYP' | 'USD'>('SYP')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    const v = Number(value)
    if (!trainerId || !v || v <= 0 || (compType === 'percent' && v > 100)) { setError('أدخل قيماً صحيحة'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('trainer_compensations')
      .upsert({ institute_id: instituteId, trainer_id: trainerId, comp_type: compType, value: v, currency }, { onConflict: 'institute_id,trainer_id' })
    setSaving(false)
    if (err) { setError('تعذّر الحفظ'); return }
    onSaved()
  }

  async function remove(id: string) {
    if (!confirm('حذف هذا الاتفاق؟')) return
    await supabase.from('trainer_compensations').delete().eq('id', id)
    onSaved()
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-md rounded-t-ruwad sm:rounded-ruwad max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray">
          <h3 className="font-extrabold text-ruwad-navy">اتفاقات تعويض المدربين</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {compensations.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {compensations.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs bg-[#F5F6FA] rounded-lg px-3 py-2">
                  <span className="font-bold text-ruwad-navy">{c.trainer.full_name} — {c.comp_type === 'percent' ? `${c.value}%` : `${fmt(c.value)} ${CUR[c.currency]}/شهر`}</span>
                  <button onClick={() => remove(c.id)} className="text-ruwad-navy/25 hover:text-red-500"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="border-t-2 border-dashed border-ruwad-gray pt-4 flex flex-col gap-3">
            <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className={inputCls}>
              <option value="">— اختر المدرب —</option>
              {trainers.map((t) => <option key={t.user_id} value={t.user_id}>{t.profile.full_name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setCompType('percent')}
                className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${compType === 'percent' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
                نسبة من التحصيل
              </button>
              <button onClick={() => setCompType('fixed_monthly')}
                className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${compType === 'fixed_monthly' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
                مبلغ شهري ثابت
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" min={1} max={compType === 'percent' ? 100 : undefined} value={value} onChange={(e) => setValue(e.target.value)}
                placeholder={compType === 'percent' ? 'النسبة %' : 'المبلغ الشهري'} className={inputCls + ' col-span-2'} />
              <select value={currency} onChange={(e) => setCurrency(e.target.value as 'SYP' | 'USD')} className={inputCls}>
                <option value="SYP">ل.س</option><option value="USD">$</option>
              </select>
            </div>
            {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
            <button onClick={save} disabled={saving}
              className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
              {saving && <Loader2 size={15} className="animate-spin" />} حفظ الاتفاق
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
