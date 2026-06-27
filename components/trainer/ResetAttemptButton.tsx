'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RotateCcw } from 'lucide-react'

export function ResetAttemptButton({ submissionId, studentName }: { submissionId: string; studentName: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleReset() {
    if (!confirm(`حذف محاولة "${studentName}" والسماح له بإعادة خوض الامتحان من جديد؟`)) return
    setLoading(true)
    await supabase.from('exam_submissions').delete().eq('id', submissionId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      title="إعادة المحاولة"
      aria-label="إعادة المحاولة"
      className="text-ruwad-navy/40 hover:text-ruwad-blue hover:bg-ruwad-blue/10 p-1.5 rounded-ruwad-sm transition disabled:opacity-50"
    >
      <RotateCcw size={15} />
    </button>
  )
}
