'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PostCardType } from '@/lib/types'
import { Send, BookOpen, FileText, FileCheck, Trophy, ClipboardList, X } from 'lucide-react'

interface EntityOption { id: string; title: string }

const CARD_TYPES: { type: PostCardType; label: string; icon: typeof BookOpen }[] = [
  { type: 'course', label: 'كورس', icon: BookOpen },
  { type: 'exam', label: 'امتحان', icon: FileText },
  { type: 'assignment', label: 'واجب', icon: FileCheck },
  { type: 'challenge', label: 'تحدٍ', icon: Trophy },
  { type: 'survey', label: 'استبيان', icon: ClipboardList },
]

export function PostComposer({
  courses,
  exams,
  assignments,
  challenges,
  surveys,
  instituteId,
}: {
  courses: EntityOption[]
  exams: EntityOption[]
  assignments: EntityOption[]
  challenges: EntityOption[]
  surveys: EntityOption[]
  instituteId?: string
}) {
  const [content, setContent] = useState('')
  const [cardType, setCardType] = useState<PostCardType | null>(null)
  const [cardRefId, setCardRefId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const optionsByType: Record<PostCardType, EntityOption[]> = {
    course: courses, exam: exams, assignment: assignments, challenge: challenges, survey: surveys,
  }

  function pickType(type: PostCardType) {
    if (cardType === type) { setCardType(null); setCardRefId(''); return }
    setCardType(type)
    setCardRefId('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) { setError('اكتب نص المنشور أولاً'); return }
    if (cardType && !cardRefId) { setError('اختر العنصر المراد إرفاقه'); return }

    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase.from('trainer_posts').insert(
      instituteId
        ? { institute_id: instituteId, content: content.trim(), card_type: cardType, card_ref_id: cardType ? cardRefId : null }
        : { trainer_id: (await supabase.auth.getUser()).data.user!.id, content: content.trim(), card_type: cardType, card_ref_id: cardType ? cardRefId : null }
    )

    if (insertError) { setError('حدث خطأ أثناء نشر المنشور'); setLoading(false); return }

    setContent('')
    setCardType(null)
    setCardRefId('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-3">
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="اكتب تحديثاً لمتابعيك..."
        className="border border-ruwad-gray rounded-ruwad-sm px-4 py-3 outline-none focus:border-ruwad-blue transition resize-none"
      />

      <div className="flex items-center gap-2 flex-wrap">
        {CARD_TYPES.map((c) => {
          const Icon = c.icon
          const active = cardType === c.type
          const disabled = optionsByType[c.type].length === 0
          return (
            <button
              key={c.type}
              type="button"
              disabled={disabled}
              onClick={() => pickType(c.type)}
              title={disabled ? `لا يوجد ${c.label} لديك بعد` : undefined}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition disabled:opacity-40 ${
                active ? 'bg-ruwad-blue text-white border-ruwad-blue' : 'bg-white text-ruwad-navy border-ruwad-gray hover:border-ruwad-blue/40'
              }`}
            >
              <Icon size={13} /> {c.label}
            </button>
          )
        })}
      </div>

      {cardType && (
        <div className="flex items-center gap-2 bg-ruwad-blue/5 rounded-ruwad-sm p-3">
          <select
            value={cardRefId}
            onChange={(e) => setCardRefId(e.target.value)}
            className="flex-1 border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue"
          >
            <option value="">اختر {CARD_TYPES.find((c) => c.type === cardType)?.label}...</option>
            {optionsByType[cardType].map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
          <button type="button" onClick={() => { setCardType(null); setCardRefId('') }} aria-label="إزالة البطاقة" className="text-ruwad-navy/50 hover:text-red-500 transition">
            <X size={16} />
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="self-end flex items-center gap-2 bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
      >
        <Send size={15} /> {loading ? 'جارٍ النشر...' : 'نشر'}
      </button>
    </form>
  )
}
