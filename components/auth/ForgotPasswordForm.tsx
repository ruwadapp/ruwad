'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react'

// إعادة تعيين مباشرة بلا بريد: البريد القديم + كلمة مرور جديدة + تأكيد → حفظ.
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.'); return }
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/direct-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), newPassword: password }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) { setError(data.error ?? 'تعذّر تحديث كلمة المرور، حاول مجدداً.'); return }
      setDone(true)
    } catch {
      setLoading(false)
      setError('تعذّر الاتصال، حاول مجدداً.')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F6FA] px-4 py-8 w-full lg:w-1/2 lg:px-12">
      <div className="w-full max-w-md">
        <div className="relative lg:hidden bg-ruwad-gradient rounded-ruwad p-6 mb-6 overflow-hidden text-center">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-ruwad-lime/20 rounded-full blur-2xl" />
          <h1 className="relative text-3xl font-extrabold text-white">رُوّاد</h1>
        </div>

        <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col gap-4">
          {done ? (
            <>
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-1">
                <CheckCircle2 size={26} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-ruwad-navy">تم تغيير كلمة المرور</h2>
              <p className="text-sm text-ruwad-navy/60 leading-relaxed">
                يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad mt-2"
              >
                الذهاب لتسجيل الدخول
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-full bg-ruwad-blue/10 flex items-center justify-center mb-1">
                <KeyRound size={26} className="text-ruwad-blue" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-ruwad-navy">إعادة تعيين كلمة المرور</h2>
                <p className="text-sm text-ruwad-navy/60 mt-1">أدخل بريدك المسجَّل وكلمة المرور الجديدة مباشرةً.</p>
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-ruwad-navy">البريد الإلكتروني</label>
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
                <label htmlFor="password" className="text-sm font-medium text-ruwad-navy">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    id="password"
                    type={show ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 pl-10 outline-none focus:border-ruwad-blue transition"
                    placeholder="6 أحرف على الأقل"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute left-3 top-1/2 -translate-y-1/2 text-ruwad-navy/40 hover:text-ruwad-navy" aria-label="إظهار كلمة المرور">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-sm font-medium text-ruwad-navy">تأكيد كلمة المرور</label>
                <input
                  id="confirm"
                  type={show ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
                  placeholder="أعد كتابة كلمة المرور"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-1"
              >
                {loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور الجديدة'}
              </button>

              <Link href="/login" className="text-center text-sm font-semibold text-ruwad-navy/60 hover:text-ruwad-blue transition flex items-center justify-center gap-1.5">
                <ArrowRight size={14} /> رجوع لتسجيل الدخول
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
