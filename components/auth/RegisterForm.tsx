'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'

export function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })

    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? 'هذا البريد الإلكتروني مسجل بالفعل'
        : 'حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى')
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      window.location.href = '/login'
      return
    }

    window.location.href = role === 'trainer' ? '/dashboard' : '/home'
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F6FA] px-4 py-8 w-full lg:w-1/2 lg:px-12">
      <div className="w-full max-w-md">
        <div className="relative lg:hidden bg-ruwad-gradient rounded-ruwad p-6 mb-6 overflow-hidden text-center">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-ruwad-lime/20 rounded-full blur-2xl" />
          <h1 className="relative text-3xl font-extrabold text-white">رُوّاد</h1>
          <p className="relative text-white/80 mt-1 text-sm">ابدأ رحلتك التعليمية الآن</p>
        </div>

        <form
          onSubmit={handleRegister}
          className="bg-white rounded-ruwad shadow-card p-8 flex flex-col gap-4"
        >
          <h2 className="text-xl font-bold text-ruwad-navy mb-2">إنشاء حساب جديد</h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`rounded-ruwad-sm py-3 font-semibold transition border-2 ${
                role === 'student'
                  ? 'bg-ruwad-blue text-white border-ruwad-blue'
                  : 'bg-white text-ruwad-navy border-ruwad-gray'
              }`}
            >
              طالب
            </button>
            <button
              type="button"
              onClick={() => setRole('trainer')}
              className={`rounded-ruwad-sm py-3 font-semibold transition border-2 ${
                role === 'trainer'
                  ? 'bg-ruwad-blue text-white border-ruwad-blue'
                  : 'bg-white text-ruwad-navy border-ruwad-gray'
              }`}
            >
              مدرب
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-sm font-medium text-ruwad-navy">
              الاسم الكامل
            </label>
            <input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
              placeholder="اسمك الكامل"
            />
          </div>

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
              minLength={6}
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
            {loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
          </button>

          <p className="text-center text-sm text-ruwad-navy/70 mt-2">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-ruwad-blue font-semibold">
              تسجيل الدخول
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
