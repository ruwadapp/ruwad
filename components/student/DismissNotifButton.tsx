'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

// إخفاء بطاقة الدعاية من الرئيسية (بوضع إشعارها كمقروء)
export function DismissNotifButton({ notifId }: { notifId: string }) {
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  return (
    <button
      onClick={async () => {
        setBusy(true)
        await supabase.from('notifications').update({ is_read: true }).eq('id', notifId)
        router.refresh()
      }}
      disabled={busy}
      aria-label="إخفاء"
      className="p-2.5 rounded-ruwad-sm text-ruwad-navy/40 hover:bg-ruwad-gray/30 transition disabled:opacity-50"
    >
      <X size={16} />
    </button>
  )
}
