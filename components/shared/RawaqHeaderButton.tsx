'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Rss } from 'lucide-react'

// زر "الرواق" المميز في الترويسة — بتدرّج العلامة وحلقة ليمونية نابضة
// الطالب → الرواق، المدرب → منشوراته، المعهد → منشوراته
export function RawaqHeaderButton() {
  const [href, setHref] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user || cancelled) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (cancelled) return
      setHref(
        profile?.role === 'institute_admin' ? '/org/posts'
        : profile?.role === 'trainer' ? '/posts'
        : '/rawaq',
      )
    }
    load()
    return () => { cancelled = true }
  }, [supabase])

  if (!href) return null
  return (
    <Link
      href={href}
      aria-label="الرواق"
      title="الرواق"
      className="relative w-10 h-10 rounded-full bg-gradient-to-br from-ruwad-blue to-[#33A4FA] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(58,78,251,.45)] ring-2 ring-ruwad-lime hover:scale-105 active:scale-95 transition"
    >
      <Rss size={19} />
      <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-ruwad-lime border border-white animate-pulse" />
    </Link>
  )
}
