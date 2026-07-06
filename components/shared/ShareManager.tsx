'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Check, ChevronDown } from 'lucide-react'
import type { ShareResourceType, TrainerInstitute } from '@/lib/utils/getTrainerInstitutes'

interface ShareManagerProps {
  resourceType: ShareResourceType
  resourceId: string
  institutes: TrainerInstitute[]
  initialSharedInstituteIds: string[]
}

/**
 * زر "مشاركة مع المعهد" يفتح قائمة بكل معاهد المدرب المعتمدة، مع خانة اختيار لكل معهد.
 * يمكن مشاركة العنصر مع معهد أو أكثر، وإلغاء المشاركة من معهد واحد مع إبقائها مع البقية.
 */
export function ShareManager({ resourceType, resourceId, institutes, initialSharedInstituteIds }: ShareManagerProps) {
  const [shared, setShared] = useState(new Set(initialSharedInstituteIds))
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

  async function toggleInstitute(instituteId: string) {
    setBusyId(instituteId)
    const isShared = shared.has(instituteId)
    const { data: { user } } = await supabase.auth.getUser()

    if (isShared) {
      const { error } = await supabase
        .from('resource_institute_shares')
        .delete()
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .eq('institute_id', instituteId)
      if (!error) setShared((prev) => { const next = new Set(prev); next.delete(instituteId); return next })
    } else {
      const { error } = await supabase
        .from('resource_institute_shares')
        .insert({ resource_type: resourceType, resource_id: resourceId, institute_id: instituteId, trainer_id: user!.id })
      if (!error) setShared((prev) => new Set(prev).add(instituteId))
    }
    setBusyId(null)
    router.refresh()
  }

  if (institutes.length === 0) return null

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-ruwad-sm font-semibold transition border-2 ${
          shared.size > 0
            ? 'bg-ruwad-lime border-ruwad-lime text-ruwad-navy'
            : 'bg-white border-ruwad-gray text-ruwad-navy hover:bg-ruwad-gray/20'
        }`}
      >
        {shared.size > 0 ? <Check size={18} /> : <Building2 size={18} />}
        {shared.size > 0 ? `مُشارَك مع ${shared.size} ${shared.size === 1 ? 'معهد' : 'معاهد'}` : 'مشاركة مع المعهد'}
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 w-full max-w-xs bg-white rounded-ruwad-sm shadow-ruwad-lg border border-ruwad-gray/50 p-2 flex flex-col gap-0.5">
          <p className="text-xs text-ruwad-navy/50 px-2 py-1">اختر معهداً أو أكثر لمشاركة هذا العنصر معه:</p>
          {institutes.map((inst) => {
            const isShared = shared.has(inst.id)
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => toggleInstitute(inst.id)}
                disabled={busyId === inst.id}
                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-ruwad-sm hover:bg-ruwad-gray/15 transition text-right disabled:opacity-50"
              >
                <span className="text-sm text-ruwad-navy truncate">{inst.name}</span>
                <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  isShared ? 'bg-ruwad-blue border-ruwad-blue' : 'border-ruwad-gray'
                }`}>
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
