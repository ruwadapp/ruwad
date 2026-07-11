'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCheck, UserX, RotateCcw, Snowflake, Sun, KeyRound, Trash2, CalendarPlus, X } from 'lucide-react'

interface AccountRow {
  id: string
  full_name: string
  email: string
  role: string
  account_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  is_frozen: boolean
  subscription_ends_at: string | null
}

const ROLE_LABELS: Record<string, string> = {
  trainer: 'مدرب',
  student: 'طالب',
  institute_admin: 'مدير معهد',
}

export function AccountsApprovalManager({ initial }: { initial: AccountRow[] }) {
  const [rows, setRows] = useState(initial)
  const [passwordModalFor, setPasswordModalFor] = useState<AccountRow | null>(null)
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

  async function extendSubscription(id: string, currentEndsAt: string | null, days: number) {
    const base = currentEndsAt && new Date(currentEndsAt) > new Date() ? new Date(currentEndsAt) : new Date()
    base.setDate(base.getDate() + days)
    await supabase.from('profiles').update({ subscription_ends_at: base.toISOString() }).eq('id', id)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, subscription_ends_at: base.toISOString() } : r)))
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

  const pending = rows.filter((r) => r.account_status === 'pending')
  const approved = rows.filter((r) => r.account_status === 'approved')
  const rejected = rows.filter((r) => r.account_status === 'rejected')

  const sharedProps = { toggleFreeze, extendSubscription, deleteAccount, onSetPassword: setPasswordModalFor }

  return (
    <div className="flex flex-col gap-6">
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

      <Section title={`الحسابات الموافَق عليها (${approved.length})`} emptyText="لا توجد حسابات موافَق عليها بعد.">
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
    </div>
  )
}

function Section({ title, emptyText, children }: { title: string; emptyText: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children
  return (
    <div className="bg-white rounded-ruwad shadow-card p-6">
      <h2 className="text-lg font-bold text-ruwad-navy mb-4">{title}</h2>
      {!hasChildren ? <p className="text-ruwad-navy/50 text-sm py-4 text-center">{emptyText}</p> : <div className="flex flex-col gap-2">{children}</div>}
    </div>
  )
}

function Row({
  row, children, toggleFreeze, extendSubscription, deleteAccount, onSetPassword,
}: {
  row: AccountRow
  children: React.ReactNode
  toggleFreeze: (id: string, freeze: boolean) => void
  extendSubscription: (id: string, currentEndsAt: string | null, days: number) => void
  deleteAccount: (row: AccountRow) => void
  onSetPassword: (row: AccountRow) => void
}) {
  const expired = row.subscription_ends_at ? new Date(row.subscription_ends_at) < new Date() : false

  return (
    <div className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60 flex-wrap">
      <div className="w-9 h-9 rounded-full bg-ruwad-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
        {row.full_name?.charAt(0) ?? '؟'}
      </div>
      <div className="flex-1 min-w-[160px]">
        <p className="font-medium text-ruwad-navy flex items-center gap-1.5">
          {row.full_name}
          {row.is_frozen && <span className="text-[10px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full font-semibold">مجمَّد</span>}
          {expired && !row.is_frozen && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">منتهي الاشتراك</span>}
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
        <button
          onClick={() => extendSubscription(row.id, row.subscription_ends_at, 30)}
          title="تمديد الاشتراك 30 يوماً"
          className="flex items-center gap-1 text-xs font-semibold text-ruwad-navy/60 hover:bg-ruwad-gray/30 px-2.5 py-1.5 rounded-ruwad-sm transition"
        >
          <CalendarPlus size={14} /> +30 يوم
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
