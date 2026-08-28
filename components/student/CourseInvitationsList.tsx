'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Check, X } from 'lucide-react'

interface Invitation {
  id: string
  course_id: string
  created_at: string
  course?: { title: string } | null
  inviter?: { full_name: string } | null
}

// دعوات الالتحاق المعلّقة للطالب: قبول (تسجيل معتمد فوراً) أو رفض
export function CourseInvitationsList({ invitations }: { invitations: Invitation[] }) {
  const [items, setItems] = useState(invitations)
  const [busyId, setBusyId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  if (items.length === 0) return null

  async function respond(id: string, accept: boolean) {
    setBusyId(id)
    const { error } = await supabase.rpc('respond_course_invitation', { p_invitation_id: id, p_accept: accept })
    setBusyId(null)
    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      router.refresh()
    }
  }

  return (
    <section className="bg-ruwad-lime/20 border border-ruwad-lime rounded-ruwad p-5 flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-extrabold text-ruwad-navy text-sm">
        <Mail size={16} className="text-ruwad-blue" /> لديك {items.length === 1 ? 'دعوة' : 'دعوات'} للالتحاق بتدريب 🎓
      </h2>
      {items.map((inv) => (
        <div key={inv.id} className="bg-white rounded-ruwad-sm shadow-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ruwad-navy text-sm truncate">{inv.course?.title ?? 'تدريب'}</p>
            <p className="text-xs text-ruwad-navy/50 mt-0.5">
              دعوة من {inv.inviter?.full_name ?? 'جهة تدريبية'} · {new Date(inv.created_at).toLocaleDateString('ar')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => respond(inv.id, true)}
              disabled={busyId === inv.id}
              className="flex items-center gap-1.5 bg-ruwad-blue text-white text-xs font-bold px-4 py-2 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-50"
            >
              <Check size={13} /> {busyId === inv.id ? 'جارٍ...' : 'قبول والالتحاق'}
            </button>
            <button
              onClick={() => respond(inv.id, false)}
              disabled={busyId === inv.id}
              className="flex items-center gap-1.5 text-xs font-bold text-ruwad-navy/50 px-3 py-2 rounded-ruwad-sm hover:bg-ruwad-gray/20 transition disabled:opacity-50"
            >
              <X size={13} /> رفض
            </button>
          </div>
        </div>
      ))}
    </section>
  )
}
