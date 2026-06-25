'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCheck, UserX, UserMinus, UserPlus, Search } from 'lucide-react'

interface MemberRow {
  id: string
  user_id: string
  member_role: 'trainer' | 'student'
  status: 'pending' | 'approved' | 'rejected'
  member: { full_name: string; user_code: string } | null
}

export function InstituteMembersManager({ instituteId, initial }: { instituteId: string; initial: MemberRow[] }) {
  const [items, setItems] = useState<MemberRow[]>(initial)
  const [addCode, setAddCode] = useState('')
  const [addRole, setAddRole] = useState<'trainer' | 'student'>('trainer')
  const [addError, setAddError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  async function respond(id: string, status: 'approved' | 'rejected') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('institute_members').update({ status, responded_at: new Date().toISOString(), responded_by: user?.id }).eq('id', id)
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
  }

  async function remove(id: string) {
    if (!confirm('إزالة هذا العضو من المعهد؟')) return
    await supabase.from('institute_members').delete().eq('id', id)
    setItems((prev) => prev.filter((m) => m.id !== id))
  }

  async function addByCode(e: React.FormEvent) {
    e.preventDefault()
    if (!addCode.trim()) return
    setAdding(true)
    setAddError(null)

    const { data: matches, error: lookupError } = await supabase.rpc('lookup_user_by_code', { p_code: addCode.trim() })
    const targetUser = matches?.[0]

    if (lookupError || !targetUser) {
      setAddError('لا يوجد مستخدم بهذا المعرّف')
      setAdding(false)
      return
    }
    if (targetUser.role !== addRole) {
      setAddError(`هذا المعرّف يخص ${targetUser.role === 'trainer' ? 'مدرّب' : targetUser.role === 'student' ? 'طالب' : 'مدير معهد'} لا ${addRole === 'trainer' ? 'مدرّب' : 'طالب'}`)
      setAdding(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: insertError } = await supabase
      .from('institute_members')
      .insert({
        institute_id: instituteId, user_id: targetUser.id, member_role: addRole,
        status: 'approved', invited_by: 'admin', responded_at: new Date().toISOString(), responded_by: user?.id,
      })
      .select()
      .single()

    if (insertError) {
      setAddError('حدث خطأ — قد يكون هذا المستخدم عضواً بالفعل')
      setAdding(false)
      return
    }

    setItems((prev) => [...prev, { ...data, member: { full_name: targetUser.full_name, user_code: addCode.trim().toUpperCase() } }])
    setAddCode('')
    setAdding(false)
  }

  const pending = items.filter((m) => m.status === 'pending')
  const trainers = items.filter((m) => m.status === 'approved' && m.member_role === 'trainer')
  const students = items.filter((m) => m.status === 'approved' && m.member_role === 'student')

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-ruwad shadow-card p-6">
        <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-ruwad-blue" /> إضافة عضو مباشرة بالمعرّف
        </h2>
        <form onSubmit={addByCode} className="flex flex-wrap items-end gap-3">
          {addError && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3 w-full">{addError}</div>}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-ruwad-navy/60">النوع</label>
            <select value={addRole} onChange={(e) => setAddRole(e.target.value as 'trainer' | 'student')} className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-blue bg-white">
              <option value="trainer">مدرّب</option>
              <option value="student">طالب</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label className="text-xs text-ruwad-navy/60">المعرّف</label>
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ruwad-navy/40" />
              <input value={addCode} onChange={(e) => setAddCode(e.target.value)} placeholder="مثال: AB12CD" className="border border-ruwad-gray rounded-ruwad-sm pr-9 pl-3 py-2.5 outline-none focus:border-ruwad-blue uppercase w-full" />
            </div>
          </div>
          <button type="submit" disabled={adding} className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
            {adding ? 'جارٍ الإضافة...' : 'إضافة'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-ruwad shadow-card p-6">
        <h2 className="text-lg font-bold text-ruwad-navy mb-4">طلبات الانضمام ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-ruwad-navy/50 text-sm py-4 text-center">لا توجد طلبات جديدة.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60">
                <div className="w-9 h-9 rounded-full bg-ruwad-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {m.member?.full_name?.charAt(0) ?? '؟'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ruwad-navy truncate">{m.member?.full_name}</p>
                  <p className="text-xs text-ruwad-navy/50">{m.member_role === 'trainer' ? 'مدرّب' : 'طالب'}</p>
                </div>
                <button onClick={() => respond(m.id, 'approved')} aria-label="قبول" className="bg-ruwad-lime text-ruwad-navy p-2 rounded-ruwad-sm hover:opacity-80 transition"><UserCheck size={18} /></button>
                <button onClick={() => respond(m.id, 'rejected')} aria-label="رفض" className="bg-red-100 text-red-600 p-2 rounded-ruwad-sm hover:opacity-80 transition"><UserX size={18} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-ruwad shadow-card p-6">
        <h2 className="text-lg font-bold text-ruwad-navy mb-4">المدربون ({trainers.length})</h2>
        {trainers.length === 0 ? (
          <p className="text-ruwad-navy/50 text-sm py-4 text-center">لا يوجد مدربون بعد.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {trainers.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-ruwad-sm border border-ruwad-gray/60">
                <span className="text-ruwad-navy font-medium">{m.member?.full_name}</span>
                <button onClick={() => remove(m.id)} aria-label="إزالة" className="text-red-400 hover:bg-red-50 p-1.5 rounded-ruwad-sm transition"><UserMinus size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-ruwad shadow-card p-6">
        <h2 className="text-lg font-bold text-ruwad-navy mb-4">الطلاب ({students.length})</h2>
        {students.length === 0 ? (
          <p className="text-ruwad-navy/50 text-sm py-4 text-center">لا يوجد طلاب بعد.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {students.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-ruwad-sm border border-ruwad-gray/60">
                <span className="text-ruwad-navy font-medium">{m.member?.full_name}</span>
                <button onClick={() => remove(m.id)} aria-label="إزالة" className="text-red-400 hover:bg-red-50 p-1.5 rounded-ruwad-sm transition"><UserMinus size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
