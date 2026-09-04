'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Banknote, HandCoins, ReceiptText, PiggyBank, X, Loader2, Printer,
  TrendingUp, TrendingDown, Scale, Building2, BarChart3, Filter, Trash2,
  CalendarClock, CheckCircle2,
} from 'lucide-react'

/* ================================================================
   مالية المدرب — مستقلة تماماً عن المعهد:
   ما يستلمه ويستحقه من كل معهد (للقراءة فقط) + دفتره الخاص القابل للتحرير
   ================================================================ */

type EntryType = 'income' | 'due' | 'expense' | 'withdrawal'

interface OwnEntry {
  id: string; entry_type: EntryType; party_name: string | null; category: string | null
  due_link: string | null; amount: number; currency: 'SYP' | 'USD'; method: string | null
  description: string | null; due_date: string | null; occurred_at: string; receipt_code: string | null
}
interface Overview {
  received: { institute_id: string; institute_name: string; currency: string; amount: number }[]
  dues: { institute_id: string; institute_name: string; comp_type: string; value: number; currency: string; owed: number; paid: number; due_date: string | null }[]
  own_month: { currency: string; type: string; amount: number }[]
  own_dues: { currency: string; outstanding: number; overdue: number }[]
  own_series: { ym: string; currency: string; income: number; outgo: number }[]
}

const CUR: Record<string, string> = { SYP: 'ل.س', USD: '$' }
const CAT_AR: Record<string, string> = { transport: 'مواصلات', supplies: 'مستلزمات', marketing: 'تسويق', other: 'أخرى' }
const fmt = (n: number) => Number(n).toLocaleString('ar')
const todayStr = () => new Date().toISOString().slice(0, 10)

const TYPE_UI: Record<EntryType, { label: string; icon: typeof Banknote; bg: string; soft: string; text: string }> = {
  income: { label: 'قبض', icon: Banknote, bg: '#16a34a', soft: '#f0fdf4', text: '#15803d' },
  due: { label: 'مستحق', icon: HandCoins, bg: '#d97706', soft: '#fffbeb', text: '#b45309' },
  expense: { label: 'مصروف', icon: ReceiptText, bg: '#dc2626', soft: '#fef2f2', text: '#b91c1c' },
  withdrawal: { label: 'سحب', icon: PiggyBank, bg: '#7c3aed', soft: '#f5f3ff', text: '#6d28d9' },
}

function dueRemaining(due: OwnEntry, all: OwnEntry[]) {
  const paid = all.filter((e) => e.due_link === due.id).reduce((s, e) => s + Number(e.amount), 0)
  return { paid, remaining: Math.max(Number(due.amount) - paid, 0) }
}

export function TrainerFinanceHub({ overview, ownLedger }: { overview: Overview | null; ownLedger: OwnEntry[] }) {
  const router = useRouter()
  const [modal, setModal] = useState<null | { type: EntryType; preset?: Partial<{ partyName: string; dueLink: string; amount: number; currency: 'SYP' | 'USD' }> }>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | EntryType>('all')
  const [chartCur, setChartCur] = useState<'SYP' | 'USD'>('SYP')

  const monthAmt = (t: string, c: string) => (overview?.own_month ?? []).filter((m) => m.type === t && m.currency === c).reduce((s, m) => s + Number(m.amount), 0)
  const currencies = (['SYP', 'USD'] as const).filter((c) =>
    (overview?.own_month ?? []).some((m) => m.currency === c)
    || (overview?.dues ?? []).some((d) => d.currency === c)
    || (overview?.received ?? []).some((r) => r.currency === c))
  const activeCurrencies = currencies.length ? currencies : (['SYP'] as const)

  const openDues = useMemo(() => ownLedger
    .filter((e) => e.entry_type === 'due')
    .map((d) => ({ ...d, ...dueRemaining(d, ownLedger) }))
    .filter((d) => d.remaining > 0)
    .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')), [ownLedger])

  const shownLedger = useMemo(() => (typeFilter === 'all' ? ownLedger : ownLedger.filter((e) => e.entry_type === typeFilter)).slice(0, 80), [ownLedger, typeFilter])

  const chart = useMemo(() => {
    const months: { ym: string; label: string; income: number; outgo: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const row = (overview?.own_series ?? []).find((s) => s.ym === ym && s.currency === chartCur)
      months.push({ ym, label: d.toLocaleDateString('ar', { month: 'short' }), income: Number(row?.income ?? 0), outgo: Number(row?.outgo ?? 0) })
    }
    const max = Math.max(...months.map((m) => Math.max(m.income, m.outgo)), 1)
    return { months, max }
  }, [overview, chartCur])

  const supabase = createClient()
  async function removeEntry(e: OwnEntry) {
    if (!confirm(`حذف قيد "${TYPE_UI[e.entry_type].label} — ${fmt(e.amount)} ${CUR[e.currency]}"؟`)) return
    await supabase.from('trainer_ledger').delete().eq('id', e.id)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ===== من المعاهد (للقراءة) ===== */}
      {((overview?.dues.length ?? 0) > 0 || (overview?.received.length ?? 0) > 0) && (
        <div className="bg-white rounded-ruwad shadow-card p-4">
          <p className="text-sm font-extrabold text-ruwad-navy mb-3 flex items-center gap-1.5"><Building2 size={15} className="text-ruwad-blue" /> من المعاهد (هذا الشهر)</p>
          <div className="flex flex-col gap-2">
            {overview!.dues.map((d) => {
              const remaining = Math.max(Number(d.owed) - Number(d.paid), 0)
              const notYetDue = Number(d.owed) === 0 && d.due_date
              return (
                <div key={d.institute_id + d.currency} className="flex items-center justify-between gap-3 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-ruwad-navy truncate">{d.institute_name}</p>
                    <p className="text-[11px] font-bold text-ruwad-navy/45">
                      {d.comp_type === 'percent' ? `${d.value}% من التحصيل` : `${fmt(d.value)} ${CUR[d.currency]} شهرياً`}
                      {notYetDue ? ` · يستحق ${new Date(d.due_date!).toLocaleDateString('ar')}` : ` · مستحق ${fmt(d.owed)} · مستلم ${fmt(d.paid)} ${CUR[d.currency]}`}
                    </p>
                  </div>
                  {remaining > 0 ? (
                    <span className="shrink-0 flex items-center gap-1 text-[11px] font-extrabold text-amber-600 bg-amber-50 rounded-full px-3 py-1.5"><CalendarClock size={11} /> متبقٍ {fmt(remaining)}</span>
                  ) : notYetDue ? (
                    <span className="shrink-0 text-[11px] font-extrabold text-ruwad-navy/35">لم يستحق بعد</span>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 text-[11px] font-extrabold text-green-600"><CheckCircle2 size={12} /> مستلم بالكامل</span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-[10px] font-bold text-ruwad-navy/35 mt-3">هذا القسم للاطلاع — الدفع يتم من طرف إدارة كل معهد.</p>
        </div>
      )}

      {/* ===== دفتري الخاص ===== */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-ruwad-navy">دفتري المالي المستقل</p>
      </div>

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

      {activeCurrencies.map((c) => {
        const inc = monthAmt('income', c)
        const exp = monthAmt('expense', c)
        const wd = monthAmt('withdrawal', c)
        const net = inc - exp - wd
        const duesRow = (overview?.own_dues ?? []).find((d) => d.currency === c)
        return (
          <div key={c} className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
            <div className="bg-white rounded-ruwad shadow-card p-3.5 flex flex-col gap-1">
              <TrendingUp size={15} className="text-green-500" />
              <p className="text-[10px] font-bold text-ruwad-navy/50">دخلي هذا الشهر ({CUR[c]})</p>
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
            <div className="rounded-ruwad shadow-card p-3.5 flex flex-col gap-1 bg-white col-span-2 lg:col-span-1">
              <HandCoins size={15} className="text-amber-500" />
              <p className="text-[10px] font-bold text-ruwad-navy/50">مستحقاتي ({CUR[c]})</p>
              <p className="text-lg font-black text-amber-600">{fmt(Number(duesRow?.outstanding ?? 0))}</p>
            </div>
          </div>
        )
      })}

      <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-extrabold text-ruwad-navy flex items-center gap-1.5"><BarChart3 size={15} className="text-ruwad-blue" /> آخر 6 أشهر</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-bold text-ruwad-navy/50"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> دخل</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-ruwad-navy/50"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> صرف</span>
            <button onClick={() => setChartCur(chartCur === 'SYP' ? 'USD' : 'SYP')} className="text-[11px] font-extrabold text-ruwad-blue bg-ruwad-blue/10 rounded-full px-2.5 py-1">{CUR[chartCur]}</button>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-36">
          {chart.months.map((m) => (
            <div key={m.ym} className="flex-1 flex flex-col items-center gap-1.5 h-full">
              <div className="flex-1 w-full flex items-end justify-center gap-1">
                <div className="w-3.5 sm:w-5 rounded-t-md bg-green-500" style={{ height: `${(m.income / chart.max) * 100}%`, minHeight: m.income > 0 ? 4 : 0 }} />
                <div className="w-3.5 sm:w-5 rounded-t-md bg-red-400" style={{ height: `${(m.outgo / chart.max) * 100}%`, minHeight: m.outgo > 0 ? 4 : 0 }} />
              </div>
              <span className="text-[10px] font-bold text-ruwad-navy/45">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {openDues.length > 0 && (
        <div className="bg-white rounded-ruwad shadow-card p-4">
          <p className="text-sm font-extrabold text-ruwad-navy mb-3 flex items-center gap-1.5"><HandCoins size={15} className="text-amber-500" /> مستحقاتي المفتوحة ({openDues.length})</p>
          <div className="flex flex-col gap-2">
            {openDues.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">
                <p className="text-sm font-extrabold text-ruwad-navy truncate">{d.party_name} — متبقٍ {fmt(d.remaining)} {CUR[d.currency]}</p>
                <button onClick={() => setModal({ type: 'income', preset: { partyName: d.party_name ?? undefined, dueLink: d.id, amount: d.remaining, currency: d.currency } })}
                  className="shrink-0 flex items-center gap-1 text-[11px] font-extrabold text-white bg-green-500 hover:bg-green-600 rounded-full px-3.5 py-2 transition">
                  <Banknote size={12} /> قبض {fmt(d.remaining)}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-ruwad shadow-card p-4">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <p className="text-sm font-extrabold text-ruwad-navy flex items-center gap-1.5"><Filter size={14} className="text-ruwad-blue" /> سجل حركاتي</p>
          <div className="flex gap-1.5 overflow-x-auto">
            <button onClick={() => setTypeFilter('all')} className={`shrink-0 text-[11px] font-extrabold px-3 py-1.5 rounded-full border-2 transition ${typeFilter === 'all' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>الكل</button>
            {(Object.keys(TYPE_UI) as EntryType[]).map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className="shrink-0 text-[11px] font-extrabold px-3 py-1.5 rounded-full border-2 transition"
                style={typeFilter === t ? { background: TYPE_UI[t].bg, borderColor: TYPE_UI[t].bg, color: '#fff' } : { background: '#fff', borderColor: '#DEE0ED', color: TYPE_UI[t].text }}>
                {TYPE_UI[t].label}
              </button>
            ))}
          </div>
        </div>
        {shownLedger.length === 0 ? (
          <p className="text-xs text-ruwad-navy/45 py-2">لا حركات في دفترك الخاص بعد.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {shownLedger.map((e) => {
              const ui = TYPE_UI[e.entry_type]
              return (
                <div key={e.id} className="flex items-center justify-between gap-2 rounded-ruwad-sm px-3 py-2.5" style={{ background: ui.soft }}>
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span className="shrink-0 text-[10px] font-extrabold text-white px-2 py-1 rounded-full" style={{ background: ui.bg }}>{ui.label}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-ruwad-navy truncate">
                        {e.entry_type === 'expense' ? (CAT_AR[e.category ?? ''] ?? '') : ''}
                        {e.entry_type === 'expense' && e.party_name ? ' — ' : ''}{e.party_name ?? (e.entry_type === 'withdrawal' ? 'سحب شخصي' : '')}
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
                      <Link href={`/finance/receipt/${e.id}`} target="_blank" title="الإيصال" className="text-ruwad-navy/30 hover:text-ruwad-blue"><Printer size={13} /></Link>
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
        <EntryModal initialType={modal.type} preset={modal.preset} openDues={openDues}
          onClose={() => setModal(null)} onSaved={() => { setModal(null); router.refresh() }} />
      )}
    </div>
  )
}

/* ================= نافذة الإدخال الموحّدة (دفتر المدرب الخاص) ================= */

function EntryModal({ initialType, preset, openDues, onClose, onSaved }: {
  initialType: EntryType; preset?: Partial<{ partyName: string; dueLink: string; amount: number; currency: 'SYP' | 'USD' }>
  openDues: (OwnEntry & { remaining: number })[]
  onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [type, setType] = useState<EntryType>(initialType)
  const [partyName, setPartyName] = useState(preset?.partyName ?? '')
  const [dueLink, setDueLink] = useState(preset?.dueLink ?? '')
  const [category, setCategory] = useState('other')
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

  async function save() {
    const a = Number(amount)
    if (!a || a <= 0) { setError('أدخل مبلغاً صحيحاً'); return }
    if (type === 'due' && partyName.trim().length < 2) { setError('اكتب اسم الجهة أو الشخص'); return }
    setSaving(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    let receipt_code: string | null = null
    if (type === 'income') {
      const { data } = await supabase.rpc('generate_receipt_code')
      receipt_code = data as string
    }
    const { data: row, error: err } = await supabase.from('trainer_ledger').insert({
      trainer_id: session!.user.id,
      entry_type: type,
      party_name: needsParty && partyName.trim() ? partyName.trim() : null,
      due_link: type === 'income' && dueLink ? dueLink : null,
      category: type === 'expense' ? category : null,
      amount: a, currency,
      method: type === 'income' ? method : null,
      due_date: type === 'due' ? dueDate : null,
      occurred_at: new Date(occurredAt + 'T12:00:00').toISOString(),
      description: description.trim() || null,
      receipt_code,
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
            <Link href={`/finance/receipt/${receiptId}`} target="_blank" className="flex items-center gap-2 bg-ruwad-blue text-white text-sm font-extrabold px-5 py-2.5 rounded-ruwad-sm hover:opacity-90 transition">
              <Printer size={15} /> فتح الإيصال للطباعة
            </Link>
            <button onClick={onSaved} className="text-xs font-bold text-ruwad-navy/50 hover:text-ruwad-navy">إغلاق</button>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(TYPE_UI) as EntryType[]).map((t) => (
                <button key={t} onClick={() => setType(t)} className="py-2.5 rounded-ruwad-sm text-xs font-extrabold border-2 transition"
                  style={type === t ? { background: TYPE_UI[t].bg, borderColor: TYPE_UI[t].bg, color: '#fff' } : { background: '#fff', borderColor: '#DEE0ED', color: TYPE_UI[t].text }}>
                  {TYPE_UI[t].label}
                </button>
              ))}
            </div>

            {needsParty && (
              <>
                <input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder={type === 'income' ? 'استلمت من (اسم الطالب/الجهة)' : 'الجهة أو الشخص المستحق منه *'} className={inputCls} />
                {type === 'income' && openDues.length > 0 && (
                  <select value={dueLink} onChange={(e) => {
                    setDueLink(e.target.value)
                    const d = openDues.find((x) => x.id === e.target.value)
                    if (d) { setAmount(String(d.remaining)); setCurrency(d.currency); setPartyName(d.party_name ?? '') }
                  }} className={inputCls + ' border-amber-300 bg-amber-50/50'}>
                    <option value="">تسديد مستحق معيّن (اختياري)</option>
                    {openDues.map((d) => <option key={d.id} value={d.id}>{d.party_name} — متبقٍ {fmt(d.remaining)} {CUR[d.currency]}</option>)}
                  </select>
                )}
              </>
            )}

            {type === 'expense' && (
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {Object.entries(CAT_AR).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            )}

            <div className="grid grid-cols-3 gap-3">
              <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="المبلغ *" className={inputCls + ' col-span-2'} />
              <select value={currency} onChange={(e) => setCurrency(e.target.value as 'SYP' | 'USD')} className={inputCls}><option value="SYP">ل.س</option><option value="USD">$</option></select>
            </div>

            {type === 'income' && (
              <div className="grid grid-cols-3 gap-2">
                {([['cash', 'نقداً'], ['transfer', 'حوالة'], ['other', 'أخرى']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setMethod(v)} className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${method === v ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>{l}</button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {type === 'due' ? (
                <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">تاريخ الاستحقاق *</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} /></label>
              ) : (
                <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ruwad-navy">التاريخ</span><input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className={inputCls} /></label>
              )}
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف" className={inputCls} />
            </div>

            {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
            <button onClick={save} disabled={saving} className="text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition" style={{ background: ui.bg }}>
              {saving && <Loader2 size={15} className="animate-spin" />} تسجيل {ui.label}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
