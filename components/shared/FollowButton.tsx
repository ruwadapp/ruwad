'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, UserCheck } from 'lucide-react'

export function FollowButton({
  targetType,
  targetId,
  initialFollowing,
}: {
  targetType: 'trainer' | 'institute'
  targetId: string
  initialFollowing: boolean
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const col = targetType === 'trainer' ? 'trainer_id' : 'institute_id'

  async function toggle() {
    setLoading(true)
    if (following) {
      await supabase.from('trainer_follows').delete().eq(col, targetId)
      setFollowing(false)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('trainer_follows').insert({ student_id: user!.id, [col]: targetId })
      setFollowing(true)
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full transition disabled:opacity-50 shrink-0 ${
        following ? 'bg-white/20 text-white backdrop-blur' : 'bg-ruwad-lime text-ruwad-navy hover:opacity-90'
      }`}
    >
      {following ? <UserCheck size={16} /> : <UserPlus size={16} />} {following ? 'متابَع' : 'متابعة'}
    </button>
  )
}
