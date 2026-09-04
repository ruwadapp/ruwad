'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Check, XCircle, Loader2 } from 'lucide-react'

interface Invite { id: string; institute: { id: string; name: string; logo_url: string | null } | null; created_at: string }

// دعوات الفريق: معاهد دعت هذا المدرب للانضمام إليها — يقبل أو يعتذر
export function TeamInvitations({ invites }: { invites: Invite[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  if (invites.length === 0) return null

  async function respond(id: string, accept: boolean) {
    setBusy(id)
    await supabase.rpc('respond_team_invite', { p_membership_id: id, p_accept: accept })
    setBusy(null)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-5 mb-5">
      <h2 className="text-base font-extrabold text-ruwad-navy mb-3 flex items-center gap-2">
        <Building2 size={17} className="text-ruwad-blue" /> دعوات انضمام لفِرَق معاهد ({invites.length})
      </h2>
      <div className="flex flex-col gap-2">
        {invites.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between gap-3 bg-amber-50 rounded-ruwad-sm px-3.5 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {inv.institute?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={inv.institute.logo_url} alt="" className="w-10 h-10 rounded-xl bg-white object-contain p-1 shrink-0" />
              ) : (
                <span className="w-10 h-10 rounded-xl bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center shrink-0"><Building2 size={16} /></span>
              )}
              <p className="text-sm font-extrabold text-ruwad-navy truncate">{inv.institute?.name ?? 'معهد'}</p>
            </div>
            {busy === inv.id ? (
              <Loader2 size={16} className="animate-spin text-ruwad-navy/40 shrink-0" />
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => respond(inv.id, true)} className="flex items-center gap-1 text-[11px] font-extrabold text-white bg-green-500 hover:bg-green-600 rounded-full px-3 py-1.5"><Check size={12} /> قبول</button>
                <button onClick={() => respond(inv.id, false)} className="flex items-center gap-1 text-[11px] font-extrabold text-red-500 bg-white border-2 border-red-200 hover:bg-red-50 rounded-full px-3 py-1.5"><XCircle size={12} /> اعتذار</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
