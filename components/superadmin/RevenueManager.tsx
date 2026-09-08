'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RevenueTrendChart } from './RevenueTrendChart'
import {
  Plus, X, Loader2, Search, TrendingUp, TrendingDown, Minus, CalendarClock,
  CalendarDays, CalendarRange, Trash2, Pencil, UserRound, Building2, PauseCircle, PlayCircle,
} from 'lucide-react'

export interface SubscriptionRow {
  id: string
  subscriber_id: string | null
  subscriber_name: string
  amount: number
  billing_cycle: 'monthly' | 'yearly'
  plan_name: string | null
  started_at: string // YYYY-MM-DD
  is_active: boolean
  cancelled_at: string | null
  notes: string | null
}

const CYCLE_LABEL: Record<SubscriptionRow['billing_cycle'], string> = { monthly: 'شهري', yearly: 'سنوي' }
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

const num = (v: unknown) => Number(v) || 0
const fmt = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
const todayStr = () => new Date().toISOString().slice(0, 10)

// القيمة السنوية المكافئة لاشتراك واحد: سنوي كما هو، شهري × 12
function yearlyEquivalent(sub: { amount: number; billing_cycle: 'monthly' | 'yearly' }) {
  return sub.billing_cycle === 'yearly' ? sub.amount : sub.amount * 12
}

// إجمالي الإيراد السنوي المتكرر (ARR) لكل الاشتراكات التي كانت "نشطة فعلياً" في تاريخ معيّن:
// بدأت قبله أو فيه، ولم تُوقَف قبله. هذا ما يجعل مقارنة الاتجاه مبنية على حالة حقيقية في الماضي.
function arrAsOf(subs: SubscriptionRow[], dateStr: string) {
  return subs
    .filter((s) => s.started_at <= dateStr && (!s.cancelled_at || s.cancelled_at > dateStr))
    .reduce((sum, s) => sum + yearlyEquivalent(s), 0)
}

function shiftDate(dateStr: string, monthsDelta: number, daysDelta = 0) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + monthsDelta)
  d.setDate(d.getDate() + daysDelta)
  return d.toISOString().slice(0, 10)
}

function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).toISOString().slice(0, 10)
}

export function RevenueManager({ initial }: { initial: SubscriptionRow[] }) {
  const [rows, setRows] = useState<SubscriptionRow[]>(initial.map((r) => ({ ...r, amount: num(r.amount) })))
  const [q, setQ] = useState('')
  const [showCancelled, setShowCancelled] = useState(true)
  const [editing, setEditing] = useState<SubscriptionRow | 'new' | null>(null)
  const [armedDelete, setArmedDelete] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const supabase = createClient()

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows
      .filter((r) => showCancelled || r.is_active)
      .filter((r) => !term || r.subscriber_name.toLowerCase().includes(term) || (r.plan_name ?? '').toLowerCase().includes(term))
      .sort((a, b) => (b.is_active === a.is_active ? b.started_at.localeCompare(a.started_at) : a.is_active ? -1 : 1))
  }, [rows, q, showCancelled])

  const stats = useMemo(() => {
    const today = todayStr()
    const arrNow = arrAsOf(rows, today)
    const arrYesterday = arrAsOf(rows, shiftDate(today, 0, -1))
    const arrLastMonth = arrAsOf(rows, shiftDate(today, -1))
    const arrLastYear = arrAsOf(rows, shiftDate(today, -12))

    const trend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? { dir: 'up' as const, pct: null } : { dir: 'flat' as const, pct: 0 }
      const pct = Math.round(((curr - prev) / prev) * 100)
      return { dir: pct > 0 ? ('up' as const) : pct < 0 ? ('down' as const) : ('flat' as const), pct }
    }

    return {
      daily: arrNow / 365, dailyTrend: trend(arrNow, arrYesterday),
      monthly: arrNow / 12, monthlyTrend: trend(arrNow, arrLastMonth),
      yearly: arrNow, yearlyTrend: trend(arrNow, arrLastYear),
    }
  }, [rows])

  // منحنى الإيراد الشهري المتكرر (MRR) — لقطة حقيقية من حالة الاشتراكات في نهاية كل شهر من آخر 12 شهراً
  const chartData = useMemo(() => {
    const now = new Date()
    const points: { label: string; value: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const asOf = endOfMonth(d.getFullYear(), d.getMonth())
      points.push({ label: MONTHS_AR[d.getMonth()].slice(0, 3), value: Math.round(arrAsOf(rows, asOf) / 12) })
    }
    return points
  }, [rows])

  const activeCount = rows.filter((r) => r.is_active).length

  async function toggleActive(row: SubscriptionRow) {
    setBusyId(row.id)
    const nextActive = !row.is_active
    const patch = nextActive ? { is_active: true, cancelled_at: null } : { is_active: false, cancelled_at: todayStr() }
    const { error } = await supabase.from('platform_subscriptions').update(patch).eq('id', row.id)
    setBusyId(null)
    if (!error) setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch } : r)))
  }

  async function remove(row: SubscriptionRow) {
    if (armedDelete !== row.id) {
      setArmedDelete(row.id)
      setTimeout(() => setArmedDelete((c) => (c === row.id ? null : c)), 3500)
      return
    }
    setBusyId(row.id); setArmedDelete(null)
    const { error } = await supabase.from('platform_subscriptions').delete().eq('id', row.id)
    setBusyId(null)
    if (!error) setRows((prev) => prev.filter((r) => r.id !== row.id))
  }

  function onSaved(saved: SubscriptionRow) {
    setRows((prev) => {
      const exists = prev.some((r) => r.id === saved.id)
      return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev]
    })
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ===== بطاقات الإيراد المتكرر ===== */}
      <div className="grid sm:grid-cols-3 gap-4">
        <RevenueStatCard icon={CalendarClock} label="الوارد اليومي" hint="= الوارد السنوي ÷ 365" value={stats.daily} trend={stats.dailyTrend} tone="navy" />
        <RevenueStatCard icon={CalendarDays} label="الوارد الشهري" hint="= الوارد السنوي ÷ 12" value={stats.monthly} trend={stats.monthlyTrend} tone="blue" />
        <RevenueStatCard icon={CalendarRange} label="الوارد السنوي" hint={`من ${activeCount} اشتراكاً نشطاً`} value={stats.yearly} trend={stats.yearlyTrend} tone="lime" />
      </div>
      <p className="text-xs font-bold text-ruwad-navy/50 -mt-3">
        كل بطاقة تجمع اشتراكاتك النشطة الحالية وتطبّعها إلى قيمتها المكافئة (اشتراك سنوي ÷ 12 = حصته الشهرية، وهكذا) — وليست مجموع ما دُفع فعلياً في هذه الفترة.
      </p>

      {/* ===== منحنى MRR ===== */}
      <div className="bg-white rounded-ruwad shadow-card p-6">
        <h2 className="text-sm font-extrabold text-ruwad-navy mb-1">منحنى الإيراد الشهري المتكرر — آخر 12 شهراً</h2>
        <p className="text-xs text-ruwad-navy/50 mb-3">لقطة حقيقية من حالة اشتراكاتك (نشطة/متوقفة) في نهاية كل شهر.</p>
        <RevenueTrendChart data={chartData} />
      </div>

      {/* ===== شريط الأدوات ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ruwad-navy/40" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث باسم المشترك أو الخطة"
              className="w-full border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm pr-10 pl-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none bg-white"
            />
          </div>
          <label className="flex items-center gap-1.5 text-xs font-extrabold text-ruwad-navy/60 shrink-0 cursor-pointer">
            <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="accent-ruwad-blue" />
            إظهار المتوقفة
          </label>
        </div>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-2 bg-ruwad-blue text-white font-extrabold px-5 py-2.5 rounded-ruwad-sm border-2 border-ruwad-navy shadow-hard hover-pop shrink-0">
          <Plus size={17} /> إضافة مشترك
        </button>
      </div>

      {/* ===== قائمة الاشتراكات ===== */}
      <div className="bg-white rounded-ruwad shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-ruwad-navy/50 text-sm py-10 text-center">لا توجد اشتراكات مطابقة.</p>
        ) : (
          <div className="flex flex-col divide-y divide-ruwad-gray/50">
            {filtered.map((r) => (
              <div key={r.id} className={`flex items-center gap-3 p-4 ${!r.is_active ? 'opacity-50' : ''}`}>
                <span className="w-10 h-10 rounded-full bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center shrink-0">
                  {r.subscriber_id ? <UserRound size={17} /> : <Building2 size={17} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-ruwad-navy text-sm truncate flex items-center gap-2">
                    {r.subscriber_name}
                    {!r.is_active && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-500">متوقف</span>}
                  </p>
                  <p className="text-[11px] text-ruwad-navy/50 font-bold flex items-center gap-1.5 flex-wrap">
                    {r.plan_name && <span>{r.plan_name} ·</span>}
                    {CYCLE_LABEL[r.billing_cycle]} · بدأ {new Date(r.started_at).toLocaleDateString('ar')}
                  </p>
                </div>
                <p className="font-extrabold text-ruwad-navy shrink-0">{fmt(r.amount)}<span className="text-[10px] text-ruwad-navy/40">/{r.billing_cycle === 'yearly' ? 'سنة' : 'شهر'}</span></p>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(r)} disabled={busyId === r.id} title={r.is_active ? 'إيقاف الاشتراك' : 'إعادة تفعيل'}
                    className="p-2 rounded-lg hover:bg-ruwad-gray/40 text-ruwad-navy/60 hover:text-ruwad-blue transition">
                    {busyId === r.id ? <Loader2 size={14} className="animate-spin" /> : r.is_active ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                  </button>
                  <button onClick={() => setEditing(r)} title="تعديل" className="p-2 rounded-lg hover:bg-ruwad-gray/40 text-ruwad-navy/60 hover:text-ruwad-blue transition">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(r)} disabled={busyId === r.id} title="حذف نهائي"
                    className={`p-2 rounded-lg transition ${armedDelete === r.id ? 'bg-red-500 text-white' : 'hover:bg-red-50 text-red-400'}`}>
                    {busyId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && <SubscriptionEditor sub={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
    </div>
  )
}

/* ================= بطاقة إحصائية بمؤشر اتجاه ================= */

function RevenueStatCard({ icon: Icon, label, hint, value, trend, tone }: {
  icon: typeof CalendarClock
  label: string
  hint: string
  value: number
  trend: { dir: 'up' | 'down' | 'flat'; pct: number | null }
  tone: 'navy' | 'blue' | 'lime'
}) {
  const toneCls = {
    navy: 'bg-ruwad-navy text-white',
    blue: 'bg-ruwad-gradient text-white',
    lime: 'bg-ruwad-lime text-ruwad-navy',
  }[tone]

  const TrendIcon = trend.dir === 'up' ? TrendingUp : trend.dir === 'down' ? TrendingDown : Minus
  const trendCls = trend.dir === 'up' ? 'bg-green-500/15 text-green-600' : trend.dir === 'down' ? 'bg-red-500/15 text-red-500' : 'bg-white/15 text-current opacity-70'
  const trendText = trend.pct === null ? 'جديد' : `${trend.pct > 0 ? '+' : ''}${trend.pct}%`

  return (
    <div className={`rounded-ruwad p-6 flex flex-col gap-3 shadow-ruwad ${toneCls}`}>
      <div className="flex items-center justify-between">
        <Icon size={22} className="opacity-80" />
        <span className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${trendCls}`}>
          <TrendIcon size={12} /> {trendText}
        </span>
      </div>
      <div>
        <p className="text-sm opacity-80">{label}</p>
        <p className="text-[10px] opacity-60 mt-0.5">{hint}</p>
      </div>
      <p className="text-3xl font-extrabold">{fmt(Math.round(value))}</p>
    </div>
  )
}

/* ================= نافذة إضافة/تعديل مشترك ================= */

interface SubscriberHit { id: string; full_name: string; email: string; role: string }

function SubscriptionEditor({ sub, onClose, onSaved }: {
  sub: SubscriptionRow | null
  onClose: () => void
  onSaved: (p: SubscriptionRow) => void
}) {
  const [subscriberId, setSubscriberId] = useState(sub?.subscriber_id ?? null)
  const [subscriberName, setSubscriberName] = useState(sub?.subscriber_name ?? '')
  const [manualMode, setManualMode] = useState(!sub?.subscriber_id)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SubscriberHit[]>([])
  const [searching, setSearching] = useState(false)
  const [amount, setAmount] = useState(sub ? String(num(sub.amount)) : '')
  const [cycle, setCycle] = useState<SubscriptionRow['billing_cycle']>(sub?.billing_cycle ?? 'yearly')
  const [planName, setPlanName] = useState(sub?.plan_name ?? '')
  const [startedAt, setStartedAt] = useState(sub?.started_at ?? todayStr())
  const [notes, setNotes] = useState(sub?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  let debounceRef: ReturnType<typeof setTimeout> | null = null
  function onQueryChange(v: string) {
    setQuery(v)
    if (debounceRef) clearTimeout(debounceRef)
    if (v.trim().length < 2) { setHits([]); return }
    debounceRef = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['trainer', 'institute_admin'])
        .ilike('full_name', `%${v.trim()}%`)
        .limit(8)
      setHits((data ?? []) as SubscriberHit[])
      setSearching(false)
    }, 350)
  }

  function pick(h: SubscriberHit) {
    setSubscriberId(h.id)
    setSubscriberName(h.full_name)
    setQuery('')
    setHits([])
  }

  async function save() {
    if (!subscriberName.trim()) return setError('اسم المشترك مطلوب')
    if (!(Number(amount) > 0)) return setError('المبلغ يجب أن يكون أكبر من صفر')
    setSaving(true); setError('')

    const payload = {
      subscriber_id: manualMode ? null : subscriberId,
      subscriber_name: subscriberName.trim(),
      amount: Number(amount),
      billing_cycle: cycle,
      plan_name: planName.trim() || null,
      started_at: startedAt,
      notes: notes.trim() || null,
    }

    const q = sub
      ? supabase.from('platform_subscriptions').update(payload).eq('id', sub.id).select().single()
      : supabase.from('platform_subscriptions').insert({ ...payload, is_active: true, cancelled_at: null }).select().single()
    const { data, error: err } = await q
    setSaving(false)
    if (err || !data) return setError('تعذّر الحفظ — تأكد من صلاحياتك')
    onSaved({ ...data, amount: num(data.amount) } as SubscriptionRow)
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'
  const labelCls = 'text-xs font-extrabold text-ruwad-navy'

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-md rounded-t-ruwad sm:rounded-ruwad max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray z-10">
          <h3 className="font-extrabold text-ruwad-navy">{sub ? 'تعديل اشتراك' : 'إضافة مشترك جديد'}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* المشترك */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className={labelCls}>المشترك</span>
              <button type="button" onClick={() => { setManualMode(!manualMode); setSubscriberId(null) }}
                className="text-[11px] font-extrabold text-ruwad-blue hover:underline">
                {manualMode ? 'اختر من الحسابات' : 'اسم يدوي (خارج المنصة)'}
              </button>
            </div>

            {manualMode ? (
              <input value={subscriberName} onChange={(e) => setSubscriberName(e.target.value)} placeholder="اسم المشترك" className={inputCls} />
            ) : subscriberId ? (
              <div className="flex items-center justify-between bg-ruwad-blue/5 border-2 border-ruwad-blue/30 rounded-ruwad-sm px-3.5 py-2.5">
                <span className="text-sm font-bold text-ruwad-navy">{subscriberName}</span>
                <button onClick={() => { setSubscriberId(null); setSubscriberName('') }} className="text-ruwad-navy/40 hover:text-red-500"><X size={15} /></button>
              </div>
            ) : (
              <div className="relative">
                <input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="اكتب اسم المدرب أو المعهد للبحث..." className={inputCls} />
                {searching && <Loader2 size={14} className="animate-spin absolute left-3.5 top-1/2 -translate-y-1/2 text-ruwad-navy/40" />}
                {hits.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white rounded-ruwad-sm shadow-ruwad border border-ruwad-gray/40 py-1 max-h-52 overflow-y-auto">
                    {hits.map((h) => (
                      <button key={h.id} onClick={() => pick(h)} type="button"
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-ruwad-navy hover:bg-ruwad-blue/5 transition text-right">
                        <span className="truncate font-bold">{h.full_name}</span>
                        <span className="text-ruwad-navy/40">· {h.role === 'trainer' ? 'مدرب' : 'معهد'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>المبلغ ($)</span>
              <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>تاريخ بدء الاشتراك</span>
              <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} className={inputCls} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['yearly', 'monthly'] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCycle(c)}
                className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${cycle === c ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
                يدفع {CYCLE_LABEL[c]}اً
              </button>
            ))}
          </div>
          <p className="text-[11px] font-bold text-ruwad-navy/40 -mt-2">
            سيُحتسب تلقائياً: {cycle === 'yearly' ? `~${fmt(Math.round((Number(amount) || 0) / 12))} كحصة شهرية` : `~${fmt(Math.round((Number(amount) || 0) * 12))} كحصة سنوية`}
          </p>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>اسم الخطة (اختياري)</span>
            <input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="معهد، بوابة بنطاق فرعي..." className={inputCls} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>ملاحظات (اختياري)</span>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} resize-y`} />
          </label>

          {error && <p className="text-sm font-bold text-red-500">{error}</p>}

          <button onClick={save} disabled={saving}
            className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
            {saving && <Loader2 size={15} className="animate-spin" />} حفظ
          </button>
        </div>
      </div>
    </div>
  )
}
