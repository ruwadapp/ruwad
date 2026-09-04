'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Check, XCircle, Loader2 } from 'lucide-react'

interface Req { id: string; full_name: string; avatar_url: string | null }

// طلبات انضمام عامة للمعهد (لا لكورس محدد) — يرسلها الطالب من صفحة "معهدي"
export function GeneralJoinRequests({ requests }: { requests: Req[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  if (requests.length === 0) return null

  async function respond(id: string, approve: boolean) {
    setBusy(id)
    await supabase.from('institute_members').update({
      status: approve ? 'approved' : 'rejected', responded_at: new Date().toISOString(),
    }).eq('id', id)
    setBusy(null)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-4">
      <p className="text-sm font-extrabold text-ruwad-navy mb-3 flex items-center gap-1.5">
        <UserPlus size={15} className="text-ruwad-blue" /> طلبات انضمام عامة للمعهد ({requests.length})
      </p>
      <div className="flex flex-col gap-2">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 bg-amber-50 rounded-ruwad-sm px-3.5 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {r.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-9 h-9 rounded-full bg-ruwad-gradient text-white font-black flex items-center justify-center shrink-0 text-sm">{r.full_name.charAt(0)}</span>
              )}
              <span className="text-sm font-extrabold text-ruwad-navy truncate">{r.full_name}</span>
            </div>
            {busy === r.id ? (
              <Loader2 size={16} className="animate-spin text-ruwad-navy/40 shrink-0" />
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => respond(r.id, true)} className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600"><Check size={14} /></button>
                <button onClick={() => respond(r.id, false)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"><XCircle size={14} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
