import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Clock, XCircle, LogOut, MessageCircle, Snowflake, CalendarX } from 'lucide-react'

export const dynamic = 'force-dynamic'

const WHATSAPP_NUMBER = '963998285483'

export default async function AccountPendingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_status, full_name, is_frozen, subscription_ends_at')
    .eq('id', user.id)
    .single()

  const rejected = profile?.account_status === 'rejected'
  const frozen = !!profile?.is_frozen
  const expired = !frozen && profile?.subscription_ends_at ? new Date(profile.subscription_ends_at) < new Date() : false

  const reasonText = frozen ? 'تم تجميد حسابي ولديّ استفسار'
    : expired ? 'انتهى اشتراكي وأرغب بالتجديد'
    : rejected ? 'تم رفضه ولديّ استفسار'
    : 'بانتظار الموافقة'
  const whatsappMessage = encodeURIComponent(`السلام عليكم، حسابي (${profile?.full_name ?? ''}) ${reasonText} على منصة رُوّاد`)

  return (
    <main className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6" dir="rtl">
      <div className="bg-white rounded-ruwad shadow-ruwad-lg p-10 max-w-md w-full flex flex-col items-center gap-5 text-center">
        {frozen ? (
          <>
            <Snowflake size={48} className="text-sky-500" />
            <div>
              <h1 className="text-xl font-bold text-ruwad-navy">تم تجميد حسابك</h1>
              <p className="text-sm text-ruwad-navy/60 mt-2">تواصل مع الإدارة لمعرفة السبب أو لإعادة تفعيل حسابك.</p>
            </div>
          </>
        ) : expired ? (
          <>
            <CalendarX size={48} className="text-amber-500" />
            <div>
              <h1 className="text-xl font-bold text-ruwad-navy">انتهت مدة اشتراكك</h1>
              <p className="text-sm text-ruwad-navy/60 mt-2">تواصل مع الإدارة لتجديد اشتراكك ومتابعة استخدام المنصة.</p>
            </div>
          </>
        ) : rejected ? (
          <>
            <XCircle size={48} className="text-red-500" />
            <div>
              <h1 className="text-xl font-bold text-ruwad-navy">تم رفض حسابك</h1>
              <p className="text-sm text-ruwad-navy/60 mt-2">إذا كان هذا خطأً أو لديك استفسار، تواصل معنا مباشرة.</p>
            </div>
          </>
        ) : (
          <>
            <Clock size={48} className="text-amber-500" />
            <div>
              <h1 className="text-xl font-bold text-ruwad-navy">حسابك بانتظار الموافقة</h1>
              <p className="text-sm text-ruwad-navy/60 mt-2">
                يحتاج كل حساب جديد على منصة رُوّاد لموافقة الإدارة قبل التفعيل. سيتم إشعارك بمجرد الموافقة.
              </p>
            </div>
          </>
        )}

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition w-full"
        >
          <MessageCircle size={18} /> التواصل عبر واتساب
        </a>

        <a href="/login" className="flex items-center gap-2 text-sm font-medium text-ruwad-navy/50 hover:text-ruwad-navy transition mt-1">
          <LogOut size={15} /> تسجيل الخروج
        </a>
      </div>
    </main>
  )
}

