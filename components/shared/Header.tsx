'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './NotificationBell'
import { PushNotificationSetup } from './PushNotificationSetup'

export function Header({ title }: { title: string }) {
  const [initials, setInitials] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
        if (data?.full_name) {
          setInitials(data.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase())
        }
      })
    })
  }, [supabase])

  return (
    <header className="bg-white shadow-card px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <h1 className="text-lg md:text-xl font-bold text-ruwad-navy">{title}</h1>
      <div className="flex items-center gap-2">
        <PushNotificationSetup compact />
        <NotificationBell />
        <Link
          href="/profile"
          aria-label="الملف الشخصي"
          className="w-10 h-10 rounded-full bg-ruwad-blue text-white flex items-center justify-center text-sm font-bold hover:opacity-90 transition hover:ring-2 hover:ring-ruwad-blue/30"
        >
          {initials || '؟'}
        </Link>
      </div>
    </header>
  )
}
