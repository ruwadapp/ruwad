'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BellRing, BellOff, Check } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function PushNotificationSetup({ compact = false }: { compact?: boolean }) {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(isSupported)
    if (!isSupported) return

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      setSubscribed(!!existing)
    }).catch(() => {})
  }, [])

  async function enable() {
    if (!VAPID_PUBLIC_KEY) return
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setLoading(false); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const subJson = sub.toJSON()
      await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh,
          auth_key: subJson.keys!.auth,
        },
        { onConflict: 'user_id,endpoint' }
      )

      setSubscribed(true)
    } catch (err) {
      console.error('Push subscription error:', err)
    }
    setLoading(false)
  }

  if (!supported || !VAPID_PUBLIC_KEY) return null

  if (subscribed) {
    if (compact) return null
    return (
      <div className="flex items-center gap-1.5 text-xs text-white/50 px-2">
        <Check size={13} className="text-ruwad-lime" /> الإشعارات مفعّلة
      </div>
    )
  }

  if (compact) {
    return (
      <button
        onClick={enable}
        disabled={loading}
        aria-label="تفعيل إشعارات الجهاز"
        title="تفعيل إشعارات الجهاز"
        className="relative w-10 h-10 rounded-full bg-ruwad-gray/40 flex items-center justify-center hover:bg-ruwad-gray transition disabled:opacity-50"
      >
        <BellRing size={18} className={`text-ruwad-navy ${loading ? 'animate-pulse' : ''}`} />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-ruwad-lime border-2 border-white" />
      </button>
    )
  }

  return (
    <button
      onClick={enable}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white px-2 py-1.5 rounded-ruwad-sm hover:bg-white/10 transition disabled:opacity-50"
    >
      {loading ? <BellOff size={14} className="animate-pulse" /> : <BellRing size={14} />}
      {loading ? 'جارٍ التفعيل...' : 'تفعيل إشعارات الجهاز'}
    </button>
  )
}
