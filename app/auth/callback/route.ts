import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// نقطة استقبال روابط Supabase Auth (تأكيد البريد، واستعادة كلمة المرور)
//
// تدعم مسارين:
// 1) token_hash + type  ← المسار الموصى به لروابط البريد. يعمل من أي جهاز أو متصفح
//    لأن التحقق يتم على السيرفر مباشرة ولا يحتاج كوكي code_verifier من متصفح الطلب.
// 2) code (PKCE)        ← يُستخدم لتسجيل الدخول عبر OAuth ولروابط البريد القديمة.
//    ملاحظة: يفشل إذا فُتح الرابط من متصفح مختلف عن الذي طلب الرابط.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = getPublicOrigin(request)

  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = sanitizeNext(searchParams.get('next'), type)

  const supabase = await createServerSupabaseClient()

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    return redirectWithError(origin, next, type)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    return redirectWithError(origin, next, type)
  }

  // لا code ولا token_hash: غالباً التدفق الضمني (implicit) حيث تصل الجلسة في جزء #hash من الرابط
  // وهذا الجزء لا يصل للسيرفر. نمرّر المستخدم لوجهته والمتصفح يلتقط الجلسة من الـ hash بنفسه.
  return NextResponse.redirect(`${origin}${next}`)
}

// خلف Vercel قد يختلف origin الداخلي عن النطاق العام، لذا نعتمد على النطاق المعرَّف في البيئة أولاً
function getPublicOrigin(request: NextRequest) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return host ? `${proto}://${host}` : new URL(request.url).origin
}

// نسمح فقط بالمسارات الداخلية (تبدأ بـ / وليس //) لمنع التحويل لمواقع خارجية
function sanitizeNext(next: string | null, type: EmailOtpType | null) {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return type === 'recovery' ? '/reset-password' : '/'
}

// روابط الاستعادة الفاشلة تذهب لصفحة reset-password التي تعرض رسالة "الرابط غير صالح" مع زر طلب رابط جديد
function redirectWithError(origin: string, next: string, type: EmailOtpType | null) {
  if (type === 'recovery' || next.startsWith('/reset-password')) {
    return NextResponse.redirect(`${origin}/reset-password?error=link_invalid`)
  }
  return NextResponse.redirect(`${origin}/login?error=auth_link_invalid`)
}
