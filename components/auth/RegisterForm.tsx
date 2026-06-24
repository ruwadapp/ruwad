'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'

export function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
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
      router.push('/login')
      return
    }

    router.push(role === 'trainer' ? '/dashboard' : '/home')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F6FA] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-ruwad-navy">رُوّاد</h1>
          <p className="text-ruwad-navy/60 mt-1">ابدأ رحلتك التعليمية الآن</p>
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
