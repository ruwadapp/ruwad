import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { Globe, Link2, CheckCircle2, Clock, Palette, MessageCircle, ExternalLink, Copy } from 'lucide-react'

const WHATSAPP_NUMBER = '963998285483'
const STATUS_AR: Record<string, { label: string; cls: string }> = {
  active: { label: 'نشطة', cls: 'bg-green-50 text-green-600' },
  suspended: { label: 'موقوفة', cls: 'bg-amber-50 text-amber-600' },
  expired: { label: 'منتهية', cls: 'bg-red-50 text-red-500' },
}

// شاشة "بوابتي": المعهد يرى إعدادات بوابته للقراءة فقط —
// إدارة الاشتراك والهوية حصراً بيد إدارة المنصة (وفق RLS)
export default async function InstitutePortalPage() {
  const supabase = await createServerSupabaseClient()
  const { data: portal } = await supabase
    .from('institute_portals')
    .select('*')
    .maybeSingle()

  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('السلام عليكم، أرغب بالاستفسار عن بوابة معهدي على منصة رُوّاد')}`

  if (!portal) {
    return (
      <div className="min-h-screen bg-[#F5F6FA]">
        <Header title="بوابتي" />
        <main className="p-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-ruwad shadow-card p-8 text-center flex flex-col items-center gap-4">
            <span className="w-16 h-16 rounded-full bg-ruwad-blue/10 flex items-center justify-center"><Globe size={28} className="text-ruwad-blue" /></span>
            <h2 className="text-lg font-extrabold text-ruwad-navy">لا بوابة لمعهدك بعد</h2>
            <p className="text-sm text-ruwad-navy/60 leading-relaxed max-w-md">
              البوابة تمنح معهدك موقعاً بهويتك البصرية الكاملة — ألوانك وشعارك — على رابط خاص بك
              (وحتى دومينك المستقل)، ويسجّل الطلاب عبره فينضمون لمعهدك تلقائياً.
            </p>
            <a href={wa} className="flex items-center gap-2 bg-green-500 text-white font-extrabold px-5 py-3 rounded-ruwad-sm hover:opacity-90 transition">
              <MessageCircle size={16} /> اطلب بوابتك من إدارة المنصة
            </a>
          </div>
        </main>
      </div>
    )
  }

  const st = STATUS_AR[portal.status] ?? STATUS_AR.active
  const brand = (portal.brand ?? {}) as { primary?: string; secondary?: string; accent?: string; display_name?: string; logo_url?: string }
  const portalUrl = `https://${portal.subdomain}.ruwaad.app`

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="بوابتي" />
      <main className="p-6 max-w-3xl mx-auto flex flex-col gap-5">
        {/* البطاقة الرئيسية */}
        <div className="bg-white rounded-ruwad shadow-card overflow-hidden">
          <div className="p-6 text-white flex items-center justify-between gap-4"
            style={{ background: `linear-gradient(135deg, ${brand.primary ?? '#3A4EFB'}, ${brand.secondary ?? '#33A4FA'})` }}>
            <div className="flex items-center gap-3 min-w-0">
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo_url} alt="" className="w-12 h-12 rounded-xl bg-white object-contain p-1.5 shrink-0" />
              ) : <span className="text-3xl">🎓</span>}
              <div className="min-w-0">
                <p className="font-extrabold text-lg truncate">{brand.display_name || 'بوابة المعهد'}</p>
                <p className="text-white/75 text-xs">هوية بوابتك كما يراها زوارها</p>
              </div>
            </div>
            <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full bg-white ${st.cls.split(' ')[1]}`}>{st.label}</span>
          </div>

          <div className="p-5 flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 font-bold text-ruwad-navy"><Globe size={15} className="text-ruwad-blue" /> رابط البوابة</span>
              <a href={portalUrl} target="_blank" className="flex items-center gap-1.5 text-ruwad-blue font-extrabold hover:underline" dir="ltr">
                {portal.subdomain}.ruwaad.app <ExternalLink size={12} />
              </a>
            </div>
            {portal.custom_domain && (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 font-bold text-ruwad-navy"><Link2 size={15} className="text-ruwad-blue" /> الدومين الخاص</span>
                <span className="flex items-center gap-2 font-extrabold text-ruwad-navy" dir="ltr">
                  {portal.custom_domain}
                  {portal.domain_status === 'active'
                    ? <CheckCircle2 size={15} className="text-green-500" />
                    : <span className="text-[11px] text-amber-600 font-bold" dir="rtl">بانتظار إعداد DNS</span>}
                </span>
              </div>
            )}
            {portal.expires_at && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-bold text-ruwad-navy"><Clock size={15} className="text-ruwad-blue" /> الاشتراك حتى</span>
                <span className="font-extrabold text-ruwad-navy">{new Date(portal.expires_at).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-bold text-ruwad-navy"><Palette size={15} className="text-ruwad-blue" /> ألوان الهوية</span>
              <span className="flex items-center gap-1.5">
                {[brand.primary ?? '#3A4EFB', brand.secondary ?? '#33A4FA', brand.accent ?? '#E3FF3B'].map((c, i) => (
                  <span key={i} className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: c }} />
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* تعليمات DNS إن كان الدومين قيد الربط */}
        {portal.custom_domain && portal.domain_status === 'pending_dns' && (
          <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-3">
            <p className="text-sm font-extrabold text-ruwad-navy">لإكمال ربط دومينك، أضف هذين السجلين عند مسجّل النطاق:</p>
            {[
              { type: 'A', name: '@', value: '76.76.21.21' },
              { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
            ].map((r) => (
              <div key={r.type} className="flex items-center justify-between gap-2 bg-[#F5F6FA] rounded-ruwad-sm px-3 py-2.5 text-xs font-mono" dir="ltr">
                <span className="font-extrabold text-ruwad-navy w-16">{r.type}</span>
                <span className="text-ruwad-navy/60 w-10">{r.name}</span>
                <span className="flex-1 text-ruwad-blue font-bold">{r.value}</span>
                <Copy size={12} className="text-ruwad-navy/30" />
              </div>
            ))}
            <p className="text-[11px] text-ruwad-navy/50">بعد الإضافة أخبر إدارة المنصة ليتم التحقق والتفعيل — شهادة الأمان تصدر تلقائياً.</p>
          </div>
        )}

        {/* طلب تعديل */}
        <div className="bg-white rounded-ruwad shadow-card p-5 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-ruwad-navy/70 font-medium">
            تعديل الألوان أو الشعار أو الدومين، أو تجديد الاشتراك — عبر إدارة المنصة.
          </p>
          <a href={wa} className="flex items-center gap-2 bg-green-500 text-white text-sm font-extrabold px-4 py-2.5 rounded-ruwad-sm hover:opacity-90 transition shrink-0">
            <MessageCircle size={15} /> تواصل معنا
          </a>
        </div>
      </main>
    </div>
  )
}
