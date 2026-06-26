'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap } from 'lucide-react'

export function StartChallengeSessionButton({ challengeId, hasQuestions }: { challengeId: string; hasQuestions: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleStart() {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: codeData, error: codeError } = await supabase.rpc('generate_challenge_session_code')
    if (codeError || !codeData) {
      setError('تعذّر توليد كود الجلسة'); setLoading(false); return
    }

    const { data, error: insertError } = await supabase
      .from('challenge_sessions')
      .insert({ challenge_id: challengeId, trainer_id: user.id, session_code: codeData })
      .select()
      .single()

    if (insertError || !data) {
      setError(`حدث خطأ أثناء بدء الجلسة: ${insertError?.message ?? 'غير معروف'}`)
      setLoading(false)
      return
    }

    router.push(`/challenges/${challengeId}/present?session=${data.id}`)
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {error && <p className="text-xs text-red-500 max-w-xs text-right">{error}</p>}
      <button
        onClick={handleStart}
        disabled={loading || !hasQuestions}
        title={!hasQuestions ? 'أضف سؤالاً واحداً على الأقل أولاً' : ''}
        className="bg-ruwad-navy text-white px-5 py-2.5 rounded-ruwad-sm font-bold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-40"
      >
        <Zap size={18} /> {loading ? 'جارٍ البدء...' : 'بدء تحدٍ مباشر'}
      </button>
    </div>
  )
}
