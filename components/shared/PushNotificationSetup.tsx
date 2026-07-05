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

export function PushNotificationSetup({ compact = false, variant = 'dark' }: { compact?: boolean; variant?: 'dark' | 'light' }) {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [denied, setDenied] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function saveSubscription(sub: PushSubscription) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const subJson = sub.toJSON()
    // نحذف أي اشتراكات سابقة لهذا المستخدم على هذا الجهاز قبل تسجيل الاشتراك الجديد
    // لتجنّب تراكم نقاط انتهاء صلاحية (endpoints) ميتة تُفشل الإرسال لاحقاً
    await supabase.from('push_subscriptions').delete().eq('user_id', user.id).neq('endpoint', subJson.endpoint!)
    await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint: subJson.endpoint!,
        p256dh: subJson.keys!.p256dh,
        auth_key: subJson.keys!.auth,
      },
      { onConflict: 'user_id,endpoint' }
    )
  }

  useEffect(() => {
    const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(isSupported)
    if (!isSupported) return

    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      setDenied(true)
      return
    }

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      if (existing && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        // الاشتراك المخزّن محلياً قد يكون منتهي الصلاحية على مستوى خدمة الإشعارات (FCM/APNs)
        // دون أن يعرف المتصفح بذلك — فنجدّده بصمت في كل تحميل صفحة لضمان بقاء نقطة الاتصال صالحة
        try {
          await existing.unsubscribe()
          const fresh = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          })
          await saveSubscription(fresh)
          setSubscribed(true)
        } catch (err) {
          console.error('Push renewal error:', err)
          setSubscribed(true) // نُبقي الحالة كمفعّلة بصرياً حتى لا نُحرج المستخدم بطلب إذن جديد لغير سبب واضح
        }
      } else {
        setSubscribed(!!existing)
      }
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function enable() {
    if (!VAPID_PUBLIC_KEY) return
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setDenied(permission === 'denied')
        setLoading(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await saveSubscription(sub)
      setDenied(false)
      setSubscribed(true)
    } catch (err) {
      console.error('Push subscription error:', err)
    }
    setLoading(false)
  }

  if (!supported || !VAPID_PUBLIC_KEY) return null

  if (denied && !compact) {
    return (
      <p className={`text-xs ${variant === 'light' ? 'text-red-500' : 'text-white/50'} max-w-[220px] leading-relaxed`}>
        الإشعارات محظورة من إعدادات المتصفح لهذا الموقع. لتفعيلها: افتح إعدادات الموقع (أيقونة 🔒 بجانب الرابط) وفعّل الإشعارات يدوياً، ثم أعد تحميل الصفحة.
      </p>
    )
  }

  if (subscribed) {
    if (compact) return null
    if (variant === 'light') return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-blue">
        <Check size={14} className="text-ruwad-blue" /> مفعّلة
      </span>
    )
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

  if (variant === 'light') {
    return (
      <button
        onClick={enable}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-blue bg-ruwad-blue/10 hover:bg-ruwad-blue/20 px-3 py-2 rounded-ruwad-sm transition disabled:opacity-50"
      >
        {loading ? <BellOff size={14} className="animate-pulse" /> : <BellRing size={14} />}
        {loading ? 'جارٍ التفعيل...' : 'تفعيل الإشعارات'}
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
