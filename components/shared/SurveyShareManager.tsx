'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, GraduationCap, Check, ChevronDown } from 'lucide-react'

interface Target { id: string; name: string }

/**
 * زر "مشاركة مع معهد" (لدى المدرب) أو "مشاركة مع مدرب" (لدى المعهد) لاستبيان واحد.
 * الطرف الآخر يحصل على صلاحية عرض النتائج ونسخ الاستبيان فقط، لا التعديل المباشر —
 * لتفادي أي تعارض على نفس الأسئلة/الإعدادات.
 */
export function SurveyShareManager({
  surveyId,
  targetType,
  targets,
  initialSharedIds,
}: {
  surveyId: string
  targetType: 'trainer' | 'institute'
  targets: Target[]
  initialSharedIds: string[]
}) {
  const [shared, setShared] = useState(new Set(initialSharedIds))
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function toggle(targetId: string) {
    setBusyId(targetId)
    const isShared = shared.has(targetId)
    const { data: { user } } = await supabase.auth.getUser()

    if (isShared) {
      const { error } = await supabase
        .from('survey_shares')
        .delete()
        .eq('survey_id', surveyId)
        .eq('shared_with_type', targetType)
        .eq('shared_with_id', targetId)
      if (!error) setShared((prev) => { const next = new Set(prev); next.delete(targetId); return next })
    } else {
      const { error } = await supabase
        .from('survey_shares')
        .insert({ survey_id: surveyId, shared_with_type: targetType, shared_with_id: targetId, shared_by: user!.id })
      if (!error) setShared((prev) => new Set(prev).add(targetId))
    }
    setBusyId(null)
    router.refresh()
  }

  if (targets.length === 0) return null
  const label = targetType === 'institute' ? 'مشاركة مع معهد' : 'مشاركة مع مدرب'
  const Icon = targetType === 'institute' ? Building2 : GraduationCap

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-ruwad-sm font-semibold transition border-2 ${
          shared.size > 0 ? 'bg-ruwad-lime border-ruwad-lime text-ruwad-navy' : 'bg-white border-ruwad-gray text-ruwad-navy hover:bg-ruwad-gray/20'
        }`}
      >
        {shared.size > 0 ? <Check size={18} /> : <Icon size={18} />}
        {shared.size > 0 ? `مُشارَك مع ${shared.size}` : label}
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 w-full max-w-xs bg-white rounded-ruwad-sm shadow-ruwad-lg border border-ruwad-gray/50 p-2 flex flex-col gap-0.5">
          <p className="text-xs text-ruwad-navy/50 px-2 py-1">
            {targetType === 'institute' ? 'يحصل المعهد على عرض النتائج ونسخ الاستبيان فقط:' : 'يحصل المدرب على عرض النتائج ونسخ الاستبيان فقط:'}
          </p>
          {targets.map((t) => {
            const isShared = shared.has(t.id)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                disabled={busyId === t.id}
                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-ruwad-sm hover:bg-ruwad-gray/15 transition text-right disabled:opacity-50"
              >
                <span className="text-sm text-ruwad-navy truncate">{t.name}</span>
                <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isShared ? 'bg-ruwad-blue border-ruwad-blue' : 'border-ruwad-gray'}`}>
                  {isShared && <Check size={13} className="text-white" />}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
