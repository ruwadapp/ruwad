'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle } from 'lucide-react'

// زر "الدردشات" في الترويسة بجانب الحساب والإشعارات — يحدّد وجهته حسب دور المستخدم
// ويظهر نقطة حمراء إن وُجدت مجموعة فيها رسائل غير مقروءة (وغير مكتومة)
export function ChatHeaderButton() {
  const [href, setHref] = useState<string | null>(null)
  const [hasUnread, setHasUnread] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (cancelled) return
      const base = profile?.role === 'institute_admin' ? '/org/groups' : profile?.role === 'trainer' ? '/groups' : '/my-groups'
      setHref(base)

      const { data: memberships } = await supabase
        .from('chat_members')
        .select('group_id, muted, last_read_at')
        .eq('user_id', user.id)
        .eq('muted', false)
      if (!memberships || memberships.length === 0 || cancelled) return

      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('group_id, created_at')
        .in('group_id', memberships.map((m) => m.group_id))
        .order('created_at', { ascending: false })
        .limit(500)
      if (cancelled) return
      const lastByGroup = new Map<string, string>()
      for (const m of msgs ?? []) if (!lastByGroup.has(m.group_id)) lastByGroup.set(m.group_id, m.created_at)
      const unread = memberships.some((m) => {
        const last = lastByGroup.get(m.group_id)
        return last && new Date(last) > new Date(m.last_read_at)
      })
      setHasUnread(unread)
    }
    load()

    // تحديث لحظي بسيط: أي رسالة جديدة تُشعل النقطة الحمراء فوراً
    let channel: ReturnType<typeof supabase.channel> | null = null
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || cancelled) return
      supabase.realtime.setAuth(session.access_token)
      channel = supabase
        .channel(`chat-badge:${session.user.id}:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => setHasUnread(true))
        .subscribe()
    })

    return () => { cancelled = true; if (channel) supabase.removeChannel(channel) }
  }, [supabase])

  if (!href) return null

  return (
    <Link
      href={href}
      aria-label="الدردشات"
      className="relative w-10 h-10 rounded-full bg-ruwad-gray/40 text-ruwad-navy flex items-center justify-center hover:bg-ruwad-gray transition"
    >
      <MessageCircle size={20} />
      {hasUnread && <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
    </Link>
  )
}
