'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronRight, ChevronLeft, Plus, X, Loader2, Banknote, Trash2,
  TrendingUp, TrendingDown, Scale, UserRound, ReceiptText,
} from 'lucide-react'

/* ================================================================
   المصاريف والرواتب والخلاصة الشهرية: دخل − مصاريف = صافٍ (لكل عملة)
   ================================================================ */

interface Expense {
  id: string; category: string; trainer_id: string | null; amount: number
  currency: string; description: string | null; spent_at: string
  trainer: { full_name: string } | null
}
interface Compensation { id: string; trainer_id: string; comp_type: 'percent' | 'fixed_monthly'; value: number; currency: string; trainer: { full_name: string } }
interface Summary {
  income: { currency: string; amount: number }[]
  expenses: { currency: string; category: string; amount: number }[]
  trainer_dues: { trainer_id: string; name: string; comp_type: string; value: number; currency: string; owed: number; paid: number }[]
}
interface Trainer { user_id: string; profile: { full_name: string } }

const CUR: Record<string, string> = { SYP: 'ل.س', USD: '$' }
const CAT_AR: Record<string, string> = { salary: 'راتب', rent: 'إيجار', utilities: 'فواتير', supplies: 'مستلزمات', marketing: 'تسويق', other: 'أخرى' }
const fmt = (n: number) => Number(n).toLocaleString('ar')
const MONTH_FMT = new Intl.DateTimeFormat('ar', { month: 'long', year: 'numeric' })

export function ExpensesPanel({ instituteId, initialSummary, initialExpenses, compensations, trainers }: {
  instituteId: string
  initialSummary: Summary | null
  initialExpenses: Expense[]
  compensations: Compensation[]
  trainers: Trainer[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [summary, setSummary] = useState<Summary | null>(initialSummary)
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<null | { category?: string; trainerId?: string; amount?: number; currency?: string }>(null)
  const [compEditing, setCompEditing] = useState(false)

  const isCurrentMonth = month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear()

  useEffect(() => {
    if (isCurrentMonth && summary === initialSummary) return
    let cancelled = false
    setLoading(true)
    supabase.rpc('institute_monthly_summary', {
      p_institute_id: instituteId,
      p_month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`,
    }).then(({ data }) => {
      if (!cancelled) { setSummary(data as Summary | null); setLoading(false) }
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  // صافي كل عملة
  const currencies = ['SYP', 'USD'].filter((c) =>
    (summary?.income ?? []).some((i) => i.currency === c && Number(i.amount) > 0)
    || (summary?.expenses ?? []).some((e) => e.currency === c && Number(e.amount) > 0)
  )
  const net = (c: string) => {
    const inc = (summary?.income ?? []).filter((i) => i.currency === c).reduce((s, i) => s + Number(i.amount), 0)
    const exp = (summary?.expenses ?? []).filter((e) => e.currency === c).reduce((s, e) => s + Number(e.amount), 0)
    return { inc, exp, net: inc - exp }
  }

  async function removeExpense(e: Expense) {
    if (!confirm(`حذف مصروف "${CAT_AR[e.category] ?? e.category} — ${fmt(e.amount)} ${CUR[e.currency]}"؟`)) return
    await supabase.from('institute_expenses').delete().eq('id', e.id)
    router.refresh()
  }

  const monthExpenses = initialExpenses.filter((e) => {
    const d = new Date(e.spent_at)
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
  })

  return (
    <div className="flex flex-col gap-5">
      {/* اختيار الشهر */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} aria-label="الشهر السابق"
          className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-ruwad-navy hover:bg-ruwad-gray/30">
          <ChevronRight size={16} />
        </button>
        <h3 className="text-base font-extrabold text-ruwad-navy min-w-[9rem] text-center flex items-center justify-center gap-2">
          {MONTH_FMT.format(month)} {loading && <Loader2 size={14} className="animate-spin text-ruwad-navy/40" />}
        </h3>
        <button onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} disabled={isCurrentMonth} aria-label="الشهر التالي"
          className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-ruwad-navy hover:bg-ruwad-gray/30 disabled:opacity-30">
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* الخلاصة لكل عملة */}
      {currencies.length === 0 ? (
        <p className="text-center text-sm text-ruwad-navy/45 bg-white rounded-ruwad shadow-card py-8">لا حركة مالية في هذا الشهر.</p>
      ) : currencies.map((c) => {
        const s = net(c)
        return (
          <div key={c} className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-ruwad shadow-card p-4 flex flex-col gap-1">
              <TrendingUp size={16} className="text-green-500" />
              <p className="text-[11px] font-bold text-ruwad-navy/50">الدخل ({CUR[c]})</p>
              <p className="text-lg font-black text-green-600">{fmt(s.inc)}</p>
            </div>
            <div className="bg-white rounded-ruwad shadow-card p-4 flex flex-col gap-1">
              <TrendingDown size={16} className="text-red-400" />
              <p className="text-[11px] font-bold text-ruwad-navy/50">المصاريف ({CUR[c]})</p>
              <p className="text-lg font-black text-red-500">{fmt(s.exp)}</p>
            </div>
            <div className={`rounded-ruwad shadow-card p-4 flex flex-col gap-1 ${s.net >= 0 ? 'bg-ruwad-gradient text-white' : 'bg-red-500 text-white'}`}>
              <Scale size={16} className="opacity-80" />
              <p className="text-[11px] font-bold opacity-80">الصافي ({CUR[c]})</p>
              <p className="text-lg font-black">{fmt(s.net)}</p>
            </div>
          </div>
        )
      })}

      {/* مستحقات المدربين */}
      <div className="bg-white rounded-ruwad shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-extrabold text-ruwad-navy flex items-center gap-1.5"><UserRound size={15} className="text-ruwad-blue" /> مستحقات المدربين</p>
          <button onClick={() => setCompEditing(true)} className="text-[11px] font-extrabold text-ruwad-blue hover:underline">إدارة الاتفاقات</button>
        </div>
        {(summary?.trainer_dues ?? []).length === 0 ? (
          <p className="text-xs text-ruwad-navy/45 py-2">لا اتفاقات تعويض بعد — أضفها من «إدارة الاتفاقات».</p>
        ) : (
          <div className="flex flex-col gap-2">
            {summary!.trainer_dues.map((d) => {
              const remaining = Math.max(Number(d.owed) - Number(d.paid), 0)
              return (
                <div key={d.trainer_id + d.currency} className="flex items-center justify-between gap-3 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-ruwad-navy truncate">{d.name}</p>
                    <p className="text-[11px] font-bold text-ruwad-navy/45">
                      {d.comp_type === 'percent' ? `${d.value}% من التحصيلات` : `${fmt(d.value)} ${CUR[d.currency]} شهرياً`}
                      {' · '}مستحق {fmt(d.owed)} · مدفوع {fmt(d.paid)} {CUR[d.currency]}
                    </p>
                  </div>
                  {remaining > 0 ? (
                    <button onClick={() => setAdding({ category: 'salary', trainerId: d.trainer_id, amount: remaining, currency: d.currency })}
                      className="shrink-0 text-[11px] font-extrabold text-white bg-green-500 hover:bg-green-600 rounded-full px-3 py-1.5 flex items-center gap-1 transition">
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

      {/* مصاريف الشهر */}
      <div className="bg-white rounded-ruwad shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-extrabold text-ruwad-navy flex items-center gap-1.5"><ReceiptText size={15} className="text-ruwad-blue" /> مصاريف الشهر ({monthExpenses.length})</p>
          <button onClick={() => setAdding({})}
            className="flex items-center gap-1 text-[11px] font-extrabold text-white bg-ruwad-blue rounded-full px-3 py-1.5 hover:opacity-90 transition">
            <Plus size={12} /> مصروف
          </button>
        </div>
        {monthExpenses.length === 0 ? (
          <p className="text-xs text-ruwad-navy/45 py-2">لا مصاريف مسجّلة هذا الشهر.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {monthExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 text-xs bg-[#F5F6FA] rounded-lg px-3 py-2">
                <span className="font-bold text-ruwad-navy/70 truncate">
                  <span className="text-ruwad-navy font-extrabold">{CAT_AR[e.category] ?? e.category}</span>
                  {e.trainer?.full_name ? ` — ${e.trainer.full_name}` : ''}
                  {e.description ? ` · ${e.description}` : ''}
                  {' · '}{new Date(e.spent_at).toLocaleDateString('ar')}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="font-extrabold text-ruwad-navy">{fmt(e.amount)} {CUR[e.currency]}</span>
                  <button onClick={() => removeExpense(e)} aria-label="حذف" className="text-ruwad-navy/25 hover:text-red-500"><Trash2 size={12} /></button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding && (
        <ExpenseModal instituteId={instituteId} trainers={trainers} preset={adding}
          onClose={() => setAdding(null)} onSaved={() => { setAdding(null); router.refresh() }} />
      )}
      {compEditing && (
        <CompensationsModal instituteId={instituteId} trainers={trainers} compensations={compensations}
          onClose={() => setCompEditing(false)} onSaved={() => { setCompEditing(false); router.refresh() }} />
      )}
    </div>
  )
}

/* ================= تسجيل مصروف / دفع راتب ================= */

function ExpenseModal({ instituteId, trainers, preset, onClose, onSaved }: {
  instituteId: string; trainers: Trainer[]
  preset: { category?: string; trainerId?: string; amount?: number; currency?: string }
  onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [category, setCategory] = useState(preset.category ?? 'other')
  const [trainerId, setTrainerId] = useState(preset.trainerId ?? '')
  const [amount, setAmount] = useState(preset.amount ? String(preset.amount) : '')
  const [currency, setCurrency] = useState<'SYP' | 'USD'>((preset.currency as 'SYP' | 'USD') ?? 'SYP')
  const [description, setDescription] = useState('')
  const [spentAt, setSpentAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    const a = Number(amount)
    if (!a || a <= 0) { setError('أدخل مبلغاً صحيحاً'); return }
    if (category === 'salary' && !trainerId) { setError('اختر المدرب لمصروف الراتب'); return }
    setSaving(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const { error: err } = await supabase.from('institute_expenses').insert({
      institute_id: instituteId, category,
      trainer_id: category === 'salary' ? trainerId : null,
      amount: a, currency, description: description.trim() || null,
      spent_at: spentAt, created_by: session!.user.id,
    })
    setSaving(false)
    if (err) { setError('تعذّر الحفظ'); return }
    onSaved()
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full'

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-sm rounded-t-ruwad sm:rounded-ruwad max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray">
          <h3 className="font-extrabold text-ruwad-navy">{category === 'salary' ? 'دفع راتب' : 'تسجيل مصروف'}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">الفئة</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls + ' bg-white'}>
              {Object.entries(CAT_AR).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {category === 'salary' && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">المدرب *</span>
              <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className={inputCls + ' bg-white'}>
                <option value="">— اختر —</option>
                {trainers.map((t) => <option key={t.user_id} value={t.user_id}>{t.profile.full_name}</option>)}
              </select>
            </label>
          )}
          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">المبلغ *</span>
              <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">العملة</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as 'SYP' | 'USD')} className={inputCls + ' bg-white'}>
                <option value="SYP">ل.س</option><option value="USD">$</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">التاريخ</span>
              <input type="date" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">وصف</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
            </label>
          </div>
          {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
          <button onClick={save} disabled={saving}
            className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
            {saving && <Loader2 size={15} className="animate-spin" />} حفظ
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================= اتفاقات تعويض المدربين ================= */

function CompensationsModal({ instituteId, trainers, compensations, onClose, onSaved }: {
  instituteId: string; trainers: Trainer[]; compensations: Compensation[]
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

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full'

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
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">المدرب *</span>
              <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className={inputCls + ' bg-white'}>
                <option value="">— اختر —</option>
                {trainers.map((t) => <option key={t.user_id} value={t.user_id}>{t.profile.full_name}</option>)}
              </select>
            </label>
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
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="text-xs font-extrabold text-ruwad-navy">{compType === 'percent' ? 'النسبة % *' : 'المبلغ الشهري *'}</span>
                <input type="number" min={1} max={compType === 'percent' ? 100 : undefined} value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold text-ruwad-navy">العملة</span>
                <select value={currency} onChange={(e) => setCurrency(e.target.value as 'SYP' | 'USD')} className={inputCls + ' bg-white'}>
                  <option value="SYP">ل.س</option><option value="USD">$</option>
                </select>
              </label>
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
