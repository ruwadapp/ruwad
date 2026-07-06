'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StarRatingPicker } from './StarRating'

interface RatingFormProps {
  target: 'trainer' | 'institute'
  targetId: string
  raterRole: 'student' | 'trainer' | 'institute'
  initialScore?: number
  ineligibleMessage: string
}

export function RatingForm({ target, targetId, raterRole, initialScore = 0, ineligibleMessage }: RatingFormProps) {
  const [score, setScore] = useState(initialScore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const table = target === 'trainer' ? 'trainer_ratings' : 'institute_ratings'
  const targetCol = target === 'trainer' ? 'trainer_id' : 'institute_id'

  async function submit(newScore: number) {
    setScore(newScore)
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: upsertError } = await supabase
      .from(table)
      .upsert(
        { [targetCol]: targetId, rater_id: user!.id, rater_role: raterRole, score: newScore, updated_at: new Date().toISOString() },
        { onConflict: `${targetCol},rater_id` }
      )
    setLoading(false)
    if (upsertError) {
      setError(ineligibleMessage)
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-3">
      <p className="text-sm font-bold text-ruwad-navy">قيّم تجربتك (تقييمك لا يُظهر اسمك، ويُحتسب في المعدل العام فقط)</p>
      {error && <div className="bg-red-50 text-red-600 text-xs rounded-ruwad-sm px-3 py-2">{error}</div>}
      {success && <div className="bg-ruwad-lime/20 text-ruwad-navy text-xs rounded-ruwad-sm px-3 py-2">تم حفظ تقييمك، شكراً لك!</div>}
      <StarRatingPicker value={score} onChange={submit} />
      {loading && <p className="text-xs text-ruwad-navy/40">جارٍ الحفظ...</p>}
    </div>
  )
}

