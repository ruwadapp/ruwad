'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, X, Loader2, Users, Sparkles } from 'lucide-react'

/* ================================================================
   نجوم الدردشة: بطاقة إسقاط النجوم + نافذة الإرسال
   المدرب/المعهد يُسقط نجوماً، وكل طالب يلتقط نصيبه مرة واحدة
   ================================================================ */

export interface StarDropInfo {
  drop_id: string
  stars_per_student: number
  note: string | null
  total_claims: number
  mine_claimed: boolean
}

const QUICK = [5, 10, 20, 50]

/* ---------- انفجار النجوم عند الالتقاط ---------- */
function StarBurst() {
  const parts = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * 360,
    delay: `${(i % 4) * 0.05}s`,
    size: 10 + (i % 3) * 4,
  }))
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible z-10">
      {parts.map((p, i) => (
        <span key={i} className="absolute animate-star-burst" style={{ ['--burst-angle' as string]: `${p.angle}deg`, animationDelay: p.delay }}>
          <Star size={p.size} className="text-amber-400 fill-amber-300 drop-shadow" />
        </span>
      ))}
    </div>
  )
}

/* ---------- البطاقة داخل المحادثة ---------- */
export function StarDropCard({ info, mine, isManager, senderName, onClaimed }: {
  info: StarDropInfo
  /** هل الرسالة من المستخدم الحالي (لاتجاه الألوان) */
  mine: boolean
  isManager: boolean
  senderName: string
  onClaimed: (dropId: string, points: number, totalClaims: number) => void
}) {
  const supabase = createClient()
  const [claiming, setClaiming] = useState(false)
  const [burst, setBurst] = useState(false)
  const canClaim = !isManager && !info.mine_claimed

  async function claim() {
    if (!canClaim || claiming) return
    setClaiming(true)
    const { data, error } = await supabase.rpc('claim_star_drop', { p_drop_id: info.drop_id })
    setClaiming(false)
    const row = Array.isArray(data) ? data[0] : data
    if (error || !row) return
    if (row.claimed) {
      setBurst(true)
      setTimeout(() => setBurst(false), 1300)
    }
    onClaimed(info.drop_id, row.points, Number(row.total_claims))
  }

  return (
    <div className="relative my-0.5">
      {burst && <StarBurst />}
      <button
        onClick={claim}
        disabled={!canClaim || claiming}
        className={`relative w-64 max-w-full overflow-hidden rounded-2xl border-2 text-right transition
          ${info.mine_claimed
            ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-100'
            : 'border-amber-400 bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 shadow-[0_6px_24px_rgba(245,158,11,.45)]'}
          ${canClaim ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer animate-star-card-glow' : 'cursor-default'}`}
      >
        {/* لمعان يمرّ على البطاقة غير الملتقطة */}
        {!info.mine_claimed && (
          <span className="absolute inset-0 overflow-hidden pointer-events-none">
            <span className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-l from-transparent via-white/50 to-transparent animate-points-shine" />
          </span>
        )}

        <span className="relative flex items-center gap-3 p-3.5">
          <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2
            ${info.mine_claimed ? 'bg-amber-100 border-amber-300' : 'bg-white/85 border-white animate-star-float'}`}>
            <Star size={26} className="text-amber-500 fill-amber-400" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-extrabold text-amber-900/70">
              <Sparkles size={10} className="inline -mt-0.5 ml-0.5" /> نجوم من {senderName}
            </span>
            <span className="block text-sm font-extrabold text-amber-950 truncate">
              {info.note ?? 'نجوم تحفيزية'}
            </span>
            <span className="block mt-1 text-[13px] font-black text-amber-900">
              {isManager
                ? `⭐ ${info.stars_per_student} لكل طالب`
                : info.mine_claimed
                  ? `التقطتَها! +${info.stars_per_student} ⭐`
                  : claiming
                    ? 'جارٍ الالتقاط...'
                    : `اضغط لالتقاط ${info.stars_per_student} ⭐`}
            </span>
          </span>
          {claiming && <Loader2 size={16} className="animate-spin text-amber-700 shrink-0" />}
        </span>

        <span className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold border-t
          ${info.mine_claimed ? 'border-amber-200 text-amber-800/70 bg-amber-50/60' : 'border-amber-500/30 text-amber-950/70 bg-white/25'}`}>
          <Users size={11} /> التقطها {info.total_claims.toLocaleString('ar')} {info.total_claims === 1 ? 'طالب' : 'طلاب'}
          {info.mine_claimed && <span className="mr-auto text-emerald-700">✓ في رصيدك</span>}
        </span>
      </button>
      {/* اتجاه الفقاعة لا يغيّر البطاقة لكنه متاح للتخصيص لاحقاً */}
      <span className="hidden">{mine ? '' : ''}</span>
    </div>
  )
}

/* ---------- نافذة إرسال النجوم ---------- */
export function StarDropComposer({ groupId, onClose, onSent }: {
  groupId: string
  onClose: () => void
  onSent: () => void
}) {
  const supabase = createClient()
  const [stars, setStars] = useState(10)
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function sendStars() {
    if (stars < 1 || stars > 100) { setError('عدد النجوم بين 1 و 100'); return }
    setSending(true); setError('')
    const { error: err } = await supabase.rpc('create_star_drop', {
      p_group_id: groupId, p_stars: stars, p_note: note.trim() || null,
    })
    setSending(false)
    if (err) { setError('تعذّر الإرسال — تأكد من صلاحياتك'); return }
    onSent()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose} dir="rtl">
      <div className="bg-white rounded-t-ruwad sm:rounded-ruwad shadow-ruwad-lg w-full sm:max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 px-5 py-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-white/85 border-2 border-white flex items-center justify-center animate-star-float">
            <Star size={24} className="text-amber-500 fill-amber-400" />
          </span>
          <div className="flex-1">
            <p className="font-extrabold text-amber-950">إرسال نجوم تحفيزية</p>
            <p className="text-[11px] font-bold text-amber-900/70">كل طالب في المجموعة يلتقط نصيبه وتُضاف لرصيده فوراً</p>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="text-amber-900/60 hover:text-amber-950"><X size={19} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <p className="text-xs font-extrabold text-ruwad-navy mb-2">عدد النجوم لكل طالب</p>
            <div className="flex items-center gap-2">
              {QUICK.map((q) => (
                <button key={q} onClick={() => setStars(q)}
                  className={`flex-1 py-2.5 rounded-ruwad-sm border-2 text-sm font-extrabold transition
                    ${stars === q ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-hard-sm' : 'bg-white border-ruwad-gray text-ruwad-navy hover:border-amber-300'}`}>
                  {q} ⭐
                </button>
              ))}
              <input type="number" min={1} max={100} value={stars}
                onChange={(e) => setStars(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                className="w-16 text-center border-2 border-ruwad-gray focus:border-amber-400 rounded-ruwad-sm py-2.5 text-sm font-extrabold text-ruwad-navy outline-none" />
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">رسالة تحفيزية (اختياري)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="مثال: أداء رائع في تحدي اليوم! 🔥"
              className="border-2 border-ruwad-gray focus:border-amber-400 rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none" />
          </label>

          {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}

          <button onClick={sendStars} disabled={sending}
            className="bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 font-extrabold py-3 rounded-ruwad-sm border-2 border-amber-500 shadow-hard-sm hover-pop disabled:opacity-60 flex items-center justify-center gap-2">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} className="fill-amber-950" />}
            إسقاط النجوم في المجموعة
          </button>
        </div>
      </div>
    </div>
  )
}
