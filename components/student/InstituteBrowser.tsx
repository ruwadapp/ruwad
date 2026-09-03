'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, MapPin, Building2, Loader2, Check, Clock, GraduationCap } from 'lucide-react'

/* تصفح المعاهد والانضمام بضغطة واحدة — بلا حاجة لكود */

interface Institute { id: string; name: string; description: string | null; logo_url: string | null; address: string | null }
interface Membership { institute_id: string; status: 'pending' | 'approved' | 'rejected' }

export function InstituteBrowser({ institutes, memberships }: {
  institutes: Institute[]
  memberships: Membership[]
}) {
  const supabase = createClient()
  const [q, setQ] = useState('')
  const [states, setStates] = useState<Record<string, 'idle' | 'busy' | 'pending' | 'approved'>>(() => {
    const s: Record<string, 'idle' | 'busy' | 'pending' | 'approved'> = {}
    for (const m of memberships) if (m.status !== 'rejected') s[m.institute_id] = m.status === 'approved' ? 'approved' : 'pending'
    return s
  })

  const shown = useMemo(() => {
    const term = q.trim()
    const list = term
      ? institutes.filter((i) => i.name.includes(term) || (i.address ?? '').includes(term))
      : institutes
    return list.slice(0, 30)
  }, [institutes, q])

  async function join(inst: Institute) {
    if (states[inst.id] && states[inst.id] !== 'idle') return
    setStates((s) => ({ ...s, [inst.id]: 'busy' }))
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('institute_members').insert({
      institute_id: inst.id,
      user_id: session!.user.id,
      member_role: 'student',
      invited_by: 'self',
    })
    setStates((s) => ({ ...s, [inst.id]: error ? 'idle' : 'pending' }))
    if (error) alert('تعذّر إرسال الطلب — قد يكون لديك طلب سابق لهذا المعهد')
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-4 sm:p-5">
      <h2 className="text-base font-extrabold text-ruwad-navy mb-1 flex items-center gap-2">
        <GraduationCap size={18} className="text-ruwad-blue" /> انضم لمعهد
      </h2>
      <p className="text-xs text-ruwad-navy/50 mb-4">ابحث عن معهدك واضغط «انضمام» — سيصل طلبك لإدارة المعهد فوراً.</p>

      <div className="relative mb-4">
        <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ruwad-navy/35" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم المعهد أو المدينة..."
          className="w-full border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm pr-10 pl-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none" />
      </div>

      {shown.length === 0 ? (
        <p className="text-xs text-ruwad-navy/45 text-center py-6">لا نتائج — جرّب اسماً آخر أو استخدم كود المعهد أدناه.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[26rem] overflow-y-auto pl-1">
          {shown.map((inst) => {
            const st = states[inst.id] ?? 'idle'
            return (
              <div key={inst.id} className="flex items-center justify-between gap-3 bg-[#F5F6FA] rounded-ruwad-sm px-3.5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {inst.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inst.logo_url} alt="" className="w-10 h-10 rounded-xl bg-white object-contain p-1 shrink-0" />
                  ) : (
                    <span className="w-10 h-10 rounded-xl bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center shrink-0"><Building2 size={18} /></span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-ruwad-navy truncate">{inst.name}</p>
                    {inst.address && (
                      <p className="text-[11px] font-bold text-ruwad-navy/45 flex items-center gap-1 truncate"><MapPin size={10} className="shrink-0" /> {inst.address}</p>
                    )}
                  </div>
                </div>
                {st === 'approved' ? (
                  <span className="shrink-0 flex items-center gap-1 text-[11px] font-extrabold text-green-600 bg-green-50 rounded-full px-3 py-1.5"><Check size={12} /> عضو</span>
                ) : st === 'pending' ? (
                  <span className="shrink-0 flex items-center gap-1 text-[11px] font-extrabold text-amber-600 bg-amber-50 rounded-full px-3 py-1.5"><Clock size={12} /> بانتظار الموافقة</span>
                ) : (
                  <button onClick={() => join(inst)} disabled={st === 'busy'}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-extrabold text-white bg-ruwad-blue hover:opacity-90 rounded-full px-4 py-2 transition disabled:opacity-60">
                    {st === 'busy' ? <Loader2 size={12} className="animate-spin" /> : null} انضمام
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
