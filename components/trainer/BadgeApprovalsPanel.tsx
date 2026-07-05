'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Award } from 'lucide-react'
import type { BadgeApproval } from '@/lib/types'

export function BadgeApprovalsPanel({ approvals }: { approvals: BadgeApproval[] }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [items, setItems] = useState(approvals)
  const router = useRouter()
  const supabase = createClient()

  async function handle(id: string, action: 'approve' | 'reject') {
    setBusyId(id)
    const { error } = await supabase.rpc(action === 'approve' ? 'approve_badge_request' : 'reject_badge_request', {
      p_approval_id: id,
    })
    if (!error) {
      setItems((prev) => prev.filter((a) => a.id !== id))
      router.refresh()
    }
    setBusyId(null)
  }

  if (items.length === 0) return null

  return (
    <section className="bg-white rounded-ruwad shadow-card p-6 border-2 border-ruwad-lime/40">
      <h2 className="text-lg font-bold text-ruwad-navy mb-1 flex items-center gap-2">
        <Award size={20} className="text-ruwad-navy" /> موافقات معلّقة على شارات ({items.length})
      </h2>
      <p className="text-xs text-ruwad-navy/50 mb-4">استحقّ هؤلاء الطلاب الشارات المذكورة بناءً على الشروط، وهي بانتظار موافقتك لتظهر لهم.</p>
      <div className="flex flex-col gap-2">
        {items.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-ruwad-sm bg-ruwad-lime/10 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl shrink-0">{a.badge?.icon ?? '🏅'}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ruwad-navy truncate">{a.student?.full_name ?? 'طالب'}</p>
                <p className="text-xs text-ruwad-navy/60 truncate">استحق شارة "{a.badge?.name}"</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handle(a.id, 'approve')}
                disabled={busyId === a.id}
                className="flex items-center gap-1 text-xs font-semibold bg-ruwad-blue text-white px-3 py-1.5 rounded-full hover:opacity-90 transition disabled:opacity-50"
              >
                <Check size={13} /> موافقة
              </button>
              <button
                onClick={() => handle(a.id, 'reject')}
                disabled={busyId === a.id}
                className="flex items-center gap-1 text-xs font-semibold bg-white text-red-500 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50 transition disabled:opacity-50"
              >
                <X size={13} /> رفض
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
