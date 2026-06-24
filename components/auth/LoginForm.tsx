'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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
    window.location.href = profile?.role === 'trainer' ? '/dashboard' : '/home'
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F6FA] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-ruwad-navy">رُوّاد</h1>
          <p className="text-ruwad-navy/60 mt-1">منصتك التعليمية المتكاملة</p>
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
