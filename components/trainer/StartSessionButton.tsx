'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MonitorPlay } from 'lucide-react'

export function StartSessionButton({ presentationId, hasSlides }: { presentationId: string; hasSlides: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleStart() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: codeData } = await supabase.rpc('generate_presentation_code')
    const { data, error } = await supabase
      .from('presentation_sessions')
      .insert({ presentation_id: presentationId, trainer_id: user.id, session_code: codeData })
      .select()
      .single()

    if (!error && data) {
      router.push(`/presentations/${presentationId}/present?session=${data.id}`)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading || !hasSlides}
      title={!hasSlides ? 'أضف شريحة واحدة على الأقل أولاً' : ''}
      className="bg-ruwad-navy text-white px-5 py-2.5 rounded-ruwad-sm font-bold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-40"
    >
      <MonitorPlay size={18} /> {loading ? 'جارٍ البدء...' : 'بدء جلسة مباشرة'}
    </button>
  )
}
