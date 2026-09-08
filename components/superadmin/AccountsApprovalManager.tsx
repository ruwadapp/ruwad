'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  UserCheck, UserX, RotateCcw, Snowflake, Sun, KeyRound, Trash2, CalendarPlus,
  X, Search, Tag, Loader2,
} from 'lucide-react'

interface AccountRow {
  id: string
  full_name: string
  email: string
  role: string
  account_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  is_frozen: boolean
  subscription_ends_at: string | null
  plan_name: string | null
  plan_price: number | null
  billing_cycle: 'monthly' | 'yearly' | null
}

const ROLE_LABELS: Record<string, string> = {
  trainer: 'مدرب',
  student: 'طالب',
  institute_admin: 'مدير معهد',
}

// الخطط تأتي من جدول platform_plans (تُدار من صفحة "الخطط والأسعار")
export type PlanOption = { name: string; monthly_price: number; yearly_price: number }

export function AccountsApprovalManager({ initial, plans }: { initial: AccountRow[]; plans: PlanOption[] }) {
  const [rows, setRows] = useState(initial)
  const [passwordModalFor, setPasswordModalFor] = useState<AccountRow | null>(null)
  const [planModalFor, setPlanModalFor] = useState<AccountRow | null>(null)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'trainer' | 'institute_admin' | 'student'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'expiring' | 'expired' | 'frozen'>('all')
  const supabase = createClient()

  async function setStatus(id: string, status: 'approved' | 'rejected' | 'pending') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('profiles')
      .update({ account_status: status, approved_at: new Date().toISOString(), approved_by: user?.id })
      .eq('id', id)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, account_status: status } : r)))
  }

  async function toggleFreeze(id: string, freeze: boolean) {
    await supabase.from('profiles').update({ is_frozen: freeze }).eq('id', id)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_frozen: freeze } : r)))
  }

  async function extendSubscription(row: AccountRow) {
    const days = row.billing_cycle === 'yearly' ? 365 : 30
    const base = row.subscription_ends_at && new Date(row.subscription_ends_at) > new Date() ? new Date(row.subscription_ends_at) : new Date()
    base.setDate(base.getDate() + days)
    await supabase.from('profiles').update({ subscription_ends_at: base.toISOString() }).eq('id', row.id)
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, subscription_ends_at: base.toISOString() } : r)))
  }

  async function savePlan(id: string, plan_name: string, plan_price: number, billing_cycle: 'monthly' | 'yearly') {
    await supabase.from('profiles').update({ plan_name, plan_price, billing_cycle }).eq('id', id)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, plan_name, plan_price, billing_cycle } : r)))
  }

  async function deleteAccount(row: AccountRow) {
    if (!confirm(`هل أنت متأكد من حذف حساب "${row.full_name}" نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.`)) return
    const res = await fetch('/api/admin/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', userId: row.id }),
    })
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== row.id))
    } else {
      const { error } = await res.json()
      alert(error ?? 'تعذّر حذف الحساب')
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const now = Date.now()
    return rows.filter((r) => {
      if (term && !r.full_name?.toLowerCase().includes(term) && !r.email?.toLowerCase().includes(term)) return false
      if (roleFilter !== 'all' && r.role !== roleFilter) return false
      if (statusFilter === 'frozen' && !r.is_frozen) return false
      if (statusFilter === 'expired') {
        if (!r.subscription_ends_at || new Date(r.subscription_ends_at).getTime() >= now) return false
      }
      if (statusFilter === 'expiring') {
        if (!r.subscription_ends_at) return false
        const diff = new Date(r.subscription_ends_at).getTime() - now
        if (diff < 0 || diff > 7 * 86400_000) return false
      }
      return true
    })
  }, [rows, q, roleFilter, statusFilter])

  const pending = filtered.filter((r) => r.account_status === 'pending')
  const approved = filtered.filter((r) => r.account_status === 'approved')
  const rejected = filtered.filter((r) => r.account_status === 'rejected')

  const sharedProps = { toggleFreeze, extendSubscription, deleteAccount, onSetPassword: setPasswordModalFor, onSetPlan: setPlanModalFor }

  return (
    <div className="flex flex-col gap-5">
      {/* بحث وفلترة */}
      <div className="bg-white rounded-ruwad shadow-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ruwad-navy/35" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو البريد..."
            className="w-full border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm pr-10 pl-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {([['all', 'كل الأدوار'], ['trainer', 'مدربون'], ['institute_admin', 'معاهد'], ['student', 'طلاب']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setRoleFilter(v)}
              className={`shrink-0 text-xs font-extrabold px-3 py-2 rounded-full border-2 transition ${roleFilter === v ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {([['all', 'الكل'], ['expiring', 'قارب الانتهاء'], ['expired', 'منتهي'], ['frozen', 'مجمَّد']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`shrink-0 text-xs font-extrabold px-3 py-2 rounded-full border-2 transition ${statusFilter === v ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <Section title={`بانتظار الموافقة (${pending.length})`} emptyText="لا توجد طلبات جديدة.">
        {pending.map((r) => (
          <Row key={r.id} row={r} {...sharedProps}>
            <button onClick={() => setStatus(r.id, 'approved')} className="bg-ruwad-lime text-ruwad-navy p-2 rounded-ruwad-sm hover:opacity-80 transition" aria-label="موافقة">
              <UserCheck size={18} />
            </button>
            <button onClick={() => setStatus(r.id, 'rejected')} className="bg-red-100 text-red-600 p-2 rounded-ruwad-sm hover:opacity-80 transition" aria-label="رفض">
              <UserX size={18} />
            </button>
          </Row>
        ))}
      </Section>

      <Section title={`الحسابات الموافَق عليها (${approved.length})`} emptyText="لا توجد حسابات مطابقة.">
        {approved.map((r) => (
          <Row key={r.id} row={r} {...sharedProps}>
            <button onClick={() => setStatus(r.id, 'rejected')} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-ruwad-sm transition">
              <UserX size={14} /> رفض
            </button>
          </Row>
        ))}
      </Section>

      <Section title={`الحسابات المرفوضة (${rejected.length})`} emptyText="لا توجد حسابات مرفوضة.">
        {rejected.map((r) => (
          <Row key={r.id} row={r} {...sharedProps}>
            <button onClick={() => setStatus(r.id, 'approved')} className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-blue hover:bg-ruwad-blue/10 px-3 py-1.5 rounded-ruwad-sm transition">
              <RotateCcw size={14} /> إعادة الموافقة
            </button>
          </Row>
        ))}
      </Section>

      {passwordModalFor && (
        <SetPasswordModal row={passwordModalFor} onClose={() => setPasswordModalFor(null)} />
      )}
      {planModalFor && (
        <PlanModal row={planModalFor} plans={plans} onClose={() => setPlanModalFor(null)} onSave={savePlan} />
      )}
    </div>
  )
}

function Section({ title, emptyText, children }: { title: string; emptyText: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children
  return (
    <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-6">
      <h2 className="text-lg font-bold text-ruwad-navy mb-4">{title}</h2>
      {!hasChildren ? <p className="text-ruwad-navy/50 text-sm py-4 text-center">{emptyText}</p> : <div className="flex flex-col gap-2">{children}</div>}
    </div>
  )
}

function Row({
  row, children, toggleFreeze, extendSubscription, deleteAccount, onSetPassword, onSetPlan,
}: {
  row: AccountRow
  children: React.ReactNode
  toggleFreeze: (id: string, freeze: boolean) => void
  extendSubscription: (row: AccountRow) => void
  deleteAccount: (row: AccountRow) => void
  onSetPassword: (row: AccountRow) => void
  onSetPlan: (row: AccountRow) => void
}) {
  const expired = row.subscription_ends_at ? new Date(row.subscription_ends_at) < new Date() : false
  const expiringSoon = !expired && row.subscription_ends_at
    ? new Date(row.subscription_ends_at).getTime() - Date.now() < 7 * 86400_000 : false

  return (
    <div className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60 flex-wrap">
      <div className="w-9 h-9 rounded-full bg-ruwad-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
        {row.full_name?.charAt(0) ?? '؟'}
      </div>
      <div className="flex-1 min-w-[160px]">
        <p className="font-medium text-ruwad-navy flex items-center gap-1.5 flex-wrap">
          {row.full_name}
          {row.is_frozen && <span className="text-[10px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full font-semibold">مجمَّد</span>}
          {expired && !row.is_frozen && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">منتهي</span>}
          {expiringSoon && !row.is_frozen && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">قارب الانتهاء</span>}
          {row.plan_name && (
            <span className="text-[10px] bg-ruwad-blue/10 text-ruwad-blue px-1.5 py-0.5 rounded-full font-semibold">
              {row.plan_name} · ${row.plan_price}{row.billing_cycle === 'yearly' ? '/سنة' : '/شهر'}
            </span>
          )}
        </p>
        <p className="text-xs text-ruwad-navy/50">{row.email} · {ROLE_LABELS[row.role] ?? row.role}</p>
        {row.subscription_ends_at && (
          <p className="text-[11px] text-ruwad-navy/40 mt-0.5">
            الاشتراك حتى {new Date(row.subscription_ends_at).toLocaleDateString('ar')}
          </p>
        )}
      </div>
      <span className="text-xs text-ruwad-navy/40">{new Date(row.created_at).toLocaleDateString('ar')}</span>

      <div className="flex items-center gap-1.5 flex-wrap">
        {children}
        {row.role !== 'student' && (
          <button
            onClick={() => onSetPlan(row)}
            title="تعيين خطة"
            className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:bg-violet-50 px-2.5 py-1.5 rounded-ruwad-sm transition"
          >
            <Tag size={14} /> {row.plan_name ? 'تعديل الخطة' : 'تعيين خطة'}
          </button>
        )}
        <button
          onClick={() => extendSubscription(row)}
          title={`تمديد الاشتراك ${row.billing_cycle === 'yearly' ? 'سنة' : 'شهراً'}`}
          className="flex items-center gap-1 text-xs font-semibold text-ruwad-navy/60 hover:bg-ruwad-gray/30 px-2.5 py-1.5 rounded-ruwad-sm transition"
        >
          <CalendarPlus size={14} /> تمديد
        </button>
        <button
          onClick={() => toggleFreeze(row.id, !row.is_frozen)}
          title={row.is_frozen ? 'إلغاء التجميد' : 'تجميد الحساب'}
          className="text-sky-600 hover:bg-sky-50 p-1.5 rounded-ruwad-sm transition"
        >
          {row.is_frozen ? <Sun size={16} /> : <Snowflake size={16} />}
        </button>
        <button
          onClick={() => onSetPassword(row)}
          title="تعيين كلمة مرور جديدة"
          className="text-ruwad-navy/60 hover:bg-ruwad-gray/30 p-1.5 rounded-ruwad-sm transition"
        >
          <KeyRound size={16} />
        </button>
        <button
          onClick={() => deleteAccount(row)}
          title="حذف الحساب نهائياً"
          className="text-red-500 hover:bg-red-50 p-1.5 rounded-ruwad-sm transition"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

/* ================= تعيين خطة الحساب ================= */

function PlanModal({ row, plans, onClose, onSave }: {
  row: AccountRow
  plans: PlanOption[]
  onClose: () => void
  onSave: (id: string, plan_name: string, plan_price: number, billing_cycle: 'monthly' | 'yearly') => Promise<void>
}) {
  const [selected, setSelected] = useState(row.plan_name ?? plans[0]?.name ?? 'مخصّص')
  const [customPrice, setCustomPrice] = useState(String(row.plan_price ?? ''))
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>(row.billing_cycle ?? 'monthly')
  const [saving, setSaving] = useState(false)
  const official = plans.find((p) => p.name === selected)
  const isCustom = selected === 'مخصّص' || !official
  const price = isCustom
    ? Number(customPrice) || 0
    : Number(cycle === 'yearly' ? official.yearly_price : official.monthly_price) || 0

  async function save() {
    if (!price) return
    setSaving(true)
    await onSave(row.id, selected, price, cycle)
    setSaving(false)
    onClose()
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-sm rounded-t-ruwad sm:rounded-ruwad max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray">
          <h3 className="font-extrabold text-ruwad-navy">تعيين خطة — {row.full_name}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={inputCls}>
            {plans.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            <option value="مخصّص">مخصّص (سعر يدوي)</option>
          </select>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setCycle('monthly')} className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${cycle === 'monthly' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>شهري</button>
            <button onClick={() => setCycle('yearly')} className={`py-2.5 rounded-ruwad-sm text-sm font-extrabold border-2 transition ${cycle === 'yearly' ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>سنوي</button>
          </div>

          {isCustom ? (
            <input type="number" min={0} value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="السعر بالدولار" className={inputCls} />
          ) : (
            <p className="text-sm font-extrabold text-ruwad-navy bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-2.5">السعر: ${price} / {cycle === 'yearly' ? 'سنة' : 'شهر'}</p>
          )}

          <button onClick={save} disabled={saving || !price}
            className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
            {saving && <Loader2 size={15} className="animate-spin" />} حفظ الخطة
          </button>
        </div>
      </div>
    </div>
  )
}

function SetPasswordModal({ row, onClose }: { row: AccountRow; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let pass = ''
    for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
    setPassword(pass)
  }

  async function submit() {
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_password', userId: row.id, newPassword: password }),
    })
    setLoading(false)
    if (res.ok) { setDone(true) } else {
      const { error: msg } = await res.json()
      setError(msg ?? 'حدث خطأ')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-ruwad shadow-ruwad-lg p-6 max-w-sm w-full flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ruwad-navy">تعيين كلمة مرور جديدة</h3>
          <button onClick={onClose}><X size={18} className="text-ruwad-navy/40" /></button>
        </div>
        <p className="text-xs text-ruwad-navy/50">لـ {row.full_name} ({row.email})</p>

        {done ? (
          <div className="bg-ruwad-lime/20 text-ruwad-navy text-sm rounded-ruwad-sm p-4 flex flex-col gap-2">
            <p className="font-semibold">تم تعيين كلمة المرور بنجاح.</p>
            <p>كلمة المرور الجديدة: <span className="font-mono font-bold" dir="ltr">{password}</span></p>
            <p className="text-xs text-ruwad-navy/60">أرسلها للمستخدم يدوياً — لن تظهر مرة أخرى بعد إغلاق هذه النافذة.</p>
            <button onClick={onClose} className="bg-ruwad-blue text-white rounded-ruwad-sm py-2 font-semibold mt-1">إغلاق</button>
          </div>
        ) : (
          <>
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-3 py-2">{error}</div>}
            <div className="flex gap-2">
              <input
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة"
                className="flex-1 border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-blue transition font-mono"
              />
              <button onClick={generatePassword} type="button" className="text-xs font-semibold text-ruwad-blue px-3 rounded-ruwad-sm border border-ruwad-gray hover:bg-ruwad-gray/20 transition shrink-0">
                توليد
              </button>
            </div>
            <button
              onClick={submit}
              disabled={loading || !password}
              className="bg-ruwad-blue text-white rounded-ruwad-sm py-2.5 font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'جارٍ الحفظ...' : 'تعيين كلمة المرور'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
