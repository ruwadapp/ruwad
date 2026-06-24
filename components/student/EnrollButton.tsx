'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function EnrollButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleEnroll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('enrollments').insert({ student_id: user.id, course_id: courseId })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 w-full"
    >
      {loading ? 'جارٍ التسجيل...' : 'سجّل في الكورس'}
    </button>
  )
}
