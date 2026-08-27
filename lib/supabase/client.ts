import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// عميل بنمط implicit لتدفق استعادة كلمة المرور فقط:
// رابط البريد يحمل الجلسة في الـ hash (#access_token=...) ولا يحتاج كوكي code_verifier،
// لذا يعمل حتى لو فُتح الرابط من متصفح أو جهاز مختلف عن الذي طلبه (مثل متصفح تطبيق البريد).
export function createRecoveryClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'implicit', detectSessionInUrl: true } }
  )
}
