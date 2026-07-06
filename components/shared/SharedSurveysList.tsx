'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Copy, BarChart3, ClipboardList, Loader2 } from 'lucide-react'

interface SharedSurvey {
  id: string
  title: string
  description: string | null
  ownerName: string
}

export function SharedSurveysList({
  surveys,
  asOwnerType,
  ownerId,
  resultsHrefBase,
  cloneRedirectBase,
}: {
  surveys: SharedSurvey[]
  asOwnerType: 'trainer' | 'institute'
  ownerId: string
  resultsHrefBase: string
  cloneRedirectBase: string
}) {
  const [cloningId, setCloningId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function clone(surveyId: string) {
    setCloningId(surveyId)
    const { data, error } = await supabase.rpc('clone_survey', {
      p_survey_id: surveyId,
      p_new_owner_type: asOwnerType,
      p_new_owner_id: ownerId,
    })
    setCloningId(null)
    if (!error && data) router.push(`${cloneRedirectBase}/${data}`)
  }

  if (surveys.length === 0) return null

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3">
      <h2 className="text-lg font-bold text-ruwad-navy flex items-center gap-2">
        <ClipboardList size={20} className="text-ruwad-blue" /> استبيانات شُورِكَت معك ({surveys.length})
      </h2>
      <p className="text-xs text-ruwad-navy/50 -mt-2">يمكنك عرض نتائجها الحية، أو نسخها لتصبح استبياناً خاصاً بك بنفس الأسئلة والخصائص تماماً.</p>
      <div className="flex flex-col gap-2">
        {surveys.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 border border-ruwad-gray/60 rounded-ruwad-sm p-3.5 flex-wrap">
            <div className="min-w-0">
              <p className="font-semibold text-ruwad-navy text-sm truncate">{s.title}</p>
              <p className="text-xs text-ruwad-navy/45">من: {s.ownerName}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href={`${resultsHrefBase}/${s.id}/results`} className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-navy bg-ruwad-gray/20 hover:bg-ruwad-gray/30 px-3 py-1.5 rounded-full transition">
                <BarChart3 size={13} /> النتائج
              </a>
              <button
                onClick={() => clone(s.id)}
                disabled={cloningId === s.id}
                className="flex items-center gap-1.5 text-xs font-semibold bg-ruwad-blue text-white px-3 py-1.5 rounded-full hover:opacity-90 transition disabled:opacity-50"
              >
                {cloningId === s.id ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />} نسخ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
