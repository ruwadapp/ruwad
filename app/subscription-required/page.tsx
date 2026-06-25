import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AlertTriangle, LogOut } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SubscriptionRequiredPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6" dir="rtl">
      <div className="bg-white rounded-ruwad shadow-ruwad-lg p-10 max-w-md w-full flex flex-col items-center gap-4 text-center">
        <AlertTriangle size={48} className="text-amber-500" />
        <h1 className="text-xl font-bold text-ruwad-navy">اشتراكك غير نشط</h1>
        <p className="text-sm text-ruwad-navy/60">
          تم تجميد أو إيقاف اشتراكك في منصة رُوّاد. تواصل مع فريق الدعم لتفعيل اشتراكك مجدداً والعودة لاستخدام حسابك.
        </p>
        <a
          href="/login"
          className="flex items-center gap-2 bg-ruwad-navy text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition mt-2"
        >
          <LogOut size={16} /> تسجيل الخروج
        </a>
      </div>
    </main>
  )
}
