'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Check } from 'lucide-react'

interface ShareToggleProps {
  table: 'courses' | 'exams' | 'assignments' | 'challenges'
  id: string
  initialShared: boolean
  instituteName: string
}

/**
 * يظهر فقط للمدرب المنضم لمعهد. عند التفعيل يستطيع مدير المعهد
 * تعديل هذا العنصر بالكامل كما يفعل المدرب تماماً (عبر RLS).
 */
export function ShareToggle({ table, id, initialShared, instituteName }: ShareToggleProps) {
  const [shared, setShared] = useState(initialShared)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    const next = !shared
    const { error } = await supabase.from(table).update({ shared_with_institute: next }).eq('id', id)
    setLoading(false)
    if (!error) {
      setShared(next)
      router.refresh()
    } else {
      alert('حدث خطأ أثناء تحديث المشاركة، حاول مرة أخرى')
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-ruwad-sm font-semibold transition disabled:opacity-50 border-2 ${
        shared
          ? 'bg-ruwad-lime border-ruwad-lime text-ruwad-navy'
          : 'bg-white border-ruwad-gray text-ruwad-navy hover:bg-ruwad-gray/20'
      }`}
      title={shared ? `مشترك مع ${instituteName} — يمكنه التعديل` : `شارك مع ${instituteName} ليتمكن من التعديل`}
    >
      {shared ? <Check size={18} /> : <Building2 size={18} />}
      {loading ? 'جارٍ الحفظ...' : shared ? `مُشارك مع ${instituteName}` : 'مشاركة مع المعهد'}
    </button>
  )
}
