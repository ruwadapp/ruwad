'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCheck, UserX, RotateCcw } from 'lucide-react'

interface AccountRow {
  id: string
  full_name: string
  email: string
  role: string
  account_status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  trainer: 'مدرب',
  student: 'طالب',
  institute_admin: 'مدير معهد',
}

export function AccountsApprovalManager({ initial }: { initial: AccountRow[] }) {
  const [rows, setRows] = useState(initial)
  const supabase = createClient()

  async function setStatus(id: string, status: 'approved' | 'rejected' | 'pending') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('profiles')
      .update({ account_status: status, approved_at: new Date().toISOString(), approved_by: user?.id })
      .eq('id', id)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, account_status: status } : r)))
  }

  const pending = rows.filter((r) => r.account_status === 'pending')
  const approved = rows.filter((r) => r.account_status === 'approved')
  const rejected = rows.filter((r) => r.account_status === 'rejected')

  return (
    <div className="flex flex-col gap-6">
      <Section title={`بانتظار الموافقة (${pending.length})`} emptyText="لا توجد طلبات جديدة.">
        {pending.map((r) => (
          <Row key={r.id} row={r}>
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
          <Row key={r.id} row={r}>
            <button onClick={() => setStatus(r.id, 'rejected')} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-ruwad-sm transition">
              <UserX size={14} /> تجميد/رفض
            </button>
          </Row>
        ))}
      </Section>

      <Section title={`الحسابات المرفوضة (${rejected.length})`} emptyText="لا توجد حسابات مرفوضة.">
        {rejected.map((r) => (
          <Row key={r.id} row={r}>
            <button onClick={() => setStatus(r.id, 'approved')} className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-blue hover:bg-ruwad-blue/10 px-3 py-1.5 rounded-ruwad-sm transition">
              <RotateCcw size={14} /> إعادة الموافقة
            </button>
          </Row>
        ))}
      </Section>
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

function Row({ row, children }: { row: AccountRow; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60 flex-wrap">
      <div className="w-9 h-9 rounded-full bg-ruwad-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
        {row.full_name?.charAt(0) ?? '؟'}
      </div>
      <div className="flex-1 min-w-[140px]">
        <p className="font-medium text-ruwad-navy">{row.full_name}</p>
        <p className="text-xs text-ruwad-navy/50">{row.email} · {ROLE_LABELS[row.role] ?? row.role}</p>
      </div>
      <span className="text-xs text-ruwad-navy/40">{new Date(row.created_at).toLocaleDateString('ar')}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
