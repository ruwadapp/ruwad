import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { brandStyle, type PortalInfo } from '@/lib/portal/resolve'
import { mergeLanding } from '@/lib/portal/landing'
import { HeroSlider } from '@/components/portal/HeroSlider'
import { InquiryForm } from '@/components/portal/InquiryForm'
import {
  GraduationCap, MapPin, ArrowLeft, BookOpen, MessageCircleQuestion, Newspaper, Quote,
  Phone, Mail, Facebook, Instagram, Youtube, Send, MessageCircle,
} from 'lucide-react'

// الصفحة العامة لبوابة المعهد — landing page تسويقية كاملة بهويته البصرية
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
      portal_id: string; institute_id: string; brand: PortalInfo['brand']; landing: unknown
      institute_name: string; institute_description: string | null
      institute_logo: string | null; institute_address: string | null
    }>()
  if (!portal) notFound()

  const L = mergeLanding(portal.landing)
  const brand = portal.brand ?? {}
  const name = brand.display_name || portal.institute_name

  // ===== كورسات المعهد المنشورة (المشارَكة معه) =====
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

  // ===== إحصاءات حية (إن كان القسم ظاهراً بوضع auto) =====
  let liveStats: { label: string; value: string }[] = []
  if (L.sections.stats && L.stats.auto) {
    const [{ count: studentsCount }, certsRes] = await Promise.all([
      supabase.from('institute_members').select('id', { count: 'exact', head: true })
        .eq('institute_id', portal.institute_id).eq('status', 'approved'),
      courseIds.length
        ? supabase.from('certificates').select('id', { count: 'exact', head: true }).in('course_id', courseIds)
        : Promise.resolve({ count: 0 }),
    ])
    liveStats = [
      { label: 'تدريب متاح', value: `${courses?.length ?? 0}` },
      { label: 'طالب في المعهد', value: `${studentsCount ?? 0}` },
      { label: 'شهادة صادرة', value: `${(certsRes as { count: number | null }).count ?? 0}` },
    ]
  }
  const stats = L.stats.auto ? liveStats : L.stats.manual.filter((m) => m.label && m.value)

  // ===== آخر منشورات المعهد كأخبار =====
  const { data: news } = L.sections.news
    ? await supabase.from('trainer_posts')
        .select('id, content, created_at')
        .eq('institute_id', portal.institute_id)
        .order('created_at', { ascending: false }).limit(3)
    : { data: [] }

  const heroHeadline = L.hero.headline || name
  const heroTagline = L.hero.tagline || portal.institute_description || 'تدريبات احترافية بشهادات موثّقة — سجّل وابدأ رحلتك.'
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

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F8FC]" style={brandStyle(brand)}>
      {/* ===== 1. شريط التنقل ===== */}
      <nav className="bg-white/95 backdrop-blur sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {(brand.logo_url || portal.institute_logo) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url || portal.institute_logo!} alt={name} className="w-10 h-10 rounded-xl object-contain bg-white shadow-sm shrink-0" />
            ) : (
              <span className="w-10 h-10 rounded-xl bg-ruwad-gradient text-white flex items-center justify-center shrink-0"><GraduationCap size={20} /></span>
            )}
            <span className="font-extrabold text-ruwad-navy truncate">{name}</span>
          </div>
          <div className="hidden md:flex items-center gap-5 text-sm font-semibold text-ruwad-navy/60 mr-auto">
            {L.sections.courses && <a href="#courses" className="hover:text-ruwad-blue transition">التدريبات</a>}
            {L.sections.about && <a href="#about" className="hover:text-ruwad-blue transition">من نحن</a>}
            {L.sections.news && (news?.length ?? 0) > 0 && <a href="#news" className="hover:text-ruwad-blue transition">الأخبار</a>}
            {L.sections.inquiry && <a href="#inquiry" className="hover:text-ruwad-blue transition">تواصل</a>}
          </div>
          <div className="flex items-center gap-2 mr-auto md:mr-0">
            <Link href="/login" className="text-sm font-bold text-ruwad-navy/70 hover:text-ruwad-blue transition px-3 py-2">دخول</Link>
            <Link href={`/register?portal=${portal.portal_id}`} className="bg-ruwad-blue text-white text-sm font-extrabold px-4 py-2 rounded-ruwad-sm hover:opacity-90 transition">
              سجّل كطالب
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== 2. الهيرو + السلايدر ===== */}
      {L.sections.hero && (
        <header className="relative bg-ruwad-gradient text-white overflow-hidden">
          <HeroSlider images={L.hero.slides} intervalS={L.hero.slide_interval_s} />
          <div className="relative z-10 max-w-6xl mx-auto px-5 py-20 sm:py-28 flex flex-col items-start gap-5">
            <h1 className="text-3xl sm:text-5xl font-black leading-tight max-w-2xl">{heroHeadline}</h1>
            <p className="max-w-xl text-white/85 leading-relaxed sm:text-lg">{heroTagline}</p>
            {portal.institute_address && (
              <p className="flex items-center gap-1.5 text-sm text-white/70"><MapPin size={14} /> {portal.institute_address}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2">
              <Link href={`/register?portal=${portal.portal_id}`}
                className="bg-ruwad-lime text-ruwad-navy font-extrabold px-7 py-3.5 rounded-ruwad-sm hover:opacity-90 transition shadow-lg">
                {L.hero.cta_text || 'سجّل الآن'}
              </Link>
              {L.sections.courses && (
                <a href="#courses" className="bg-white/15 backdrop-blur text-white font-bold px-7 py-3.5 rounded-ruwad-sm hover:bg-white/25 transition">
                  تصفح التدريبات
                </a>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ===== 3. شريط الإحصاءات ===== */}
      {L.sections.stats && stats.length > 0 && (
        <section className="bg-ruwad-blue text-white">
          <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-3 gap-4 text-center">
            {stats.slice(0, 4).map((s, i) => (
              <div key={i}>
                <p className="text-2xl sm:text-4xl font-black">{s.value}</p>
                <p className="text-xs sm:text-sm text-white/75 mt-1 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== 4. التدريبات ===== */}
      {L.sections.courses && (
        <section id="courses" className="max-w-6xl mx-auto px-5 py-14">
          <h2 className="text-2xl font-extrabold text-ruwad-navy mb-7 flex items-center gap-2">
            <BookOpen size={22} className="text-ruwad-blue" /> التدريبات المتاحة
          </h2>
          {!courses || courses.length === 0 ? (
            <p className="text-ruwad-navy/50 bg-white rounded-ruwad p-8 text-center shadow-card">
              لا توجد تدريبات منشورة حالياً — تابعنا قريباً.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c) => {
                const price = fmtPrice(c.price as number | null, c.currency as string)
                return (
                  <Link key={c.id} href={`/land/${c.id}`}
                    className="group bg-white rounded-ruwad shadow-card overflow-hidden flex flex-col hover:shadow-ruwad-lg hover:-translate-y-0.5 transition-all">
                    <div className="h-1.5 bg-ruwad-gradient" />
                    <div className="p-5 flex flex-col gap-2 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-ruwad-navy group-hover:text-ruwad-blue transition-colors line-clamp-2 flex-1">{c.title}</h3>
                        {price && (
                          <span className="shrink-0 text-xs font-extrabold bg-ruwad-lime/40 text-ruwad-navy rounded-full px-2.5 py-1">{price}</span>
                        )}
                      </div>
                      {c.description && <p className="text-sm text-ruwad-navy/55 line-clamp-2 leading-relaxed">{c.description}</p>}
                      <span className="mt-auto pt-2 text-xs font-extrabold text-ruwad-blue flex items-center gap-1">
                        التفاصيل والتسجيل <ArrowLeft size={13} />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ===== 5. من نحن ===== */}
      {L.sections.about && (L.about.body || portal.institute_description) && (
        <section id="about" className="bg-white">
          <div className="max-w-6xl mx-auto px-5 py-14 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-ruwad-navy mb-4">{L.about.title || 'من نحن'}</h2>
              <p className="text-ruwad-navy/65 leading-relaxed whitespace-pre-wrap">{L.about.body || portal.institute_description}</p>
            </div>
            {L.about.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={L.about.image_url} alt="" className="rounded-ruwad shadow-ruwad-lg w-full object-cover max-h-80" />
            ) : (
              <div className="hidden md:flex items-center justify-center rounded-ruwad bg-ruwad-gradient h-64 text-white">
                <GraduationCap size={72} className="opacity-60" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== 6. آخر الأخبار ===== */}
      {L.sections.news && (news?.length ?? 0) > 0 && (
        <section id="news" className="max-w-6xl mx-auto px-5 py-14">
          <h2 className="text-2xl font-extrabold text-ruwad-navy mb-7 flex items-center gap-2">
            <Newspaper size={22} className="text-ruwad-blue" /> آخر الأخبار
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {(news ?? []).map((n) => (
              <article key={n.id} className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
                <time className="text-[11px] font-bold text-ruwad-blue">
                  {new Date(n.created_at).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
                <p className="text-sm text-ruwad-navy/75 leading-relaxed line-clamp-4 whitespace-pre-wrap">{n.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ===== 7. آراء طلابنا ===== */}
      {L.sections.testimonials && testimonials.length > 0 && (
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-5 py-14">
            <h2 className="text-2xl font-extrabold text-ruwad-navy mb-7 flex items-center gap-2">
              <Quote size={22} className="text-ruwad-blue" /> آراء طلابنا
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonials.slice(0, 6).map((t, i) => (
                <figure key={i} className="bg-[#F7F8FC] rounded-ruwad p-5 flex flex-col gap-3">
                  <Quote size={18} className="text-ruwad-blue/40" />
                  <blockquote className="text-sm text-ruwad-navy/75 leading-relaxed flex-1">{t.text}</blockquote>
                  <figcaption className="flex items-center gap-2.5">
                    {t.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center font-bold text-sm">{t.name.charAt(0) || '؟'}</span>
                    )}
                    <span>
                      <span className="block text-sm font-bold text-ruwad-navy">{t.name}</span>
                      {t.role && <span className="block text-[11px] text-ruwad-navy/45">{t.role}</span>}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 8. البانر الختامي ===== */}
      {L.sections.cta && (
        <section className="max-w-6xl mx-auto px-5 py-14">
          <div className="relative overflow-hidden bg-ruwad-navy rounded-ruwad shadow-ruwad-lg px-7 py-12 text-white text-center">
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-blue/30 rounded-full blur-3xl" />
            <h2 className="relative text-2xl sm:text-3xl font-black">{L.cta.title || `ابدأ رحلتك مع ${name}`}</h2>
            {L.cta.subtitle && <p className="relative text-white/75 mt-3 max-w-xl mx-auto leading-relaxed">{L.cta.subtitle}</p>}
            <Link href={`/register?portal=${portal.portal_id}`}
              className="relative inline-block bg-ruwad-lime text-ruwad-navy font-extrabold px-8 py-3.5 rounded-ruwad-sm hover:opacity-90 transition mt-6">
              {L.cta.button_text || 'ابدأ رحلتك التدريبية'}
            </Link>
          </div>
        </section>
      )}

      {/* ===== 9. استفسر الآن ===== */}
      {L.sections.inquiry && (
        <section id="inquiry" className="max-w-2xl mx-auto px-5 pb-14">
          <h2 className="text-xl font-extrabold text-ruwad-navy mb-2 flex items-center gap-2">
            <MessageCircleQuestion size={20} className="text-ruwad-blue" /> استفسر الآن
          </h2>
          <p className="text-sm text-ruwad-navy/55 mb-4">اترك اسمك ورقمك وسيتواصل معك المعهد مباشرة.</p>
          <InquiryForm instituteId={portal.institute_id} portalId={portal.portal_id}
            courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title }))} />
        </section>
      )}

      {/* ===== 10. الفوتر ===== */}
      <footer className="bg-ruwad-navy text-white">
        <div className="max-w-6xl mx-auto px-5 py-10 grid sm:grid-cols-3 gap-8">
          <div>
            <p className="font-extrabold text-lg mb-2">{name}</p>
            <p className="text-sm text-white/60 leading-relaxed line-clamp-4">{portal.institute_description ?? ''}</p>
            {socials.length > 0 && (
              <div className="flex items-center gap-2.5 mt-4">
                {socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                    <s.icon size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="font-bold mb-3 text-white/85">روابط سريعة</p>
            <ul className="flex flex-col gap-2 text-sm text-white/55">
              {L.sections.courses && <li><a href="#courses" className="hover:text-white transition">التدريبات</a></li>}
              {L.sections.about && <li><a href="#about" className="hover:text-white transition">من نحن</a></li>}
              <li><Link href={`/register?portal=${portal.portal_id}`} className="hover:text-white transition">التسجيل كطالب</Link></li>
              <li><Link href="/login" className="hover:text-white transition">تسجيل الدخول</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-3 text-white/85">تواصل معنا</p>
            <ul className="flex flex-col gap-2.5 text-sm text-white/55">
              {(f.address || portal.institute_address) && <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" /> {f.address || portal.institute_address}</li>}
              {f.phone && <li className="flex items-center gap-2"><Phone size={14} className="shrink-0" /> <span dir="ltr">{f.phone}</span></li>}
              {f.email && <li className="flex items-center gap-2"><Mail size={14} className="shrink-0" /> <span dir="ltr">{f.email}</span></li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {name} — جميع الحقوق محفوظة · مدعوم من <span className="font-bold text-white/60">رُوّاد</span>
        </div>
      </footer>
    </main>
  )
}
