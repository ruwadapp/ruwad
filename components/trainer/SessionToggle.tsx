'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// مفتاح تبديل أنيق على بطاقة الجلسة: تفعيل الجلسة (فتح باب الحضور) أو إغلاقها —
// بنفس دلالات لوحة الجلسة الداخلية: التفعيل يسجّل activated_at، والإيقاف يسجّل closed_at
export function SessionToggle({ sessionId, initialActive }: { sessionId: string; initialActive: boolean }) {
  const [active, setActive] = useState(initialActive)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    const next = !active
    const patch = next
      ? { is_active: true, activated_at: new Date().toISOString(), closed_at: null }
      : { is_active: false, closed_at: new Date().toISOString() }
    const { error } = await supabase.from('attendance_sessions').update(patch).eq('id', sessionId)
    if (!error) {
      setActive(next)
      router.refresh()
    }
    setBusy(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      role="switch"
      aria-checked={active}
      aria-label={active ? 'إغلاق الجلسة' : 'تفعيل الجلسة'}
      title={active ? 'الجلسة مفتوحة — اضغط للإغلاق' : 'الجلسة مغلقة — اضغط للتفعيل'}
      className={`relative inline-flex items-center h-7 w-[52px] rounded-full transition-colors duration-300 shrink-0 disabled:opacity-60 ${
        active ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,.5)]' : 'bg-ruwad-gray'
      }`}
    >
      {/* القرص المنزلق */}
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 flex items-center justify-center text-[9px] ${
          active ? 'right-[26px]' : 'right-1'
        }`}
      >
        {busy ? '…' : active ? '✓' : ''}
      </span>
    </button>
  )
}
