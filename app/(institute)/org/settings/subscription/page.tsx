import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CreditCard, CalendarClock, MessageCircle, CheckCircle2, AlertTriangle, Snowflake } from 'lucide-react'

const WHATSAPP_NUMBER = '963998285483'

export default async function InstituteSubscriptionPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('plan_name, plan_price, billing_cycle, subscription_ends_at, is_frozen')
    .eq('id', user!.id).single()

  const endsAt = profile?.subscription_ends_at ? new Date(profile.subscription_ends_at) : null
  const expired = endsAt ? endsAt < new Date() : false
  const daysLeft = endsAt ? Math.ceil((endsAt.getTime() - Date.now()) / 86400_000) : null

  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `السلام عليكم، أرغب بتجديد/ترقية اشتراك معهدي${profile?.plan_name ? ` (الخطة الحالية: ${profile.plan_name})` : ''} في منصة رُوّاد`
  )}`

  return (
    <>
      <Header title="الاشتراك" />
      <main className="p-4 sm:p-6 max-w-xl mx-auto flex flex-col gap-4">
        <div className={`relative overflow-hidden rounded-ruwad shadow-ruwad-lg p-6 sm:p-8 ${profile?.is_frozen ? 'bg-sky-600' : expired ? 'bg-red-500' : 'bg-ruwad-gradient'}`}>
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-3 text-white">
            {profile?.is_frozen ? <Snowflake size={22} /> : expired ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
            <div>
              <p className="font-extrabold text-lg">
                {profile?.is_frozen ? 'حسابك مجمَّد' : expired ? 'انتهت مدة اشتراكك' : 'اشتراكك نشط'}
              </p>
              {profile?.plan_name && <p className="text-sm text-white/80 mt-0.5">الخطة: {profile.plan_name} — ${profile.plan_price}{profile.billing_cycle === 'yearly' ? '/سنة' : '/شهر'}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-ruwad shadow-card p-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center shrink-0"><CalendarClock size={18} /></span>
          <div>
            <p className="text-sm font-extrabold text-ruwad-navy">
              {endsAt ? (expired ? 'انتهى بتاريخ' : 'ينتهي بتاريخ') : 'بلا تاريخ انتهاء محدَّد'}
            </p>
            {endsAt && (
              <p className="text-xs font-bold text-ruwad-navy/50 mt-0.5">
                {endsAt.toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })}
                {!expired && daysLeft != null && ` · باقي ${daysLeft} يوماً`}
              </p>
            )}
          </div>
        </div>

        <a href={wa} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 bg-green-500 text-white font-extrabold py-3.5 rounded-ruwad-sm hover:opacity-90 transition">
          <MessageCircle size={18} /> {expired ? 'جدّد اشتراكك الآن' : 'تواصل بخصوص الاشتراك أو الترقية'}
        </a>
        <p className="text-center text-xs text-ruwad-navy/40 flex items-center justify-center gap-1.5">
          <CreditCard size={12} /> إدارة الاشتراك والدفع تتم مباشرة مع فريق رُوّاد
        </p>
      </main>
    </>
  )
}
