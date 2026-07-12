import Link from 'next/link'
import {
  BookOpen, FileCheck2, Flame, Award, QrCode, Users2, Bell, Download,
  CheckCircle2, MessageCircle, Mail, ArrowLeft, Star,
} from 'lucide-react'
import { LandingNav } from './LandingNav'
import { LiveQuizDemo } from './LiveQuizDemo'
import { PhoneShowcase } from './PhoneShowcase'
import { Reveal } from './Reveal'
import { ParallaxLayer } from './ParallaxLayer'

const FEATURES = [
  { icon: BookOpen, title: 'كورسات ومحاضرات', desc: 'فيديو، مرفقات، وعروض تقديمية — وتتبّع تلقائي لتقدّم كل طالب.', bg: 'bg-white', r: -2 },
  { icon: FileCheck2, title: 'امتحانات ذكية', desc: 'أربعة أنواع أسئلة، وتصحيح تلقائي فوري بدون أي جهد يدوي.', bg: 'bg-ruwad-lime', r: 2 },
  { icon: Flame, title: 'تحديات حيّة', desc: 'كل الطلاب يجاوبون بنفس اللحظة، والأسرع في الإجابة الصحيحة يتصدّر اللوحة فوراً.', bg: 'bg-white', r: 1.5 },
  { icon: Award, title: 'شهادات موثّقة', desc: 'تصميم أنيق برمز QR، تُصدَر وتُشارَك تلقائياً عند الإنجاز.', bg: 'bg-white', r: -1.5 },
  { icon: QrCode, title: 'حضور بلمسة واحدة', desc: 'كود جلسة من 6 أرقام، وموافقة فورية من شاشة المدرب.', bg: 'bg-white', r: 2.5 },
  { icon: Users2, title: 'الرواق الاجتماعي', desc: 'مساحة تفاعل بين المدرب وطلابه — منشورات وتفاعلات حقيقية.', bg: 'bg-ruwad-lime', r: -2 },
  { icon: Bell, title: 'إشعارات لحظية', desc: 'لا يفوت أي طالب موعد امتحان أو تحديث مهم بعد الآن.', bg: 'bg-white', r: 1 },
  { icon: Download, title: 'تقارير جاهزة', desc: 'صدّر نتائج أي امتحان أو تحدٍّ إلى Excel بضغطة واحدة.', bg: 'bg-white', r: -1 },
]

const FACTS = [
  { num: '4', label: 'أنواع أسئلة امتحان' },
  { num: '6', label: 'أنواع أسئلة استبيان' },
  { num: '6', label: 'أرقام كود الحضور فقط' },
  { num: '1', label: 'QR لكل شهادة موثّقة' },
]

const STEPS = [
  { title: 'أنشئ حسابك', desc: 'تسجيل مجاني خلال أقل من دقيقة، بلا بطاقة ائتمان.' },
  { title: 'صمّم تدريبك', desc: 'محاضرات، امتحانات، وتحديات — كلها بواجهة عربية سهلة.' },
  { title: 'شارك رابطك', desc: 'صفحة تسويقية جاهزة تلقائياً لكل تدريب تنشره.' },
  { title: 'تابع لحظياً', desc: 'حضور، درجات، وتقدّم كل طالب أمامك في لحظتها.' },
]

const PLANS = [
  { name: 'مدرب مستقل', tagline: 'لمن يبدأ رحلته بنفسه', features: ['كورس وامتحانات غير محدودة', 'شهادات موثّقة بـQR', 'صفحة تسويقية تلقائية', 'تحديات حيّة تفاعلية'], r: -2, highlighted: false },
  { name: 'معهد', tagline: 'لفريق مدربين تحت مظلة واحدة', features: ['كل ميزات المدرب المستقل', 'لوحة تحكم لعدة مدربين', 'مشاركة موارد بين المدربين', 'تقارير أداء شاملة'], r: 0, highlighted: true },
  { name: 'معهد كبير', tagline: 'لمؤسسات تعليمية أكبر', features: ['كل ميزات خطة المعهد', 'هوية بصرية مخصّصة', 'دعم فني مباشر', 'تكامل حسب الطلب'], r: 2, highlighted: false },
]

const WHATSAPP_NUMBER = '963998285483'

export function LandingPage() {
  return (
    <main dir="rtl" className="bg-white overflow-x-clip">
      <LandingNav />

      {/* ===== HERO — لوحة ملصقات ملوّنة ===== */}
      <section className="relative bg-ruwad-navy overflow-hidden pt-28 pb-24 sm:pt-36 sm:pb-32">
        <ParallaxLayer speed={0.12} className="absolute -top-10 -left-10 w-72 h-72 bg-ruwad-blue/40 rounded-full blur-3xl">
          <div />
        </ParallaxLayer>
        <ParallaxLayer speed={-0.08} className="absolute top-1/3 right-0 w-64 h-64 bg-ruwad-lime/20 rounded-full blur-3xl">
          <div />
        </ParallaxLayer>

        <div className="relative max-w-5xl mx-auto px-5 sm:px-8">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="bg-white text-ruwad-navy text-xs font-extrabold px-3.5 py-2 rounded-full border-2 border-ruwad-navy shadow-hard-sm -rotate-2 inline-flex items-center gap-1">
              <Flame size={12} className="text-red-500" /> تحديات حيّة
            </span>
            <span className="bg-ruwad-lime text-ruwad-navy text-xs font-extrabold px-3.5 py-2 rounded-full border-2 border-ruwad-navy shadow-hard-sm rotate-1">
              تصحيح تلقائي فوري
            </span>
            <span className="bg-ruwad-blue text-white text-xs font-extrabold px-3.5 py-2 rounded-full border-2 border-ruwad-navy shadow-hard-sm -rotate-1">
              شهادات بـQR
            </span>
          </div>

          <h1 className="text-center text-[15vw] sm:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tight">
            <span className="block text-white">تدريبك،</span>
            <span className="block text-ruwad-lime -rotate-1 inline-block my-1">بروح المسابقة</span>
          </h1>

          <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-lg mx-auto text-center mt-6">
            كورسات، امتحانات تُصحَّح نفسها، تحديات حيّة بنفس اللحظة، وشهادات تُشارَك تلقائياً — كل ما يحتاجه المدرب والمعهد في مكان واحد.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-9">
            <Link href="/register" className="bg-ruwad-lime text-ruwad-navy font-extrabold px-9 py-4 rounded-ruwad-sm border-2 border-ruwad-navy shadow-hard hover-pop text-center">
              ابدأ مجاناً الآن
            </Link>
            <a href="#demo" className="flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white font-bold px-9 py-4 rounded-ruwad-sm hover:bg-white hover:text-ruwad-navy transition">
              جرّب تحدياً حياً <ArrowLeft size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ===== PHONE SHOWCASE — تظهر فوراً بدون تمرير ===== */}
      <section className="bg-white py-10 sm:py-14 border-b-2 border-ruwad-navy">
        <div className="text-center max-w-xl mx-auto mb-8 px-5">
          <span className="inline-block bg-ruwad-navy text-white text-xs font-extrabold px-4 py-1.5 rounded-full rotate-1">جولة سريعة</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ruwad-navy mt-3">استعرض الميزات من هاتفك</h2>
        </div>
        <PhoneShowcase />
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="bg-ruwad-lime border-y-2 border-ruwad-navy py-3 overflow-hidden -rotate-1 scale-105">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(2)].flatMap((_, dup) =>
            ['امتحانات تُصحَّح نفسها', 'تحديات حيّة', 'شهادات موثّقة بـQR', 'حضور بلمسة واحدة', 'تقارير Excel جاهزة'].map((t, i) => (
              <span key={`${dup}-${i}`} className="flex items-center gap-3 text-ruwad-navy text-sm font-extrabold px-6 shrink-0">
                {t} <Star size={12} className="fill-ruwad-navy" />
              </span>
            )),
          )}
        </div>
      </div>

      {/* ===== FEATURES — لوحة ملاحظات مثبّتة ===== */}
      <section id="features" className="bg-[#F5F6FA] bg-dot-grid py-20 sm:py-28">
        <Reveal className="text-center max-w-xl mx-auto mb-16 px-5">
          <span className="inline-block bg-ruwad-navy text-white text-xs font-extrabold px-4 py-1.5 rounded-full -rotate-2">كل الأدوات في مكان واحد</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-4">كل جانب من تدريبك، مغطّى</h2>
        </Reveal>

        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {FEATURES.map((f, idx) => (
            <Reveal key={f.title} delay={idx * 60} rotate={f.r}>
              <div
                className={`${f.bg} border-2 border-ruwad-navy rounded-ruwad p-6 h-full flex flex-col gap-4 shadow-hard hover-pop`}
                style={{ transform: `rotate(${f.r}deg)` }}
              >
                <div className="w-11 h-11 rounded-full bg-ruwad-navy flex items-center justify-center text-white shrink-0">
                  <f.icon size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-ruwad-navy mb-1.5">{f.title}</h3>
                  <p className="text-sm text-ruwad-navy/70 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== SIGNATURE: LIVE DEMO ===== */}
      <section id="demo" className="relative bg-ruwad-blue overflow-hidden py-20 sm:py-28">
        <div className="absolute top-10 left-10 w-40 h-40 border-4 border-white/20 rounded-full" />
        <div className="absolute bottom-10 right-10 w-24 h-24 border-4 border-ruwad-lime/40 rotate-12" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal className="text-center lg:text-right order-2 lg:order-1" rotate={-1}>
            <span className="inline-block bg-ruwad-lime text-ruwad-navy text-xs font-extrabold px-4 py-1.5 rounded-full border-2 border-ruwad-navy">
              جرّب بنفسك — بدون تسجيل
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 leading-snug">
              الأسرع في الإجابة، يتصدّر اللوحة
            </h2>
            <p className="text-white/80 mt-4 leading-relaxed max-w-md mx-auto lg:mx-0">
              هذا بالضبط ما يعيشه طلابك في كل تحدٍّ حي. جاوب على البطاقة المجاورة وشاهد نقاطك تتغيّر لحظياً.
            </p>
          </Reveal>

          <Reveal delay={150} rotate={1.5} className="order-1 lg:order-2">
            <div className="border-2 border-ruwad-navy rounded-ruwad shadow-hard">
              <LiveQuizDemo />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FACTS BAND ===== */}
      <section className="bg-ruwad-navy py-14">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {FACTS.map((f) => (
            <div key={f.label}>
              <p className="text-4xl sm:text-5xl font-extrabold text-ruwad-lime">{f.num}</p>
              <p className="text-xs sm:text-sm text-white/60 mt-1.5">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS — زِكزاك ===== */}
      <section id="how" className="max-w-4xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <Reveal className="text-center mb-16">
          <span className="inline-block bg-ruwad-lime text-ruwad-navy text-xs font-extrabold px-4 py-1.5 rounded-full border-2 border-ruwad-navy rotate-1">أربع خطوات فقط</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-4">من التسجيل إلى أول تدريب منشور</h2>
        </Reveal>

        <div className="flex flex-col gap-8">
          {STEPS.map((s, idx) => (
            <Reveal key={s.title} delay={idx * 90} rotate={idx % 2 === 0 ? -0.6 : 0.6}>
              <div className={`flex items-center gap-5 ${idx % 2 === 1 ? 'sm:flex-row-reverse sm:text-left' : ''}`}>
                <span className="text-6xl sm:text-7xl font-extrabold text-outline-navy shrink-0">{`0${idx + 1}`}</span>
                <div className="bg-white border-2 border-ruwad-navy rounded-ruwad p-5 shadow-hard-sm flex-1">
                  <h3 className="font-extrabold text-ruwad-navy text-lg">{s.title}</h3>
                  <p className="text-sm text-ruwad-navy/60 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== CERTIFICATE — تذكرة ===== */}
      <section className="relative bg-ruwad-lime py-20 sm:py-28 overflow-hidden">
        <div className="absolute -top-16 -left-16 w-64 h-64 border-4 border-ruwad-navy/10 rounded-full" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal className="order-2 lg:order-1 flex justify-center" rotate={-3}>
            <div className="bg-white border-2 border-ruwad-navy rounded-ruwad shadow-hard p-8 text-center relative w-full max-w-sm">
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
          </Reveal>

          <Reveal delay={100} className="order-1 lg:order-2 text-center lg:text-right">
            <span className="inline-block bg-white text-ruwad-navy text-xs font-extrabold px-4 py-1.5 rounded-full border-2 border-ruwad-navy">إنجاز يستحق المشاركة</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-4 leading-snug">شهادة موثّقة، تُشارَك من نفسها</h2>
            <p className="text-ruwad-navy/70 mt-4 leading-relaxed max-w-md mx-auto lg:mx-0">
              بمجرد إتمام الطالب لتدريبه بنجاح، تُصدَر شهادته تلقائياً برمز QR للتحقق، وتُنشر في الرواق ليشاركها مع الجميع.
            </p>
            <ul className="mt-6 flex flex-col gap-2.5 items-center lg:items-start">
              {['تصميم أنيق يحمل هوية تدريبك', 'رمز QR للتحقق من صحة الشهادة', 'نشر تلقائي فور الإصدار'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-ruwad-navy/80 font-medium">
                  <CheckCircle2 size={16} className="text-ruwad-navy shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ===== PLANS ===== */}
      <section id="plans" className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <Reveal className="text-center max-w-xl mx-auto mb-16">
          <span className="inline-block bg-ruwad-navy text-white text-xs font-extrabold px-4 py-1.5 rounded-full -rotate-1">خطط تناسب حجمك</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-4">من مدرب مستقل إلى معهد كامل</h2>
          <p className="text-ruwad-navy/60 mt-3">تواصل معنا لتحديد السعر الأنسب لحجم فريقك — بدون التزامات مخفية.</p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8 md:pt-4">
          {PLANS.map((plan) => (
            <Reveal key={plan.name} rotate={plan.r}>
              <div
                style={{ transform: `rotate(${plan.r}deg)` }}
                className={`relative rounded-ruwad p-7 h-full flex flex-col gap-5 border-2 border-ruwad-navy shadow-hard hover-pop ${
                  plan.highlighted ? 'bg-ruwad-navy text-white md:-translate-y-2' : 'bg-white text-ruwad-navy'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-4 right-1/2 translate-x-1/2 bg-ruwad-lime text-ruwad-navy text-[11px] font-extrabold px-3 py-1.5 rounded-full border-2 border-ruwad-navy rotate-2">
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
                  className={`text-center font-extrabold py-3 rounded-ruwad-sm border-2 border-ruwad-navy transition ${
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

      {/* ===== CONTACT ===== */}
      <section id="contact" className="relative bg-ruwad-navy overflow-hidden py-20 sm:py-28">
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-ruwad-blue/30 rounded-full blur-3xl" />

        <Reveal className="relative max-w-2xl mx-auto px-5 sm:px-8 text-center flex flex-col items-center gap-6">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-snug">جاهز تبدأ تدريبك الأول؟</h2>
          <p className="text-white/70 leading-relaxed">انضم مجاناً خلال دقيقة، أو تواصل معنا مباشرة لو عندك أي استفسار.</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/register" className="bg-ruwad-lime text-ruwad-navy font-extrabold px-9 py-4 rounded-ruwad-sm border-2 border-ruwad-navy shadow-hard-lime hover-pop">
              ابدأ مجاناً الآن
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('السلام عليكم، لدي استفسار عن منصة رُوّاد')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-9 py-4 rounded-ruwad-sm hover:bg-white hover:text-ruwad-navy transition"
            >
              <MessageCircle size={17} /> تواصل عبر واتساب
            </a>
          </div>
        </Reveal>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-ruwad-lime border-t-2 border-ruwad-navy py-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-center sm:text-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="رُوّاد" className="w-9 h-9 rounded-full border-2 border-ruwad-navy" />
            <div>
              <p className="text-xl font-extrabold text-ruwad-navy">رُوّاد</p>
              <p className="text-xs text-ruwad-navy/60 mt-0.5">منصة تدريب تفاعلية بروح المسابقة</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-sm text-ruwad-navy/70 font-semibold">
            <a href="#features" className="hover:text-ruwad-navy transition">الميزات</a>
            <a href="#plans" className="hover:text-ruwad-navy transition">الخطط</a>
            <a href="mailto:hello@ruwad.app" className="flex items-center gap-1.5 hover:text-ruwad-navy transition">
              <Mail size={14} /> راسلنا
            </a>
          </div>
          <p className="text-xs text-ruwad-navy/50">© {new Date().getFullYear()} رُوّاد. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </main>
  )
}
