'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Wallet, TrendingUp, AlertTriangle, Plus, X, Loader2, Receipt,
  CircleDollarSign, CalendarClock, ChevronDown, Banknote, Printer,
} from 'lucide-react'

/* ================================================================
   المالية — خطط الأقساط، تسجيل الدفعات، الإيصالات، والمتأخرون
   ================================================================ */

interface Installment { id: string; seq: number; amount: number; due_date: string }
interface PayRecord { id: string; amount: number; method: string; paid_at: string; receipt_code: string; note: string | null }
interface Plan {
  id: string; enrollment_id: string; currency: 'SYP' | 'USD'; total_amount: number; notes: string | null
  installments: Installment[]; records: PayRecord[]
  enrollment: { id: string; student: { id: string; full_name: string }; course: { id: string; title: string } }
}
interface Overview {
  plans_count: number; total_expected: number; total_collected: number
  collected_this_month: number; overdue_amount: number; overdue_students: number
}
interface Plannable { id: string; student: { full_name: string }; course: { title: string } }

const CUR: Record<string, string> = { SYP: 'ل.س', USD: '$' }
const fmt = (n: number) => Number(n).toLocaleString('ar')

function planPaid(p: Plan) { return p.records.reduce((s, r) => s + Number(r.amount), 0) }
function planOverdue(p: Plan) {
  const today = new Date().toISOString().slice(0, 10)
  const dueSoFar = p.installments.filter((i) => i.due_date < today).reduce((s, i) => s + Number(i.amount), 0)
  return Math.max(dueSoFar - planPaid(p), 0)
}

export function FinanceManager({ instituteId, overview, initialPlans, plannable }: {
  instituteId: string
  overview: Overview | null
  initialPlans: Plan[]
  plannable: Plannable[]
}) {
  const [plans] = useState<Plan[]>(initialPlans)
  const [filter, setFilter] = useState<'all' | 'overdue'>('all')
  const [creating, setCreating] = useState(false)
  const [paying, setPaying] = useState<Plan | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const router = useRouter()

  const shown = useMemo(
    () => filter === 'overdue' ? plans.filter((p) => planOverdue(p) > 0) : plans,
    [plans, filter],
  )

  return (
    <div className="flex flex-col gap-5">
      {/* بطاقات الملخص */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-ruwad-gradient text-white rounded-ruwad shadow-ruwad p-4 sm:p-5 flex flex-col gap-1.5">
          <TrendingUp size={18} className="opacity-80" />
          <p className="text-[11px] opacity-80 font-bold">المحصّل هذا الشهر</p>
          <p className="text-xl sm:text-2xl font-black">{fmt(overview?.collected_this_month ?? 0)}</p>
        </div>
        <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-5 flex flex-col gap-1.5">
          <Wallet size={18} className="text-ruwad-blue" />
          <p className="text-[11px] text-ruwad-navy/55 font-bold">إجمالي المحصّل</p>
          <p className="text-xl sm:text-2xl font-black text-ruwad-navy">{fmt(overview?.total_collected ?? 0)}</p>
        </div>
        <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-5 flex flex-col gap-1.5">
          <CircleDollarSign size={18} className="text-ruwad-blue" />
          <p className="text-[11px] text-ruwad-navy/55 font-bold">المتوقع الكلي</p>
          <p className="text-xl sm:text-2xl font-black text-ruwad-navy">{fmt(overview?.total_expected ?? 0)}</p>
        </div>
        <button onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
          className={`rounded-ruwad p-4 sm:p-5 flex flex-col gap-1.5 text-right transition border-2 ${
            filter === 'overdue' ? 'bg-red-500 text-white border-red-500 shadow-ruwad' : 'bg-white shadow-card border-transparent hover:border-red-200'}`}>
          <AlertTriangle size={18} className={filter === 'overdue' ? 'opacity-90' : 'text-red-500'} />
          <p className={`text-[11px] font-bold ${filter === 'overdue' ? 'opacity-90' : 'text-red-500/80'}`}>متأخرات ({overview?.overdue_students ?? 0} طلاب)</p>
          <p className="text-xl sm:text-2xl font-black">{fmt(overview?.overdue_amount ?? 0)}</p>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ruwad-navy/60">
          {filter === 'overdue' ? `المتأخرون: ${shown.length}` : `خطط الدفع: ${plans.length}`}
        </p>
        <button onClick={() => setCreating(true)} disabled={plannable.length === 0}
          className="flex items-center gap-1.5 bg-ruwad-blue text-white text-sm font-extrabold px-4 py-2.5 rounded-ruwad-sm hover:opacity-90 disabled:opacity-50 transition">
          <Plus size={15} /> خطة دفع جديدة
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/50 text-sm">
          {filter === 'overdue' ? 'لا متأخرات — ممتاز! 🎉' : 'لا خطط دفع بعد. أنشئ أول خطة لطالب من الزر أعلاه.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((p) => {
            const paid = planPaid(p)
            const overdue = planOverdue(p)
            const pct = Math.min(Math.round((paid / Number(p.total_amount)) * 100), 100)
            const cur = CUR[p.currency]
            const open = expanded === p.id
            return (
              <div key={p.id} className={`bg-white rounded-ruwad shadow-card overflow-hidden ${overdue > 0 ? 'ring-2 ring-red-300' : ''}`}>
                <button onClick={() => setExpanded(open ? null : p.id)} className="w-full p-4 flex items-center gap-3 text-right">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-ruwad-navy">{p.enrollment.student.full_name}</p>
                      <span className="text-[11px] font-bold text-ruwad-navy/45">— {p.enrollment.course.title}</span>
                      {overdue > 0 && (
                        <span className="text-[10px] font-extrabold text-red-600 bg-red-50 rounded-full px-2 py-0.5">
                          متأخر {fmt(overdue)} {cur}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-2 rounded-full bg-ruwad-gray/40 overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-ruwad-blue'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-extrabold text-ruwad-navy/60 shrink-0">
                        {fmt(paid)} / {fmt(p.total_amount)} {cur}
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={17} className={`shrink-0 text-ruwad-navy/40 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <div className="border-t border-ruwad-gray/50 p-4 grid sm:grid-cols-2 gap-4">
                    {/* الأقساط */}
                    <div>
                      <p className="text-xs font-extrabold text-ruwad-navy mb-2 flex items-center gap-1"><CalendarClock size={13} /> جدول الأقساط</p>
                      <div className="flex flex-col gap-1.5">
                        {p.installments.sort((a, b) => a.seq - b.seq).map((i) => {
                          const late = i.due_date < new Date().toISOString().slice(0, 10)
                          return (
                            <div key={i.id} className="flex items-center justify-between text-xs bg-[#F5F6FA] rounded-lg px-3 py-2">
                              <span className="font-bold text-ruwad-navy/70">قسط {i.seq} · {new Date(i.due_date).toLocaleDateString('ar')}</span>
                              <span className={`font-extrabold ${late ? 'text-red-500' : 'text-ruwad-navy'}`}>{fmt(i.amount)} {cur}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {/* الدفعات */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-extrabold text-ruwad-navy flex items-center gap-1"><Receipt size={13} /> الدفعات ({p.records.length})</p>
                        <button onClick={() => setPaying(p)}
                          className="text-[11px] font-extrabold text-white bg-green-500 hover:bg-green-600 rounded-full px-3 py-1.5 flex items-center gap-1 transition">
                          <Banknote size={12} /> تسجيل دفعة
                        </button>
                      </div>
                      {p.records.length === 0 ? (
                        <p className="text-xs text-ruwad-navy/45 py-2">لا دفعات بعد.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {p.records.slice().sort((a, b) => b.paid_at.localeCompare(a.paid_at)).map((r) => (
                            <div key={r.id} className="flex items-center justify-between text-xs bg-green-50/60 rounded-lg px-3 py-2">
                              <span className="font-bold text-ruwad-navy/70">{new Date(r.paid_at).toLocaleDateString('ar')} · <span dir="ltr">{r.receipt_code}</span></span>
                              <span className="flex items-center gap-2">
                                <span className="font-extrabold text-green-700">{fmt(r.amount)} {cur}</span>
                                <Link href={`/org/finance/receipt/${r.id}`} target="_blank" title="الإيصال"
                                  className="text-ruwad-navy/35 hover:text-ruwad-blue"><Printer size={13} /></Link>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {creating && (
        <NewPlanModal instituteId={instituteId} plannable={plannable}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); router.refresh() }} />
      )}
      {paying && (
        <PaymentModal plan={paying}
          onClose={() => setPaying(null)}
          onSaved={() => { setPaying(null); router.refresh() }} />
      )}
    </div>
  )
}

/* ================= خطة جديدة: مبلغ + عملة + أقساط تُقسم تلقائياً وتُحرَّر ================= */

function NewPlanModal({ instituteId, plannable, onClose, onSaved }: {
  instituteId: string; plannable: Plannable[]; onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [enrollmentId, setEnrollmentId] = useState('')
  const [currency, setCurrency] = useState<'SYP' | 'USD'>('SYP')
  const [total, setTotal] = useState('')
  const [count, setCount] = useState(2)
  const [firstDue, setFirstDue] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // تقسيم متساوٍ مع ضبط الكسور في القسط الأخير، واستحقاق شهري
  const preview = useMemo(() => {
    const t = Number(total)
    if (!t || t <= 0 || count < 1) return []
    const base = Math.floor((t / count) * 100) / 100
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(firstDue + 'T12:00:00')
      d.setMonth(d.getMonth() + i)
      return { seq: i + 1, amount: i === count - 1 ? Math.round((t - base * (count - 1)) * 100) / 100 : base, due: d.toISOString().slice(0, 10) }
    })
  }, [total, count, firstDue])

  async function save() {
    if (!enrollmentId || preview.length === 0) { setError('اختر الطالب وأدخل المبلغ'); return }
    setSaving(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const { data: plan, error: e1 } = await supabase.from('payment_plans')
      .insert({ institute_id: instituteId, enrollment_id: enrollmentId, currency, total_amount: Number(total), created_by: session!.user.id })
      .select('id').single()
    if (e1 || !plan) { setSaving(false); setError('تعذّر إنشاء الخطة'); return }
    const { error: e2 } = await supabase.from('payment_installments')
      .insert(preview.map((i) => ({ plan_id: plan.id, seq: i.seq, amount: i.amount, due_date: i.due })))
    setSaving(false)
    if (e2) { setError('أُنشئت الخطة لكن تعذّر حفظ الأقساط — أعد المحاولة'); return }
    onSaved()
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full'

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-lg rounded-t-ruwad sm:rounded-ruwad max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray sticky top-0 bg-white">
          <h3 className="font-extrabold text-ruwad-navy">خطة دفع جديدة</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">الطالب والتدريب *</span>
            <select value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)} className={inputCls + ' bg-white'}>
              <option value="">— اختر —</option>
              {plannable.map((e) => <option key={e.id} value={e.id}>{e.student.full_name} — {e.course.title}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">المبلغ الإجمالي *</span>
              <input type="number" min={1} value={total} onChange={(e) => setTotal(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">العملة</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as 'SYP' | 'USD')} className={inputCls + ' bg-white'}>
                <option value="SYP">ل.س</option>
                <option value="USD">$</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">عدد الأقساط</span>
              <input type="number" min={1} max={12} value={count} onChange={(e) => setCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">استحقاق أول قسط</span>
              <input type="date" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} className={inputCls} />
            </label>
          </div>
          {preview.length > 0 && (
            <div className="bg-[#F5F6FA] rounded-ruwad-sm p-3 flex flex-col gap-1.5">
              <p className="text-[11px] font-extrabold text-ruwad-navy/60">جدول الأقساط (شهري تلقائياً):</p>
              {preview.map((i) => (
                <div key={i.seq} className="flex items-center justify-between text-xs font-bold text-ruwad-navy">
                  <span>قسط {i.seq} · {new Date(i.due).toLocaleDateString('ar')}</span>
                  <span>{i.amount.toLocaleString('ar')} {CUR[currency]}</span>
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
          <button onClick={save} disabled={saving}
            className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
            {saving && <Loader2 size={15} className="animate-spin" />} إنشاء الخطة
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================= تسجيل دفعة ================= */

function PaymentModal({ plan, onClose, onSaved }: { plan: Plan; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const remaining = Number(plan.total_amount) - planPaid(plan)
  const [amount, setAmount] = useState(String(Math.max(remaining, 0) || ''))
  const [method, setMethod] = useState<'cash' | 'transfer' | 'other'>('cash')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [receiptId, setReceiptId] = useState<string | null>(null)

  async function save() {
    const a = Number(amount)
    if (!a || a <= 0) { setError('أدخل مبلغاً صحيحاً'); return }
    setSaving(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const { data: code } = await supabase.rpc('generate_receipt_code')
    const { data: rec, error: err } = await supabase.from('payment_records')
      .insert({ plan_id: plan.id, amount: a, method, note: note.trim() || null, received_by: session!.user.id, receipt_code: code as string })
      .select('id').single()
    setSaving(false)
    if (err || !rec) { setError('تعذّر تسجيل الدفعة'); return }
    setReceiptId(rec.id)
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full'

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-sm rounded-t-ruwad sm:rounded-ruwad overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray">
          <h3 className="font-extrabold text-ruwad-navy">تسجيل دفعة</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>
        {receiptId ? (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <span className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl">✓</span>
            <p className="font-extrabold text-ruwad-navy">سُجّلت الدفعة بنجاح</p>
            <Link href={`/org/finance/receipt/${receiptId}`} target="_blank"
              className="flex items-center gap-2 bg-ruwad-blue text-white text-sm font-extrabold px-5 py-2.5 rounded-ruwad-sm hover:opacity-90 transition">
              <Printer size={15} /> فتح الإيصال للطباعة
            </Link>
            <button onClick={onSaved} className="text-xs font-bold text-ruwad-navy/50 hover:text-ruwad-navy">إغلاق</button>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            <p className="text-xs font-bold text-ruwad-navy/60 bg-[#F5F6FA] rounded-ruwad-sm px-3 py-2">
              {plan.enrollment.student.full_name} — المتبقي: <span className="font-extrabold text-ruwad-navy">{fmt(remaining)} {CUR[plan.currency]}</span>
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">المبلغ *</span>
              <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([['cash', 'نقداً'], ['transfer', 'حوالة'], ['other', 'أخرى']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setMethod(v)}
                  className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${method === v ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
                  {l}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold text-ruwad-navy">ملاحظة</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
            </label>
            {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
            <button onClick={save} disabled={saving}
              className="bg-green-500 text-white font-extrabold py-3 rounded-ruwad-sm hover:bg-green-600 disabled:opacity-60 flex items-center justify-center gap-2 transition">
              {saving && <Loader2 size={15} className="animate-spin" />} <Banknote size={16} /> قبض المبلغ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
