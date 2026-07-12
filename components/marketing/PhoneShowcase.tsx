'use client'
import { useState } from 'react'
import { ChevronRight, ChevronLeft, GraduationCap, Flame, Award, QrCode } from 'lucide-react'

// محتوى نائب (Placeholder) — استبدله بصور/نصوص حقيقية لاحقاً بسهولة
const SLIDES = [
  {
    badge: 'المحاضرات',
    title: 'كل موادّك في مكان واحد',
    desc: 'فيديو، مرفقات، وعروض تقديمية — يتابع الطالب تقدّمه محاضرة بمحاضرة.',
    bg: 'bg-ruwad-gradient',
    icon: GraduationCap,
  },
  {
    badge: 'التحديات الحيّة',
    title: 'مسابقة حقيقية بين طلابك',
    desc: 'سؤال واحد، توقيت مشترك، والأسرع في الإجابة الصحيحة يتصدّر اللوحة فوراً.',
    bg: 'bg-ruwad-navy',
    icon: Flame,
  },
  {
    badge: 'الشهادات',
    title: 'إنجاز يُوثَّق ويُشارَك',
    desc: 'شهادة أنيقة برمز QR تُصدَر تلقائياً وتُنشر في الرواق فور الإتمام.',
    bg: 'bg-ruwad-blue',
    icon: Award,
  },
  {
    badge: 'الحضور',
    title: 'تسجيل حضور بلمسة واحدة',
    desc: 'كود من 6 أرقام، وموافقة فورية من شاشة المدرب — بلا أوراق.',
    bg: 'bg-ruwad-navy',
    icon: QrCode,
  },
]

export function PhoneShowcase() {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]

  function next() { setIndex((i) => (i + 1) % SLIDES.length) }
  function prev() { setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length) }

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
      {/* السهم الأيمن (السابق بالعربي RTL) */}
      <button
        onClick={prev}
        aria-label="السابق"
        className="hidden lg:flex w-12 h-12 rounded-full bg-white border-2 border-ruwad-navy shadow-hard-sm hover-pop items-center justify-center shrink-0"
      >
        <ChevronRight size={22} className="text-ruwad-navy" />
      </button>

      {/* موك أب الهاتف */}
      <div className="relative w-[240px] sm:w-[270px] shrink-0">
        <div className="bg-ruwad-navy rounded-[2.5rem] border-2 border-ruwad-navy shadow-hard p-3">
          <div className="w-24 h-5 bg-ruwad-navy rounded-full mx-auto mb-2 relative z-10 -mt-1" />
          <div className={`${slide.bg} rounded-[1.8rem] aspect-[9/19] flex flex-col items-center justify-center gap-4 p-6 text-center transition-colors duration-300 relative overflow-hidden`}>
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-xl" />
            <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur flex items-center justify-center border-2 border-white/30">
              <slide.icon size={28} className="text-white" />
            </div>
            <span className="text-white/70 text-[11px] font-bold">تمثيل توضيحي</span>
          </div>
        </div>
        {/* زر جانبي زخرفي */}
        <div className="absolute top-20 -right-1 w-1 h-10 bg-ruwad-navy rounded-full" />
      </div>

      {/* السهم الأيسر (التالي) + المحتوى */}
      <div className="flex flex-col items-center lg:items-start gap-5 max-w-sm text-center lg:text-right">
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            aria-label="السابق"
            className="lg:hidden w-10 h-10 rounded-full bg-white border-2 border-ruwad-navy shadow-hard-sm flex items-center justify-center"
          >
            <ChevronRight size={18} className="text-ruwad-navy" />
          </button>
          <span className="inline-block bg-ruwad-lime text-ruwad-navy text-xs font-extrabold px-4 py-1.5 rounded-full border-2 border-ruwad-navy">
            {slide.badge}
          </span>
          <button
            onClick={next}
            aria-label="التالي"
            className="lg:hidden w-10 h-10 rounded-full bg-white border-2 border-ruwad-navy shadow-hard-sm flex items-center justify-center"
          >
            <ChevronLeft size={18} className="text-ruwad-navy" />
          </button>
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold text-ruwad-navy leading-snug">{slide.title}</h3>
        <p className="text-ruwad-navy/60 leading-relaxed">{slide.desc}</p>

        <div className="flex items-center gap-2 mt-1">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`الشريحة ${i + 1}`}
              className={`h-2.5 rounded-full border-2 border-ruwad-navy transition-all ${i === index ? 'w-7 bg-ruwad-lime' : 'w-2.5 bg-white'}`}
            />
          ))}
        </div>
      </div>

      <button
        onClick={next}
        aria-label="التالي"
        className="hidden lg:flex w-12 h-12 rounded-full bg-white border-2 border-ruwad-navy shadow-hard-sm hover-pop items-center justify-center shrink-0"
      >
        <ChevronLeft size={22} className="text-ruwad-navy" />
      </button>
    </div>
  )
}
