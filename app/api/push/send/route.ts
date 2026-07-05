import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function destinationFor(type: string, referenceId: string | null, role: string): string {
  const isTrainer = role === 'trainer'
  switch (type) {
    case 'lecture': return isTrainer ? '/courses' : '/my-courses'
    case 'exam': return isTrainer ? `/exams/${referenceId}` : `/my-exams/${referenceId}`
    case 'challenge': return isTrainer ? `/challenges/${referenceId}` : '/my-challenges'
    case 'assignment': return isTrainer ? `/assignments/${referenceId}` : '/my-assignments'
    case 'enrollment': return isTrainer ? '/students' : '/my-courses'
    case 'badge': case 'certificate': return '/progress'
    case 'announcement': return isTrainer ? '/dashboard' : '/home'
    default: return isTrainer ? '/dashboard' : '/home'
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-push-secret')
  if (secret !== process.env.PUSH_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'Push not configured (missing VAPID keys)' }, { status: 503 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@ruwad.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  const { subscriptions, title, body, type, reference_id, role, tone } = await req.json()
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, cleaned: 0 })
  }

  const url = destinationFor(type, reference_id, role ?? 'student')
  const payload = JSON.stringify({ title, body, url, tone })

  // نستخدم مفتاح الخدمة إن وُجد، وإلا نتراجع لمفتاح anon مع دالة RPC آمنة لحذف الاشتراكات الميتة
  // بهذا لا يتعطّل تنظيف الاشتراكات الميتة إطلاقاً حتى لو غاب SUPABASE_SERVICE_ROLE_KEY في البيئة
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseAdmin = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : anonKey
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, anonKey)
      : null

  async function removeDeadEndpoint(endpoint: string) {
    if (!supabaseAdmin) return
    try {
      // نحاول الحذف المباشر أولاً (يعمل بمفتاح الخدمة)، ثم عبر RPC الآمنة (يعمل بمفتاح anon)
      const { error } = await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint)
      if (error) await supabaseAdmin.rpc('delete_push_subscription', { p_endpoint: endpoint })
    } catch {
      try { await supabaseAdmin.rpc('delete_push_subscription', { p_endpoint: endpoint }) } catch { /* ignore */ }
    }
  }

  let sent = 0
  let failed = 0
  let cleaned = 0

  await Promise.all(
    subscriptions.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: unknown) {
        failed++
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 410 || statusCode === 404) {
          await removeDeadEndpoint(sub.endpoint)
          cleaned++
        } else {
          console.error('Push send error:', statusCode, (err as { body?: string })?.body ?? err)
        }
      }
    })
  )

  return NextResponse.json({ sent, failed, cleaned })
}
