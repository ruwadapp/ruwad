'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Copy, Loader2 } from 'lucide-react'

export function CloneSurveyButton({
  surveyId,
  asOwnerType,
  ownerId,
  redirectBase,
}: {
  surveyId: string
  asOwnerType: 'trainer' | 'institute'
  ownerId: string
  redirectBase: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function clone() {
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('clone_survey', {
      p_survey_id: surveyId,
      p_new_owner_type: asOwnerType,
      p_new_owner_id: ownerId,
    })
    setLoading(false)
    if (rpcError || !data) { setError('تعذّر نسخ الاستبيان'); return }
    router.push(`${redirectBase}/${data}`)
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={clone}
        disabled={loading}
        className="flex items-center gap-2 bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Copy size={18} />}
        {loading ? 'جارٍ النسخ...' : 'نسخ الاستبيان'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
