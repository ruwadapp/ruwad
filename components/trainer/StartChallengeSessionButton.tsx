'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap } from 'lucide-react'

export function StartChallengeSessionButton({ challengeId, hasQuestions }: { challengeId: string; hasQuestions: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleStart() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: codeData } = await supabase.rpc('generate_challenge_session_code')
    const { data, error } = await supabase
      .from('challenge_sessions')
      .insert({ challenge_id: challengeId, trainer_id: user.id, session_code: codeData })
      .select()
      .single()

    if (!error && data) {
      router.push(`/challenges/${challengeId}/present?session=${data.id}`)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading || !hasQuestions}
      title={!hasQuestions ? 'أضف سؤالاً واحداً على الأقل أولاً' : ''}
      className="bg-ruwad-navy text-white px-5 py-2.5 rounded-ruwad-sm font-bold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-40"
    >
      <Zap size={18} /> {loading ? 'جارٍ البدء...' : 'بدء تحدٍ مباشر'}
    </button>
  )
}
