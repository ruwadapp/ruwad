'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock } from 'lucide-react'

export function EnrollButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRequest() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('enrollments').insert({ student_id: user.id, course_id: courseId })
    setSent(true)
    router.refresh()
    setLoading(false)
  }

  if (sent) {
    return (
      <span className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ruwad-navy/60 bg-ruwad-gray/30 rounded-ruwad-sm py-2 w-full">
        <Clock size={15} /> طلبك قيد المراجعة
      </span>
    )
  }

  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      className="bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 w-full"
    >
      {loading ? 'جارٍ الإرسال...' : 'طلب الالتحاق بالكورس'}
    </button>
  )
}
