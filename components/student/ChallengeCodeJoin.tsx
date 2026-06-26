'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap } from 'lucide-react'

export function ChallengeCodeJoin() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const supabase = createClient()

  function handleChange(idx: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[idx] = value
    setDigits(next)
    if (value && idx < 5) inputsRef.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputsRef.current[idx - 1]?.focus()
  }

  async function handleJoin() {
    const code = digits.join('')
    if (code.length !== 6) { setError('أدخل الكود كاملاً (6 أرقام)'); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: session, error: sessionError } = await supabase
      .from('challenge_sessions')
      .select('id, status')
      .eq('session_code', code)
      .neq('status', 'ended')
      .single()

    if (sessionError || !session) {
      setError('الكود غير صحيح أو التحدي غير نشط حالياً')
      setLoading(false)
      return
    }

    await supabase.from('challenge_session_participants').upsert(
      { session_id: session.id, student_id: user.id },
      { onConflict: 'session_id,student_id' }
    )

    router.push(`/my-challenges/live/${session.id}`)
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col items-center gap-6">
      <div className="flex items-center gap-2 text-ruwad-navy">
        <Zap size={22} className="text-ruwad-lime" />
        <h2 className="font-bold text-lg">انضم لتحدٍ مباشر</h2>
      </div>
      <p className="text-sm text-ruwad-navy/60">أدخل كود التحدي المكوّن من 6 أرقام الذي شاركه مدربك</p>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3 w-full text-center">{error}</div>}

      <div className="flex gap-2" dir="ltr">
        {digits.map((d, idx) => (
          <input
            key={idx}
            ref={(el) => { inputsRef.current[idx] = el }}
            value={d}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            maxLength={1}
            inputMode="numeric"
            className="w-11 h-14 text-center text-2xl font-bold border-2 border-ruwad-gray rounded-ruwad-sm outline-none focus:border-ruwad-lime transition"
          />
        ))}
      </div>

      <button
        onClick={handleJoin}
        disabled={loading}
        className="bg-ruwad-lime text-ruwad-navy px-8 py-3 rounded-ruwad-sm font-bold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 w-full max-w-xs"
      >
        {loading ? 'جارٍ الانضمام...' : 'انضمام'}
      </button>
    </div>
  )
}
