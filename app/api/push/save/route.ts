import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// حفظ اشتراك دفع مجدَّد قادم من عامل الخدمة (بجلسة الكوكيز الحالية)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const sub = (await req.json()) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: 'invalid subscription' }, { status: 400 })
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth_key: sub.keys.auth },
    { onConflict: 'user_id,endpoint' }
  )
  if (error) return NextResponse.json({ error: 'save failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
