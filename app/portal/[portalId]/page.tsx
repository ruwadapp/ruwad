import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { brandStyle, type PortalInfo } from '@/lib/portal/resolve'
import { GraduationCap, MapPin, ArrowLeft, BookOpen, MessageCircleQuestion } from 'lucide-react'
import { InquiryForm } from '@/components/portal/InquiryForm'

// الصفحة العامة لبوابة المعهد — تُعرض على دومينه بهويته البصرية
// (الوصول إليها عبر rewrite من الـ middleware حصراً)

export async function generateMetadata({ params }: { params: Promise<{ portalId: string }> }) {
  const { portalId } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('get_portal_public', { p_portal_id: portalId }).single<{
    brand: PortalInfo['brand']; institute_name: string; institute_description: string | null
  }>()
  if (!data) return { title: 'بوابة غير موجودة', robots: { index: false } }
  const name = data.brand?.display_name || data.institute_name
  return {
    title: `${name} — التدريبات والتسجيل`,
    description: data.institute_description ?? `بوابة ${name}: تصفح التدريبات المتاحة وسجّل كطالب.`,
    openGraph: { title: name, description: data.institute_description ?? undefined, type: 'website' },
  }
}
export default async function PortalLandingPage({ params }: { params: Promise<{ portalId: string }> }) {
  const { portalId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: portal } = await supabase
    .rpc('get_portal_public', { p_portal_id: portalId })
    .single<{
      portal_id: string; institute_id: string; brand: PortalInfo['brand']
      institute_name: string; institute_description: string | null
      institute_logo: string | null; institute_address: string | null
    }>()
  if (!portal) notFound()

  // كورسات المعهد: المشاركة معه والمنشورة
  const { data: shares } = await supabase
    .from('resource_institute_shares').select('resource_id')
    .eq('resource_type', 'courses').eq('institute_id', portal.institute_id)
  const ids = (shares ?? []).map((s) => s.resource_id)
  const { data: courses } = ids.length
    ? await supabase.from('courses')
        .select('id, title, description, status').in('id', ids).eq('status', 'published').order('created_at', { ascending: false }).limit(12)
    : { data: [] }

  const brand = portal.brand ?? {}
  const name = brand.display_name || portal.institute_name

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F8FC]" style={brandStyle(brand)}>
      {/* الترويسة بهوية المعهد */}
      <header className="bg-ruwad-gradient text-white">
        <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20 flex flex-col items-center text-center gap-4">
          {(brand.logo_url || portal.institute_logo) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url || portal.institute_logo!} alt={name}
              className="w-20 h-20 rounded-2xl bg-white object-contain p-2 shadow-lg" />
          ) : (
            <span className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <GraduationCap size={38} />
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-black">{name}</h1>
          {portal.institute_description && (
            <p className="max-w-xl text-white/85 leading-relaxed">{portal.institute_description}</p>
          )}
          {portal.institute_address && (
            <p className="flex items-center gap-1.5 text-sm text-white/70"><MapPin size={14} /> {portal.institute_address}</p>
          )}
          <div className="flex gap-3 mt-3">
            <Link href={`https://www.ruwaad.app/register?portal=${portal.portal_id}`}
              className="bg-ruwad-lime text-ruwad-navy font-extrabold px-6 py-3 rounded-ruwad-sm hover:opacity-90 transition">
              سجّل كطالب
            </Link>
            <Link href="https://www.ruwaad.app/login"
              className="bg-white/15 backdrop-blur text-white font-bold px-6 py-3 rounded-ruwad-sm hover:bg-white/25 transition">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </header>

      {/* الكورسات */}
      <section className="max-w-5xl mx-auto px-5 py-12">
        <h2 className="text-xl font-extrabold text-ruwad-navy mb-6 flex items-center gap-2">
          <BookOpen size={20} className="text-ruwad-blue" /> التدريبات المتاحة
        </h2>
        {!courses || courses.length === 0 ? (
          <p className="text-ruwad-navy/50 bg-white rounded-ruwad p-8 text-center shadow-card">
            لا توجد تدريبات منشورة حالياً — تابعنا قريباً.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <Link key={c.id} href={`https://www.ruwaad.app/land/${c.id}`}
                className="group bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2 hover:shadow-ruwad-lg hover:-translate-y-0.5 transition-all">
                <h3 className="font-extrabold text-ruwad-navy group-hover:text-ruwad-blue transition-colors line-clamp-2">{c.title}</h3>
                {c.description && <p className="text-sm text-ruwad-navy/55 line-clamp-2 leading-relaxed">{c.description}</p>}
                <span className="mt-auto pt-2 text-xs font-extrabold text-ruwad-blue flex items-center gap-1">
                  التفاصيل والتسجيل <ArrowLeft size={13} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* استفسر الآن — يصب مباشرة في لوحة المهتمين لدى المعهد */}
      <section id="inquiry" className="max-w-2xl mx-auto px-5 pb-14">
        <h2 className="text-xl font-extrabold text-ruwad-navy mb-2 flex items-center gap-2">
          <MessageCircleQuestion size={20} className="text-ruwad-blue" /> استفسر الآن
        </h2>
        <p className="text-sm text-ruwad-navy/55 mb-4">اترك اسمك ورقمك وسيتواصل معك المعهد مباشرة.</p>
        <InquiryForm instituteId={portal.institute_id} portalId={portal.portal_id}
          courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title }))} />
      </section>

      <footer className="border-t border-ruwad-gray/60 py-6 text-center text-xs text-ruwad-navy/40">
        بوابة {name} — تعمل بمنصة <a href="https://www.ruwaad.app" className="font-bold text-ruwad-blue hover:underline">رُوّاد</a>
      </footer>
    </main>
  )
}
