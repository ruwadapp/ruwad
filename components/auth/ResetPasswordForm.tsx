'use client'
import { usePortalBrand } from '@/lib/portal/brand-context'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createRecoveryClient } from '@/lib/supabase/client'
import { ShieldAlert, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'

export function ResetPasswordForm({ hasValidSession: initialHasSession }: { hasValidSession: boolean }) {
  const brand = usePortalBrand()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createRecoveryClient(), [])

  // الجلسة قد تأتي من السيرفر (كوكي) أو من الـ hash في رابط البريد (implicit flow) الذي يُعالج على المتصفح فقط،
  // لذا نبدأ بحالة "جارٍ التحقق" ثم نحسم بعد أن يعالج العميل الرابط
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(initialHasSession ? true : null)

  useEffect(() => {
    if (initialHasSession) return
    let settled = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        settled = true
        setHasValidSession(true)
      }
    })
    // مهلة احتياطية: إن لم تُلتقط جلسة من الرابط خلال ثوانٍ نعتبر الرابط غير صالح
    const timer = setTimeout(async () => {
      if (settled) return
      const { data: { session } } = await supabase.auth.getSession()
      setHasValidSession(!!session)
    }, 2500)
    return () => { subscription.unsubscribe(); clearTimeout(timer) }
  }, [supabase, initialHasSession])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }
    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return }

    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('تعذّر تحديث كلمة المرور، قد تكون صلاحية الرابط انتهت. اطلب رابطاً جديداً.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F6FA] px-4 py-8 w-full lg:w-1/2 lg:px-12">
      <div className="w-full max-w-md">
        <div className="relative lg:hidden bg-ruwad-gradient rounded-ruwad p-6 mb-6 overflow-hidden text-center">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-ruwad-lime/20 rounded-full blur-2xl" />
          <h1 className="relative text-3xl font-extrabold text-white">{brand ? brand.displayName : 'رُوّاد'}</h1>
        </div>

        <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col gap-4">
          {hasValidSession === null && !done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-ruwad-navy/60">
              <Loader2 size={28} className="animate-spin text-ruwad-blue" />
              <p className="text-sm">جارٍ التحقق من الرابط...</p>
            </div>
          ) : !hasValidSession && !done ? (
            <>
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-1">
                <ShieldAlert size={26} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-ruwad-navy">الرابط غير صالح أو منتهي</h2>
              <p className="text-sm text-ruwad-navy/60 leading-relaxed">
                رابط استعادة كلمة المرور صالح لفترة محدودة فقط. اطلب رابطاً جديداً وحاول مرة أخرى.
              </p>
              <Link
                href="/forgot-password"
                className="bg-ruwad-blue text-white text-center px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad mt-1"
              >
                طلب رابط جديد
              </Link>
            </>
          ) : done ? (
            <>
              <div className="w-14 h-14 rounded-full bg-ruwad-lime/30 flex items-center justify-center mb-1">
                <CheckCircle2 size={26} className="text-ruwad-navy" />
              </div>
              <h2 className="text-xl font-bold text-ruwad-navy">تم تحديث كلمة المرور بنجاح</h2>
              <p className="text-sm text-ruwad-navy/60">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
              <Link
                href="/login"
                className="bg-ruwad-blue text-white text-center px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad mt-1 flex items-center justify-center gap-1.5"
              >
                تسجيل الدخول <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-ruwad-navy">تعيين كلمة مرور جديدة</h2>
                <p className="text-sm text-ruwad-navy/60 mt-1">اختر كلمة مرور قوية لحسابك.</p>
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-ruwad-navy">كلمة المرور الجديدة</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-ruwad-navy">تأكيد كلمة المرور</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-1"
              >
                {loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور الجديدة'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
