'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'

export function PostLikeButton({ postId, initialLiked, initialCount }: { postId: string; initialLiked: boolean; initialCount: number }) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)
  const supabase = createClient()

  async function toggle() {
    if (busy) return
    setBusy(true)
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => c + (nextLiked ? 1 : -1))

    const { data: { user } } = await supabase.auth.getUser()
    if (nextLiked) {
      const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: user!.id })
      if (error) { setLiked(false); setCount((c) => c - 1) }
    } else {
      const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user!.id)
      if (error) { setLiked(true); setCount((c) => c + 1) }
    }
    setBusy(false)
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full transition ${
        liked ? 'text-red-500' : 'text-ruwad-navy/50 hover:text-red-400'
      }`}
    >
      <Heart size={17} className={liked ? 'fill-red-500' : ''} />
      {count > 0 && count}
    </button>
  )
}
