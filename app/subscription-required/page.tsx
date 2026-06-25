import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AlertTriangle, LogOut, Building2, MessageCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const WHATSAPP_NUMBER = '963998285483'

export default async function SubscriptionRequiredPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isInstitute = profile?.role === 'institute_admin'

  const whatsappMessage = encodeURIComponent(
    isInstitute
      ? 'السلام عليكم، أريد تفعيل/تجديد اشتراك معهدي في منصة رُوّاد'
      : 'السلام عليكم، أريد الاشتراك في منصة رُوّاد كمدرّب'
  )

  return (
    <main className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6" dir="rtl">
      <div className="bg-white rounded-ruwad shadow-ruwad-lg p-10 max-w-md w-full flex flex-col items-center gap-5 text-center">
        <AlertTriangle size={48} className="text-amber-500" />
        <div>
          <h1 className="text-xl font-bold text-ruwad-navy">لا يوجد اشتراك فعّال على حسابك</h1>
          <p className="text-sm text-ruwad-navy/60 mt-2">
            {isInstitute
              ? 'يحتاج معهدك اشتراكاً فعّالاً ليتمكّن مدربوك من استخدام المنصة.'
              : 'للوصول لميزات المنصة، يمكنك أحد الخيارين التاليين:'}
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          {!isInstitute && (
            <a
              href="/institute"
              className="flex items-center justify-center gap-2 bg-ruwad-lime text-ruwad-navy px-6 py-3 rounded-ruwad-sm font-bold hover:opacity-90 transition"
            >
              <Building2 size={18} /> الانضمام لمعهد (مجاناً)
            </a>
          )}

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition"
          >
            <MessageCircle size={18} /> {isInstitute ? 'التواصل لتفعيل اشتراك المعهد' : 'التواصل لاشتراك فردي عبر واتساب'}
          </a>
        </div>

        <a href="/login" className="flex items-center gap-2 text-sm font-medium text-ruwad-navy/50 hover:text-ruwad-navy transition mt-2">
          <LogOut size={15} /> تسجيل الخروج
        </a>
      </div>
    </main>
  )
}
