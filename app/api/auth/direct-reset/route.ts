import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// إعادة تعيين كلمة المرور مباشرةً بالبريد دون إرسال أي رسالة.
// ملاحظة: هذا السلوك مناسب لبيئة مغلقة/تجريبية فقط، إذ يسمح بتغيير كلمة
// السر بمعرفة البريد وحده. لا يصلح لتطبيق عام فيه مستخدمون غير موثوقين.
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  const { email, newPassword } = (await req.json()) as { email?: string; newPassword?: string }

  if (!email || !newPassword) {
    return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان.' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' }, { status: 400 })
  }

  const admin = adminClient()
  const target = email.trim().toLowerCase()

  // البحث عن المستخدم بالبريد عبر صفحات قائمة المستخدمين
  let userId: string | null = null
  for (let page = 1; page <= 20 && !userId; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return NextResponse.json({ error: 'تعذّر التحقق، حاول مجدداً.' }, { status: 500 })
    const match = data.users.find((u) => u.email?.toLowerCase() === target)
    if (match) userId = match.id
    if (data.users.length < 200) break
  }

  // رسالة موحّدة سواء وُجد البريد أم لا، حتى لا يُستخدم النموذج لاستكشاف الحسابات
  if (!userId) {
    return NextResponse.json({ ok: true })
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
  if (updateError) {
    return NextResponse.json({ error: 'تعذّر تحديث كلمة المرور، حاول مجدداً.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
