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

export function PhoneShowcase({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]

  function next() { setIndex((i) => (i + 1) % SLIDES.length) }
  function prev() { setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length) }

  return (
    <div className={`flex ${compact ? 'flex-col' : 'flex-col lg:flex-row'} items-center justify-center gap-6`}>
      {/* السهم الأيمن (السابق بالعربي RTL) */}
      <button
        onClick={prev}
        aria-label="السابق"
        className={`${compact ? 'hidden' : 'hidden lg:flex'} w-11 h-11 rounded-full ${dark ? 'bg-ruwad-navy border-white' : 'bg-white border-ruwad-navy'} border-2 shadow-hard-sm hover-pop items-center justify-center shrink-0`}
      >
        <ChevronRight size={20} className={dark ? 'text-white' : 'text-ruwad-navy'} />
      </button>

      {/* موك أب الهاتف */}
      <div className={`relative ${compact ? 'w-[190px] sm:w-[210px]' : 'w-[240px] sm:w-[270px]'} shrink-0`}>
        <div className={`${dark ? 'bg-ruwad-navy border-white' : 'bg-ruwad-navy border-ruwad-navy'} rounded-[2.5rem] border-2 shadow-hard p-3`}>
          <div className="w-24 h-5 bg-ruwad-navy rounded-full mx-auto mb-2 relative z-10 -mt-1" />
          <div className={`${slide.bg} rounded-[1.8rem] aspect-[9/19] flex flex-col items-center justify-center gap-4 p-6 text-center transition-colors duration-300 relative overflow-hidden`}>
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-xl" />
            <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur flex items-center justify-center border-2 border-white/30">
              <slide.icon size={28} className="text-white" />
            </div>
            <span className="text-white/70 text-[11px] font-bold">تمثيل توضيحي</span>
          </div>
        </div>
      </div>

      {/* السهم الأيسر (التالي) + المحتوى */}
      <div className={`flex flex-col items-center ${compact ? '' : 'lg:items-start'} gap-4 max-w-sm text-center ${compact ? '' : 'lg:text-right'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            aria-label="السابق"
            className={`${compact ? 'flex' : 'lg:hidden flex'} w-9 h-9 rounded-full ${dark ? 'bg-ruwad-navy border-white' : 'bg-white border-ruwad-navy'} border-2 shadow-hard-sm items-center justify-center`}
          >
            <ChevronRight size={16} className={dark ? 'text-white' : 'text-ruwad-navy'} />
          </button>
          <span className="inline-block bg-ruwad-lime text-ruwad-navy text-xs font-extrabold px-3.5 py-1.5 rounded-full border-2 border-ruwad-navy">
            {slide.badge}
          </span>
          <button
            onClick={next}
            aria-label="التالي"
            className={`${compact ? 'flex' : 'lg:hidden flex'} w-9 h-9 rounded-full ${dark ? 'bg-ruwad-navy border-white' : 'bg-white border-ruwad-navy'} border-2 shadow-hard-sm items-center justify-center`}
          >
            <ChevronLeft size={16} className={dark ? 'text-white' : 'text-ruwad-navy'} />
          </button>
        </div>

        <h3 className={`text-xl sm:text-2xl font-extrabold leading-snug ${dark ? 'text-white' : 'text-ruwad-navy'}`}>{slide.title}</h3>
        <p className={`text-sm leading-relaxed ${dark ? 'text-white/70' : 'text-ruwad-navy/60'}`}>{slide.desc}</p>

        <div className="flex items-center gap-2 mt-1">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`الشريحة ${i + 1}`}
              className={`h-2.5 rounded-full border-2 ${dark ? 'border-white' : 'border-ruwad-navy'} transition-all ${i === index ? 'w-7 bg-ruwad-lime' : dark ? 'w-2.5 bg-transparent' : 'w-2.5 bg-white'}`}
            />
          ))}
        </div>
      </div>

      <button
        onClick={next}
        aria-label="التالي"
        className={`${compact ? 'hidden' : 'hidden lg:flex'} w-11 h-11 rounded-full ${dark ? 'bg-ruwad-navy border-white' : 'bg-white border-ruwad-navy'} border-2 shadow-hard-sm hover-pop items-center justify-center shrink-0`}
      >
        <ChevronLeft size={20} className={dark ? 'text-white' : 'text-ruwad-navy'} />
      </button>
    </div>
  )
}
