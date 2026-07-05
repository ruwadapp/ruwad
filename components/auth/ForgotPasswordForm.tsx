'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, MailCheck, KeyRound } from 'lucide-react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    // نعرض رسالة النجاح دوماً بغضّ النظر عن وجود البريد فعلاً في النظام أو عدمه —
    // هذا سلوك أمني معتاد يمنع استخدام النموذج للتحقق من البريد الإلكتروني المسجَّل
    if (resetError && resetError.status && resetError.status >= 500) {
      setError('حدث خطأ أثناء الإرسال، حاول مرة أخرى')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
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
          {sent ? (
            <>
              <div className="w-14 h-14 rounded-full bg-ruwad-blue/10 flex items-center justify-center mb-1">
                <MailCheck size={26} className="text-ruwad-blue" />
              </div>
              <h2 className="text-xl font-bold text-ruwad-navy">تحقّق من بريدك</h2>
              <p className="text-sm text-ruwad-navy/60 leading-relaxed">
                إذا كان البريد <span className="font-semibold text-ruwad-navy">{email}</span> مسجَّلاً لدينا، سيصلك رابط لإعادة تعيين كلمة المرور خلال دقائق. تحقّق من مجلد الرسائل غير المرغوبة أيضاً إن لم تجده.
              </p>
              <Link href="/login" className="text-sm font-semibold text-ruwad-blue flex items-center gap-1.5 mt-2">
                <ArrowRight size={15} /> رجوع لتسجيل الدخول
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-full bg-ruwad-blue/10 flex items-center justify-center mb-1">
                <KeyRound size={26} className="text-ruwad-blue" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-ruwad-navy">استعادة كلمة المرور</h2>
                <p className="text-sm text-ruwad-navy/60 mt-1">أدخل بريدك الإلكتروني المسجَّل وسنرسل لك رابطاً لإعادة تعيينها.</p>
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

              <button
                type="submit"
                disabled={loading}
                className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-1"
              >
                {loading ? 'جارٍ الإرسال...' : 'إرسال رابط الاستعادة'}
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
