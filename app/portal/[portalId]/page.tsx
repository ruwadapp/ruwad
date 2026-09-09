import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { brandStyle, type PortalInfo } from '@/lib/portal/resolve'
import { mergeLanding } from '@/lib/portal/landing'
import { HeroSlider } from '@/components/portal/HeroSlider'
import { InquiryForm } from '@/components/portal/InquiryForm'
import {
  GraduationCap, MapPin, ArrowLeft, BookOpen, MessageCircleQuestion, Newspaper,
  Phone, Mail, Facebook, Instagram, Youtube, Send, MessageCircle,
  Users, Award, Star, CheckCircle, ChevronLeft, Sparkles,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

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
      portal_id: string; institute_id: string; brand: PortalInfo['brand']; landing: unknown
      institute_name: string; institute_description: string | null
      institute_logo: string | null; institute_address: string | null
    }>()
  if (!portal) notFound()

  const L = mergeLanding(portal.landing)
  const brand = portal.brand ?? {}
  const name = brand.display_name || portal.institute_name

  const { data: shares } = await supabase
    .from('resource_institute_shares').select('resource_id')
    .eq('resource_type', 'courses').eq('institute_id', portal.institute_id)
  const courseIds = (shares ?? []).map((s) => s.resource_id)
  const { data: courses } = courseIds.length
    ? await supabase.from('courses')
        .select('id, title, description, status, price, currency')
        .in('id', courseIds).eq('status', 'published')
        .order('created_at', { ascending: false }).limit(12)
    : { data: [] }

  let liveStats: { label: string; value: string; icon: string }[] = []
  if (L.sections.stats && L.stats.auto) {
    const [{ count: studentsCount }, certsRes] = await Promise.all([
      supabase.from('institute_members').select('id', { count: 'exact', head: true })
        .eq('institute_id', portal.institute_id).eq('status', 'approved'),
      courseIds.length
        ? supabase.from('certificates').select('id', { count: 'exact', head: true }).in('course_id', courseIds)
        : Promise.resolve({ count: 0 }),
    ])
    liveStats = [
      { label: 'تدريب متاح', value: `${courses?.length ?? 0}`, icon: 'book' },
      { label: 'طالب مسجّل', value: `${studentsCount ?? 0}+`, icon: 'users' },
      { label: 'شهادة صادرة', value: `${(certsRes as { count: number | null }).count ?? 0}`, icon: 'award' },
    ]
  }
  const stats = L.stats.auto
    ? liveStats
    : L.stats.manual.filter((m) => m.label && m.value).map((m) => ({ ...m, icon: 'star' }))

  const { data: news } = L.sections.news
    ? await supabase.from('trainer_posts')
        .select('id, content, created_at')
        .eq('institute_id', portal.institute_id)
        .order('created_at', { ascending: false }).limit(3)
    : { data: [] }

  const heroHeadline = L.hero.headline || name
  const heroTagline = L.hero.tagline || portal.institute_description || 'تدريبات احترافية بشهادات موثّقة — سجّل وابدأ رحلتك التعليمية.'
  const testimonials = L.testimonials.filter((t) => t.text)
  const f = L.footer
  const socials = [
    { url: f.socials.facebook, icon: Facebook, label: 'فيسبوك' },
    { url: f.socials.instagram, icon: Instagram, label: 'إنستغرام' },
    { url: f.socials.whatsapp ? `https://wa.me/${f.socials.whatsapp.replace(/\D/g, '')}` : '', icon: MessageCircle, label: 'واتساب' },
    { url: f.socials.telegram, icon: Send, label: 'تيليغرام' },
    { url: f.socials.youtube, icon: Youtube, label: 'يوتيوب' },
  ].filter((s) => s.url)

  const fmtPrice = (p: number | null, cur: string) =>
    p == null ? null : `${Number(p).toLocaleString('ar')} ${cur === 'SYP' ? 'ل.س' : cur === 'USD' ? '$' : cur}`

  const StatIcon = ({ icon }: { icon: string }) => {
    if (icon === 'users') return <Users size={28} className="text-white/80" />
    if (icon === 'award') return <Award size={28} className="text-white/80" />
    if (icon === 'book') return <BookOpen size={28} className="text-white/80" />
    return <Star size={28} className="text-white/80" />
  }

  return (
    <main dir="rtl" className="min-h-screen" style={brandStyle(brand)}>

      {/* ===== 1. التنقل ===== */}
      <nav className="bg-white/98 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 flex-1">
            {(brand.logo_url || portal.institute_logo) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url || portal.institute_logo!} alt={name}
                className="h-9 w-auto max-w-[120px] object-contain" />
            ) : (
              <span className="w-9 h-9 rounded-xl bg-ruwad-gradient text-white flex items-center justify-center shrink-0 shadow-sm">
                <GraduationCap size={18} />
              </span>
            )}
            <span className="font-black text-ruwad-navy text-lg truncate hidden sm:block">{name}</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-500">
            {L.sections.courses && <a href="#courses" className="hover:text-ruwad-blue transition-colors">التدريبات</a>}
            {L.sections.about && <a href="#about" className="hover:text-ruwad-blue transition-colors">من نحن</a>}
            {L.sections.news && (news?.length ?? 0) > 0 && <a href="#news" className="hover:text-ruwad-blue transition-colors">الأخبار</a>}
            {L.sections.inquiry && <a href="#inquiry" className="hover:text-ruwad-blue transition-colors">تواصل معنا</a>}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login"
              className="hidden sm:inline-flex text-sm font-bold text-gray-600 hover:text-ruwad-blue transition-colors px-4 py-2">
              دخول
            </Link>
            <Link href={`/register?portal=${portal.portal_id}`}
              className="bg-ruwad-blue text-white text-sm font-black px-5 py-2.5 rounded-full hover:opacity-90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              سجّل مجاناً ←
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== 2. الهيرو ===== */}
      {L.sections.hero && (
        <section className="relative overflow-hidden bg-ruwad-navy min-h-[70vh] flex items-center">
          <HeroSlider images={L.hero.slides} intervalS={L.hero.slide_interval_s} />
          {/* طبقة نمط هندسي خلفي */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-ruwad-blue/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-ruwad-lime/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-6xl mx-auto px-5 py-24 w-full">
            <div className="max-w-2xl">
              {/* وسم صغير فوق العنوان */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <Sparkles size={13} className="text-ruwad-lime" />
                <span className="text-xs font-bold text-white/90">منصة تدريبية معتمدة</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-5">
                {heroHeadline}
              </h1>
              <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-xl">{heroTagline}</p>
              {portal.institute_address && (
                <p className="flex items-center gap-2 text-sm text-white/55 mb-6">
                  <MapPin size={14} className="text-ruwad-lime" /> {portal.institute_address}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Link href={`/register?portal=${portal.portal_id}`}
                  className="bg-ruwad-lime text-ruwad-navy font-black text-base px-8 py-4 rounded-full hover:opacity-90 transition-all shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
                  {L.hero.cta_text || 'ابدأ التسجيل مجاناً'} <ChevronLeft size={18} />
                </Link>
                {L.sections.courses && (
                  <a href="#courses"
                    className="bg-white/10 backdrop-blur border border-white/25 text-white font-bold text-base px-8 py-4 rounded-full hover:bg-white/20 transition-all">
                    تصفح التدريبات
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== 3. شريط الإحصاءات ===== */}
      {L.sections.stats && stats.length > 0 && (
        <section className="bg-ruwad-blue relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
          <div className="relative max-w-6xl mx-auto px-5 py-12">
            <div className={`grid gap-8 ${stats.length === 2 ? 'grid-cols-2' : stats.length >= 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                    <StatIcon icon={s.icon} />
                  </div>
                  <div>
                    <p className="text-4xl sm:text-5xl font-black text-white">{s.value}</p>
                    <p className="text-sm text-white/70 mt-1 font-semibold">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 4. التدريبات ===== */}
      {L.sections.courses && (
        <section id="courses" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 text-ruwad-blue font-black text-sm uppercase tracking-widest mb-3">
                <BookOpen size={16} /> تدريباتنا
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-ruwad-navy">التدريبات المتاحة</h2>
              <p className="text-gray-500 mt-3 max-w-lg mx-auto">اختر البرنامج التدريبي الأنسب لك وابدأ رحلتك نحو الاحتراف</p>
            </div>
            {!courses || courses.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 font-semibold">لا توجد تدريبات منشورة حالياً — تابعنا قريباً</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((c) => {
                  const price = fmtPrice(c.price as number | null, c.currency as string)
                  return (
                    <Link key={c.id} href={`/land/${c.id}`}
                      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      {/* غلاف ملوّن */}
                      <div className="h-36 bg-ruwad-gradient relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 opacity-20"
                          style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                        <GraduationCap size={48} className="text-white/30" />
                        {price && (
                          <span className="absolute top-3 left-3 bg-ruwad-lime text-ruwad-navy font-black text-xs px-3 py-1.5 rounded-full shadow">
                            {price}
                          </span>
                        )}
                      </div>
                      <div className="p-5 flex flex-col gap-2 flex-1">
                        <h3 className="font-black text-ruwad-navy text-base leading-snug group-hover:text-ruwad-blue transition-colors line-clamp-2">
                          {c.title}
                        </h3>
                        {c.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{c.description}</p>
                        )}
                        <div className="mt-auto pt-3 flex items-center justify-between">
                          <span className="text-xs font-black text-ruwad-blue flex items-center gap-1">
                            التفاصيل والتسجيل <ArrowLeft size={13} />
                          </span>
                          <CheckCircle size={16} className="text-green-400" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== 5. من نحن ===== */}
      {L.sections.about && (L.about.body || portal.institute_description) && (
        <section id="about" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-14 items-center">
            <div className="order-2 md:order-1">
              <span className="inline-flex items-center gap-2 text-ruwad-blue font-black text-sm uppercase tracking-widest mb-4">
                <Users size={16} /> من نحن
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-ruwad-navy mb-5 leading-tight">
                {L.about.title || 'تعرّف على معهدنا'}
              </h2>
              <p className="text-gray-600 leading-loose whitespace-pre-wrap text-base">{L.about.body || portal.institute_description}</p>
              <Link href={`/register?portal=${portal.portal_id}`}
                className="inline-flex items-center gap-2 mt-8 bg-ruwad-navy text-white font-black px-6 py-3.5 rounded-full hover:opacity-90 transition-all">
                انضم إلينا <ChevronLeft size={16} />
              </Link>
            </div>
            <div className="order-1 md:order-2">
              {L.about.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={L.about.image_url} alt=""
                  className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]" />
              ) : (
                <div className="rounded-3xl bg-ruwad-gradient h-72 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
                  <GraduationCap size={80} className="text-white/40" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== 6. آراء الطلاب ===== */}
      {L.sections.testimonials && testimonials.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 text-ruwad-blue font-black text-sm uppercase tracking-widest mb-3">
                <Star size={16} /> شهادات
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-ruwad-navy">ماذا قال طلابنا</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(0, 6).map((t, i) => (
                <figure key={i}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
                  {/* نجوم ثابتة */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => <Star key={j} size={14} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <blockquote className="text-gray-700 leading-loose text-sm flex-1">"{t.text}"</blockquote>
                  <figcaption className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    {t.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.avatar_url} alt={t.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-ruwad-blue/20" />
                    ) : (
                      <span className="w-11 h-11 rounded-full bg-ruwad-gradient text-white flex items-center justify-center font-black text-base shrink-0">
                        {t.name.charAt(0) || '؟'}
                      </span>
                    )}
                    <span>
                      <span className="block font-black text-ruwad-navy text-sm">{t.name}</span>
                      {t.role && <span className="block text-xs text-gray-400">{t.role}</span>}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 7. آخر الأخبار ===== */}
      {L.sections.news && (news?.length ?? 0) > 0 && (
        <section id="news" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 text-ruwad-blue font-black text-sm uppercase tracking-widest mb-3">
                <Newspaper size={16} /> أخبار
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-ruwad-navy">آخر الأخبار والتحديثات</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {(news ?? []).map((n, i) => (
                <article key={n.id}
                  className={`rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${i === 0 ? 'bg-ruwad-navy text-white' : 'bg-white'}`}>
                  <div className="p-6 flex flex-col gap-3 h-full">
                    <time className={`text-xs font-black ${i === 0 ? 'text-ruwad-lime' : 'text-ruwad-blue'}`}>
                      {new Date(n.created_at).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </time>
                    <p className={`text-sm leading-loose line-clamp-5 flex-1 ${i === 0 ? 'text-white/85' : 'text-gray-600'}`}>
                      {n.content}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 8. البانر الختامي CTA ===== */}
      {L.sections.cta && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-5">
            <div className="relative overflow-hidden rounded-3xl bg-ruwad-gradient p-12 sm:p-16 text-center">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
              <div className="relative">
                <Sparkles size={32} className="text-ruwad-lime mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                  {L.cta.title || `ابدأ رحلتك مع ${name}`}
                </h2>
                {L.cta.subtitle && (
                  <p className="text-white/75 max-w-lg mx-auto mb-8 leading-relaxed">{L.cta.subtitle}</p>
                )}
                <Link href={`/register?portal=${portal.portal_id}`}
                  className="inline-flex items-center gap-2 bg-ruwad-lime text-ruwad-navy font-black text-lg px-10 py-4 rounded-full hover:opacity-90 transition-all shadow-2xl hover:-translate-y-0.5">
                  {L.cta.button_text || 'سجّل الآن مجاناً'} <ChevronLeft size={20} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== 9. نموذج الاستفسار ===== */}
      {L.sections.inquiry && (
        <section id="inquiry" className="py-20 bg-white">
          <div className="max-w-2xl mx-auto px-5">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 text-ruwad-blue font-black text-sm uppercase tracking-widest mb-3">
                <MessageCircleQuestion size={16} /> تواصل
              </span>
              <h2 className="text-3xl font-black text-ruwad-navy">استفسر الآن</h2>
              <p className="text-gray-500 mt-2">اترك بياناتك وسيتواصل معك فريقنا في أقرب وقت</p>
            </div>
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <InquiryForm instituteId={portal.institute_id} portalId={portal.portal_id}
                courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title }))} />
            </div>
          </div>
        </section>
      )}

      {/* ===== 10. الفوتر ===== */}
      <footer className="bg-ruwad-navy text-white">
        <div className="max-w-6xl mx-auto px-5 py-14 grid sm:grid-cols-3 gap-10">
          <div>
            {(brand.logo_url || portal.institute_logo) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url || portal.institute_logo!} alt={name}
                className="h-10 w-auto mb-4 object-contain brightness-0 invert" />
            ) : (
              <p className="font-black text-xl mb-3">{name}</p>
            )}
            <p className="text-white/50 text-sm leading-loose line-clamp-4">{portal.institute_description ?? ''}</p>
            {socials.length > 0 && (
              <div className="flex items-center gap-3 mt-5">
                {socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-ruwad-blue flex items-center justify-center transition-colors">
                    <s.icon size={15} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="font-black mb-5 text-white">روابط سريعة</p>
            <ul className="flex flex-col gap-3 text-sm text-white/50">
              {L.sections.courses && <li><a href="#courses" className="hover:text-white transition-colors">التدريبات المتاحة</a></li>}
              {L.sections.about && <li><a href="#about" className="hover:text-white transition-colors">من نحن</a></li>}
              <li><Link href={`/register?portal=${portal.portal_id}`} className="hover:text-white transition-colors">تسجيل طالب جديد</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">تسجيل الدخول</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-black mb-5 text-white">تواصل معنا</p>
            <ul className="flex flex-col gap-3 text-sm text-white/50">
              {(f.address || portal.institute_address) && (
                <li className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-ruwad-lime mt-0.5 shrink-0" />
                  {f.address || portal.institute_address}
                </li>
              )}
              {f.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone size={15} className="text-ruwad-lime shrink-0" />
                  <span dir="ltr">{f.phone}</span>
                </li>
              )}
              {f.email && (
                <li className="flex items-center gap-2.5">
                  <Mail size={15} className="text-ruwad-lime shrink-0" />
                  <span dir="ltr">{f.email}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-5">
          <p className="text-center text-xs text-white/30">
            © {new Date().getFullYear()} {name} — جميع الحقوق محفوظة ·{' '}
            مدعوم بـ <a href="https://www.ruwaad.app" className="font-bold text-white/50 hover:text-white transition-colors">رُوّاد</a>
          </p>
        </div>
      </footer>
    </main>
  )
}
