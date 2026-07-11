import Link from 'next/link'
import {
  BookOpen, FileCheck2, Flame, Award, QrCode, Users2, Bell, Download,
  CheckCircle2, MessageCircle, Mail, ArrowLeft, Sparkles,
} from 'lucide-react'
import { LandingNav } from './LandingNav'
import { HeroMockupCollage } from './HeroMockupCollage'
import { LiveQuizDemo } from './LiveQuizDemo'
import { Reveal } from './Reveal'

const FEATURES = [
  { icon: BookOpen, title: 'كورسات ومحاضرات', desc: 'فيديو، مرفقات، وعروض تقديمية — وتتبّع تلقائي لتقدّم كل طالب.', big: false },
  { icon: FileCheck2, title: 'امتحانات ذكية', desc: 'أربعة أنواع أسئلة، وتصحيح تلقائي فوري بدون أي جهد يدوي.', big: false },
  { icon: Flame, title: 'تحديات حيّة بأسلوب Kahoot', desc: 'كل الطلاب يتنافسون بنفس اللحظة — سؤال واحد، توقيت مشترك، والأسرع في الإجابة الصحيحة يتصدّر اللوحة فوراً.', big: true },
  { icon: Award, title: 'شهادات موثّقة', desc: 'تصميم أنيق برمز QR، تُصدَر وتُشارَك تلقائياً عند الإنجاز.', big: false },
  { icon: QrCode, title: 'حضور بلمسة واحدة', desc: 'كود جلسة من 6 أرقام، وموافقة فورية من شاشة المدرب.', big: false },
  { icon: Users2, title: 'الرواق الاجتماعي', desc: 'مساحة تفاعل بين المدرب وطلابه — منشورات وتفاعلات حقيقية.', big: false },
  { icon: Bell, title: 'إشعارات لحظية', desc: 'لا يفوت أي طالب موعد امتحان أو تحديث مهم بعد الآن.', big: false },
  { icon: Download, title: 'تقارير جاهزة', desc: 'صدّر نتائج أي امتحان أو تحدٍّ إلى Excel بضغطة واحدة.', big: false },
]

const TICKER_ITEMS = ['امتحانات تُصحَّح نفسها', 'تحديات حيّة', 'شهادات موثّقة بـQR', 'حضور بلمسة واحدة', 'تقارير Excel جاهزة', 'إشعارات لحظية']

const STEPS = [
  { title: 'أنشئ حسابك', desc: 'تسجيل مجاني خلال أقل من دقيقة، بلا بطاقة ائتمان.' },
  { title: 'صمّم تدريبك', desc: 'محاضرات، امتحانات، وتحديات — كلها بواجهة عربية سهلة.' },
  { title: 'شارك رابطك', desc: 'صفحة تسويقية جاهزة تلقائياً لكل تدريب تنشره.' },
  { title: 'تابع لحظياً', desc: 'حضور، درجات، وتقدّم كل طالب أمامك في لحظتها.' },
]

const PLANS = [
  {
    name: 'مدرب مستقل',
    tagline: 'لمن يبدأ رحلته التدريبية بنفسه',
    features: ['كورس وامتحانات غير محدودة', 'شهادات موثّقة بـQR', 'صفحة تسويقية لكل تدريب', 'تحديات حيّة تفاعلية'],
    highlighted: false,
  },
  {
    name: 'معهد',
    tagline: 'لفريق مدربين تحت مظلة واحدة',
    features: ['كل ميزات المدرب المستقل', 'لوحة تحكم لعدة مدربين', 'مشاركة موارد بين المدربين', 'تقارير أداء شاملة'],
    highlighted: true,
  },
  {
    name: 'معهد كبير',
    tagline: 'لمؤسسات تعليمية بحجم أكبر',
    features: ['كل ميزات خطة المعهد', 'هوية بصرية مخصّصة', 'دعم فني مباشر', 'تكامل حسب الطلب'],
    highlighted: false,
  },
]

const WHATSAPP_NUMBER = '963998285483'

export function LandingPage() {
  return (
    <main dir="rtl" className="bg-white overflow-x-clip">
      <LandingNav />

      {/* ===== HERO ===== */}
      <section className="relative bg-ruwad-gradient animate-hero-glow overflow-hidden pt-32 pb-24 sm:pt-44 sm:pb-40 clip-angle-down">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-80 h-80 bg-ruwad-lime/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-52 h-52 bg-white/10 rounded-full blur-2xl" />
        <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[13vw] sm:text-[9rem] font-extrabold text-white/[0.05] whitespace-nowrap select-none leading-none">
          روّاد روّاد روّاد
        </span>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-start gap-6 text-center lg:text-right mx-auto lg:mx-0">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
              <Sparkles size={13} className="text-ruwad-lime" /> منصة تدريب عربية متكاملة
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[0.98] tracking-tight">
              تدريبك،
              <br />
              بروح <span className="text-ruwad-lime italic">المسابقة</span>
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-md">
              كورسات، امتحانات تُصحَّح نفسها، تحديات حيّة يتنافس فيها طلابك بنفس اللحظة، وشهادات تُشارَك تلقائياً — كل ما يحتاجه المدرب والمعهد في مكان واحد.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link href="/register" className="bg-ruwad-lime text-ruwad-navy font-bold px-8 py-3.5 rounded-ruwad-sm hover:opacity-90 transition shadow-ruwad-lg text-center">
                ابدأ مجاناً الآن
              </Link>
              <a href="#demo" className="flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-ruwad-sm hover:bg-white/10 transition">
                جرّب تحدياً حياً <ArrowLeft size={16} />
              </a>
            </div>
          </div>

          <HeroMockupCollage />
        </div>
      </section>

      {/* ===== TICKER ===== */}
      <div className="bg-ruwad-navy py-3.5 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} className="flex items-center gap-3 text-white/50 text-sm font-semibold px-6 shrink-0">
              {t} <span className="text-ruwad-lime">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ===== FEATURES — BENTO ===== */}
      <section id="features" className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <Reveal className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-bold text-ruwad-blue">كل الأدوات في مكان واحد</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-2">كل جانب من تدريبك، مغطّى</h2>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[180px]">
          {FEATURES.map((f, idx) => (
            <Reveal key={f.title} delay={idx * 60} className={f.big ? 'col-span-2 row-span-2' : 'col-span-1'}>
              <div className={`group relative overflow-hidden rounded-ruwad p-6 h-full flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${
                f.big ? 'bg-ruwad-navy text-white shadow-ruwad-lg' : 'bg-white border border-ruwad-gray/60 text-ruwad-navy hover:shadow-ruwad-lg hover:border-transparent'
              }`}>
                {f.big && <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-ruwad-blue/30 rounded-full blur-3xl" />}
                <div className={`relative w-11 h-11 rounded-ruwad-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${
                  f.big ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-ruwad-gradient text-white'
                }`}>
                  <f.icon size={20} />
                </div>
                <div className="relative">
                  <h3 className={`font-bold mb-1.5 ${f.big ? 'text-xl' : ''}`}>{f.title}</h3>
                  <p className={`text-sm leading-relaxed ${f.big ? 'text-white/70' : 'text-ruwad-navy/60'}`}>{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== SIGNATURE: LIVE DEMO ===== */}
      <section id="demo" className="relative bg-ruwad-navy overflow-hidden py-20 sm:py-28">
        <div className="absolute -top-24 right-0 w-96 h-96 bg-ruwad-blue/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-ruwad-lime/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal className="text-center lg:text-right order-2 lg:order-1">
            <span className="text-xs font-bold text-ruwad-lime">جرّب بنفسك — بدون تسجيل</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 leading-snug">
              الأسرع في الإجابة، يتصدّر اللوحة
            </h2>
            <p className="text-white/70 mt-4 leading-relaxed max-w-md mx-auto lg:mx-0">
              هذا بالضبط ما يعيشه طلابك في كل تحدٍّ حي: سؤال واحد، توقيت مشترك، ونتيجة فورية. جاوب على البطاقة المجاورة وشاهد نقاطك تتغيّر لحظياً.
            </p>
          </Reveal>

          <Reveal delay={150} className="order-1 lg:order-2">
            <LiveQuizDemo />
          </Reveal>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="relative max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <Reveal className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-bold text-ruwad-blue">أربع خطوات فقط</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-2">من التسجيل إلى أول تدريب منشور</h2>
        </Reveal>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          <div className="hidden lg:block absolute top-5 right-[12.5%] left-[12.5%] h-px bg-gradient-to-l from-ruwad-blue via-ruwad-lime to-ruwad-blue opacity-30" />
          {STEPS.map((s, idx) => (
            <Reveal key={s.title} delay={idx * 80}>
              <div className="relative flex flex-col items-center lg:items-start text-center lg:text-right gap-3">
                <span className="relative z-10 w-10 h-10 rounded-full bg-ruwad-gradient text-white flex items-center justify-center font-extrabold text-sm shadow-ruwad shrink-0">
                  {idx + 1}
                </span>
                <h3 className="font-bold text-ruwad-navy text-lg">{s.title}</h3>
                <p className="text-sm text-ruwad-navy/60 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== CERTIFICATE SHOWCASE ===== */}
      <section className="relative bg-[#F5F6FA] bg-dot-grid py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F6FA] via-transparent to-[#F5F6FA] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal className="order-2 lg:order-1 flex justify-center">
            <div className="relative w-full max-w-sm animate-float" style={{ '--tilt': '-3deg' } as React.CSSProperties}>
              <div className="bg-white border-4 border-ruwad-lime rounded-ruwad shadow-ruwad-lg p-8 text-center relative overflow-hidden">
                <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-ruwad-blue/30 rounded-tr-lg" />
                <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-ruwad-blue/30 rounded-bl-lg" />
                <p className="text-xs text-ruwad-navy/40 font-bold tracking-widest">شهادة إتمام</p>
                <p className="text-2xl font-extrabold text-ruwad-navy mt-3">محمد العتيبي</p>
                <div className="w-16 h-px bg-ruwad-gray mx-auto my-3" />
                <p className="text-sm text-ruwad-navy/60">أتمّ بنجاح تدريب</p>
                <p className="font-bold text-ruwad-blue mt-1">أساسيات إدارة المشاريع</p>
                <div className="mt-5 flex items-center justify-center gap-2">
                  <div className="w-10 h-10 bg-ruwad-navy rounded-ruwad-sm grid grid-cols-3 gap-[1px] p-1">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <span key={i} className={`rounded-[1px] ${[0, 2, 4, 6, 8].includes(i) ? 'bg-ruwad-lime' : 'bg-white/20'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-ruwad-navy/40">امسح للتحقق</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100} className="order-1 lg:order-2 text-center lg:text-right">
            <span className="text-xs font-bold text-ruwad-blue">إنجاز يستحق المشاركة</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-2 leading-snug">شهادة موثّقة، تُشارَك من نفسها</h2>
            <p className="text-ruwad-navy/60 mt-4 leading-relaxed max-w-md mx-auto lg:mx-0">
              بمجرد إتمام الطالب لتدريبه بنجاح، تُصدَر شهادته تلقائياً برمز QR للتحقق، وتُنشر في الرواق ليشاركها مع الجميع — بدون أي خطوة إضافية منك.
            </p>
            <ul className="mt-6 flex flex-col gap-2.5 items-center lg:items-start">
              {['تصميم أنيق يحمل هوية تدريبك', 'رمز QR للتحقق من صحة الشهادة', 'نشر تلقائي فور الإصدار'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-ruwad-navy/70">
                  <CheckCircle2 size={16} className="text-ruwad-lime shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ===== PLANS ===== */}
      <section id="plans" className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <Reveal className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-bold text-ruwad-blue">خطط تناسب حجمك</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-2">من مدرب مستقل إلى معهد كامل</h2>
          <p className="text-ruwad-navy/60 mt-3">تواصل معنا لتحديد السعر الأنسب لحجم فريقك — بدون التزامات مخفية.</p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Reveal key={plan.name}>
              <div className={`relative rounded-ruwad p-7 h-full flex flex-col gap-5 transition-transform hover:-translate-y-1.5 ${
                plan.highlighted ? 'bg-ruwad-gradient text-white shadow-ruwad-lg scale-[1.03]' : 'bg-white border border-ruwad-gray/60 text-ruwad-navy shadow-card'
              }`}>
                {plan.highlighted && (
                  <span className="absolute -top-3 right-1/2 translate-x-1/2 bg-ruwad-lime text-ruwad-navy text-[11px] font-bold px-3 py-1 rounded-full">
                    الأكثر طلباً
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-extrabold">{plan.name}</h3>
                  <p className={`text-sm mt-1 ${plan.highlighted ? 'text-white/70' : 'text-ruwad-navy/60'}`}>{plan.tagline}</p>
                </div>
                <ul className="flex flex-col gap-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={16} className={plan.highlighted ? 'text-ruwad-lime' : 'text-ruwad-blue'} /> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`السلام عليكم، أرغب بمعرفة تفاصيل خطة "${plan.name}" في منصة رُوّاد`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className={`text-center font-bold py-3 rounded-ruwad-sm transition ${
                    plan.highlighted ? 'bg-ruwad-lime text-ruwad-navy hover:opacity-90' : 'bg-ruwad-navy text-white hover:opacity-90'
                  }`}
                >
                  تواصل بخصوص هذه الخطة
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== CONTACT / FINAL CTA ===== */}
      <section id="contact" className="relative bg-ruwad-navy overflow-hidden py-20 sm:py-28">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-ruwad-blue/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-ruwad-lime/10 rounded-full blur-3xl" />

        <Reveal className="relative max-w-2xl mx-auto px-5 sm:px-8 text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-snug">جاهز تبدأ تدريبك الأول؟</h2>
          <p className="text-white/70 leading-relaxed">
            انضم مجاناً خلال دقيقة، أو تواصل معنا مباشرة لو عندك أي استفسار قبل البدء.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/register" className="bg-ruwad-lime text-ruwad-navy font-bold px-8 py-3.5 rounded-ruwad-sm hover:opacity-90 transition shadow-ruwad-lg">
              ابدأ مجاناً الآن
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('السلام عليكم، لدي استفسار عن منصة رُوّاد')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-2 border-white/25 text-white font-semibold px-8 py-3.5 rounded-ruwad-sm hover:bg-white/10 transition"
            >
              <MessageCircle size={17} /> تواصل عبر واتساب
            </a>
          </div>
        </Reveal>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#1a1e33] py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-right">
            <p className="text-xl font-extrabold text-white">رُوّاد</p>
            <p className="text-xs text-white/40 mt-1">منصة تدريب تفاعلية بروح المسابقة</p>
          </div>
          <div className="flex items-center gap-5 text-sm text-white/50">
            <a href="#features" className="hover:text-white transition">الميزات</a>
            <a href="#plans" className="hover:text-white transition">الخطط</a>
            <a href={`mailto:hello@ruwad.app`} className="flex items-center gap-1.5 hover:text-white transition">
              <Mail size={14} /> راسلنا
            </a>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} رُوّاد. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </main>
  )
}
