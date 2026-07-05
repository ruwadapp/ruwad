import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// نقطة اختبار: يرسل المستخدم المسجّل إشعاراً تجريبياً لأجهزته هو فقط
// تُستخدم للتحقق السريع من أن الإشعارات تعمل من طرف إلى طرف
export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'missing_vapid', message: 'مفاتيح VAPID غير مضبوطة في الخادم' }, { status: 503 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@ruwad.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .eq('user_id', user.id)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'no_subscriptions', message: 'لا يوجد اشتراك مسجّل لهذا الحساب على هذا الجهاز' })
  }

  const payload = JSON.stringify({
    title: 'رُوّاد — إشعار تجريبي',
    body: 'وصلك هذا الإشعار بنجاح ✓ الإشعارات تعمل الآن.',
    url: '/profile',
    tone: 'important',
  })

  let sent = 0
  let cleaned = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          payload
        )
        sent++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 410 || statusCode === 404) {
          await supabase.rpc('delete_push_subscription', { p_endpoint: s.endpoint })
          cleaned++
        }
      }
    })
  )

  return NextResponse.json({ sent, cleaned, total: subs.length })
}
