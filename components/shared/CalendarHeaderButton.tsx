'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getCachedRole, setCachedRole } from '@/lib/role-cache'
import { CalendarDays } from 'lucide-react'

// زر "التقويم" في الترويسة بجانب الدردشات والإشعارات والحساب —
// وجهته حسب دور المستخدم (مدرب/معهد/طالب)
export function CalendarHeaderButton() {
  const roleToHref = (role: string | null | undefined) =>
    role === 'institute_admin' ? '/org/calendar' : role === 'trainer' ? '/calendar' : role ? '/my-calendar' : null
  const [href, setHref] = useState<string | null>(() => roleToHref(getCachedRole()))
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user || cancelled) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (cancelled) return
      setCachedRole(profile?.role)
      setHref(roleToHref(profile?.role))
    }
    load()
    return () => { cancelled = true }
  }, [supabase])

  if (!href) return null
  return (
    <Link
      href={href}
      aria-label="التقويم"
      title="التقويم"
      className="w-10 h-10 rounded-full bg-ruwad-gray/40 text-ruwad-navy flex items-center justify-center hover:bg-ruwad-gray transition"
    >
      <CalendarDays size={20} />
    </Link>
  )
}
