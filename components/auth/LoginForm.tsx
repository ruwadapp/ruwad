'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    // تنقّل كامل (Hard Navigation) لضمان وصول الكوكيز الجديدة مع الطلب التالي،
    // بدل router.push الذي قد يسابق حفظ الجلسة في الكوكيز
    const redirectMap: Record<string, string> = {
      trainer: '/dashboard',
      student: '/home',
      institute_admin: '/org/dashboard',
      super_admin: '/admin/dashboard',
    }
    const next = searchParams.get('next')
    const isSafeRelativePath = !!next && next.startsWith('/') && !next.startsWith('//')
    window.location.href = isSafeRelativePath ? next : (redirectMap[profile?.role ?? 'student'] ?? '/home')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F6FA] px-4 py-8 w-full lg:w-1/2 lg:px-12">
      <div className="w-full max-w-md">
        <div className="relative lg:hidden bg-ruwad-gradient rounded-ruwad p-6 mb-6 overflow-hidden text-center">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-ruwad-lime/20 rounded-full blur-2xl" />
          <h1 className="relative text-3xl font-extrabold text-white">رُوّاد</h1>
          <p className="relative text-white/80 mt-1 text-sm">منصتك التعليمية المتكاملة</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-ruwad shadow-card p-8 flex flex-col gap-4"
        >
          <h2 className="text-xl font-bold text-ruwad-navy mb-2">تسجيل الدخول</h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ruwad-navy">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
              placeholder="example@email.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ruwad-navy">
              كلمة المرور
            </label>
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

          <button
            type="submit"
            disabled={loading}
            className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-2"
          >
            {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

          <p className="text-center text-sm text-ruwad-navy/70 mt-2">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="text-ruwad-blue font-semibold">
              إنشاء حساب جديد
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
