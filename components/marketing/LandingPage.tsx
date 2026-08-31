'use client'
import Link from 'next/link'
import {
  BookOpen, FileCheck2, Flame, Award, QrCode, Users2, Bell, Download,
  CheckCircle2, MessageCircle, Mail, ArrowLeft, ArrowRight, Star,
} from 'lucide-react'
import { LandingNav } from './LandingNav'
import { LangProvider, useLang } from './LangProvider'
import { LiveQuizDemo } from './LiveQuizDemo'
import { PhoneShowcase } from './PhoneShowcase'
import { Reveal } from './Reveal'
import { ParallaxLayer } from './ParallaxLayer'

const FEATURE_STYLE = [
  { icon: BookOpen, bg: 'bg-white', r: -2 },
  { icon: FileCheck2, bg: 'bg-ruwad-lime', r: 2 },
  { icon: Flame, bg: 'bg-white', r: 1.5 },
  { icon: Award, bg: 'bg-white', r: -1.5 },
  { icon: QrCode, bg: 'bg-white', r: 2.5 },
  { icon: Users2, bg: 'bg-ruwad-lime', r: -2 },
  { icon: Bell, bg: 'bg-white', r: 1 },
  { icon: Download, bg: 'bg-white', r: -1 },
]

const PLAN_STYLE = [
  { r: -2, highlighted: false },
  { r: 0, highlighted: true },
  { r: 2, highlighted: false },
]

const WHATSAPP_NUMBER = '963998285483'

export function LandingPage() {
  return (
    <LangProvider>
      <LandingPageInner />
    </LangProvider>
  )
}

function LandingPageInner() {
  const { t, dir, lang } = useLang()
  const ArrowFwd = dir === 'rtl' ? ArrowLeft : ArrowRight
  const FEATURES = t.features.items.map((f, i) => ({ ...f, ...FEATURE_STYLE[i] }))
  const PLANS = t.plans.items.map((p, i) => ({ ...p, ...PLAN_STYLE[i] }))
  const FACTS = t.facts
  const STEPS = t.how.steps
  const FAQS = t.faq.items

  return (
    <main dir={dir} className="bg-white overflow-x-clip">
      <LandingNav />

      {/* ===== HERO — لوحة ملصقات ملوّنة ===== */}
      <section className="relative bg-ruwad-navy overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
        <ParallaxLayer speed={0.12} className="absolute -top-10 -left-10 w-72 h-72 bg-ruwad-blue/40 rounded-full blur-3xl">
          <div />
        </ParallaxLayer>
        <ParallaxLayer speed={-0.08} className="absolute top-1/3 right-0 w-64 h-64 bg-ruwad-lime/20 rounded-full blur-3xl">
          <div />
        </ParallaxLayer>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-7">
              <span className="bg-white text-ruwad-navy text-xs font-extrabold px-3.5 py-2 rounded-full border-2 border-ruwad-navy shadow-hard-sm -rotate-2 inline-flex items-center gap-1">
                <Flame size={12} className="text-red-500" /> {t.hero.badges[0]}
              </span>
              <span className="bg-ruwad-lime text-ruwad-navy text-xs font-extrabold px-3.5 py-2 rounded-full border-2 border-ruwad-navy shadow-hard-sm rotate-1">
                {t.hero.badges[1]}
              </span>
              <span className="bg-ruwad-blue text-white text-xs font-extrabold px-3.5 py-2 rounded-full border-2 border-ruwad-navy shadow-hard-sm -rotate-1">
                {t.hero.badges[2]}
              </span>
            </div>

            <h1 className="text-center lg:text-start text-5xl sm:text-6xl font-extrabold leading-[0.98] tracking-tight">
              <span className="block text-white">{t.hero.title1}</span>
              <span className="block text-ruwad-lime -rotate-1 inline-block my-1">{t.hero.title2}</span>
            </h1>

            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 text-center lg:text-start mt-6">
              {t.hero.desc}
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mt-9">
              <Link href="/register" className="bg-ruwad-lime text-ruwad-navy font-extrabold px-9 py-4 rounded-ruwad-sm border-2 border-ruwad-navy shadow-hard hover-pop text-center">
                {t.hero.cta}
              </Link>
              <a href="#demo" className="flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white font-bold px-9 py-4 rounded-ruwad-sm hover:bg-white hover:text-ruwad-navy transition">
                {t.hero.demo} <ArrowFwd size={16} />
              </a>
            </div>
          </div>

          <div>
            <PhoneShowcase dark compact />
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="bg-ruwad-lime border-y-2 border-ruwad-navy py-3 overflow-hidden -rotate-1 scale-105">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(2)].flatMap((_, dup) =>
            t.marquee.map((t, i) => (
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
          <span className="inline-block bg-ruwad-navy text-white text-xs font-extrabold px-4 py-1.5 rounded-full -rotate-2">{t.features.tag}</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-4">{t.features.title}</h2>
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
          <Reveal className="text-center lg:text-start order-2 lg:order-1" rotate={-1}>
            <span className="inline-block bg-ruwad-lime text-ruwad-navy text-xs font-extrabold px-4 py-1.5 rounded-full border-2 border-ruwad-navy">
              {t.demo.tag}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 leading-snug">
              {t.demo.title}
            </h2>
            <p className="text-white/80 mt-4 leading-relaxed max-w-md mx-auto lg:mx-0">
              {t.demo.desc}
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
          <span className="inline-block bg-ruwad-lime text-ruwad-navy text-xs font-extrabold px-4 py-1.5 rounded-full border-2 border-ruwad-navy rotate-1">{t.how.tag}</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-4">{t.how.title}</h2>
        </Reveal>

        <div className="flex flex-col gap-8">
          {STEPS.map((s, idx) => (
            <Reveal key={s.title} delay={idx * 90} rotate={idx % 2 === 0 ? -0.6 : 0.6}>
              <div className={`flex items-center gap-5 ${idx % 2 === 1 ? 'sm:flex-row-reverse sm:text-end' : ''}`}>
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
              <p className="text-xs text-ruwad-navy/40 font-bold tracking-widest">{t.cert.label}</p>
              <p className="text-2xl font-extrabold text-ruwad-navy mt-3">{t.cert.name}</p>
              <div className="w-16 h-px bg-ruwad-gray mx-auto my-3" />
              <p className="text-sm text-ruwad-navy/60">{t.cert.completed}</p>
              <p className="font-bold text-ruwad-blue mt-1">{t.cert.course}</p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <div className="w-10 h-10 bg-ruwad-navy rounded-ruwad-sm grid grid-cols-3 gap-[1px] p-1">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className={`rounded-[1px] ${[0, 2, 4, 6, 8].includes(i) ? 'bg-ruwad-lime' : 'bg-white/20'}`} />
                  ))}
                </div>
                <span className="text-[10px] text-ruwad-navy/40">{t.cert.scan}</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100} className="order-1 lg:order-2 text-center lg:text-start">
            <span className="inline-block bg-white text-ruwad-navy text-xs font-extrabold px-4 py-1.5 rounded-full border-2 border-ruwad-navy">{t.cert.tag}</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-4 leading-snug">{t.cert.title}</h2>
            <p className="text-ruwad-navy/70 mt-4 leading-relaxed max-w-md mx-auto lg:mx-0">
              {t.cert.desc}
            </p>
            <ul className="mt-6 flex flex-col gap-2.5 items-center lg:items-start">
              {t.cert.points.map((t) => (
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
          <span className="inline-block bg-ruwad-navy text-white text-xs font-extrabold px-4 py-1.5 rounded-full -rotate-1">{t.plans.tag}</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-4">{t.plans.title}</h2>
          <p className="text-ruwad-navy/60 mt-3">{t.plans.desc}</p>
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
                    {t.plans.popular}
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
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.plans.whatsapp(plan.name))}`}
                  target="_blank" rel="noopener noreferrer"
                  className={`text-center font-extrabold py-3 rounded-ruwad-sm border-2 border-ruwad-navy transition ${
                    plan.highlighted ? 'bg-ruwad-lime text-ruwad-navy hover:opacity-90' : 'bg-ruwad-navy text-white hover:opacity-90'
                  }`}
                >
                  {t.plans.cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== INSTITUTE SEO CONTENT ===== */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <Reveal className="bg-[#F5F6FA] rounded-ruwad p-8 sm:p-10 border-2 border-ruwad-navy/10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ruwad-navy mb-4">
            {t.seo.title}
          </h2>
          <p className="text-ruwad-navy/70 leading-relaxed">{t.seo.body}</p>
          <Link href="/idarat-maahid" className="inline-block mt-5 text-ruwad-blue font-extrabold hover:underline">
            {t.seo.more} {dir === 'rtl' ? '←' : '→'}
          </Link>
        </Reveal>
      </section>

      {/* ===== FAQ ===== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />
      <section id="faq" className="max-w-3xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28">
        <Reveal className="text-center max-w-xl mx-auto mb-12">
          <span className="inline-block bg-ruwad-navy text-white text-xs font-extrabold px-4 py-1.5 rounded-full rotate-1">{t.faq.tag}</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mt-4">{t.faq.title}</h2>
        </Reveal>
        <div className="flex flex-col gap-4">
          {FAQS.map((f) => (
            <Reveal key={f.q} className="bg-white rounded-ruwad-sm p-6 border-2 border-ruwad-navy/10 shadow-card">
              <h3 className="font-extrabold text-ruwad-navy text-lg">{f.q}</h3>
              <p className="text-ruwad-navy/70 mt-2 leading-relaxed">{f.a}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="relative bg-ruwad-navy overflow-hidden py-20 sm:py-28">
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-ruwad-blue/30 rounded-full blur-3xl" />

        <Reveal className="relative max-w-2xl mx-auto px-5 sm:px-8 text-center flex flex-col items-center gap-6">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-snug">{t.contact.title}</h2>
          <p className="text-white/70 leading-relaxed">{t.contact.desc}</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/register" className="bg-ruwad-lime text-ruwad-navy font-extrabold px-9 py-4 rounded-ruwad-sm border-2 border-ruwad-navy shadow-hard-lime hover-pop">
              {t.contact.cta}
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.contact.whatsappMsg)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-9 py-4 rounded-ruwad-sm hover:bg-white hover:text-ruwad-navy transition"
            >
              <MessageCircle size={17} /> {t.contact.whatsapp}
            </a>
          </div>
        </Reveal>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-ruwad-lime border-t-2 border-ruwad-navy py-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-center sm:text-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="رُوّاد" className="w-9 h-9 rounded-full border-2 border-ruwad-navy" />
            <div>
              <p className="text-xl font-extrabold text-ruwad-navy">{lang === 'ar' ? 'رُوّاد' : 'Ruwad'}</p>
              <p className="text-xs text-ruwad-navy/60 mt-0.5">{t.footer.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-sm text-ruwad-navy/70 font-semibold">
            <a href="#features" className="hover:text-ruwad-navy transition">{t.footer.features}</a>
            <a href="#plans" className="hover:text-ruwad-navy transition">{t.footer.plans}</a>
            <Link href="/idarat-maahid" className="hover:text-ruwad-navy transition">{t.footer.institutes}</Link>
            <Link href="/blog" className="hover:text-ruwad-navy transition">{t.footer.blog}</Link>
            <a href="mailto:hello@ruwad.app" className="flex items-center gap-1.5 hover:text-ruwad-navy transition">
              <Mail size={14} /> {t.footer.email}
            </a>
          </div>
          <p className="text-xs text-ruwad-navy/50">© {new Date().getFullYear()} {lang === 'ar' ? 'رُوّاد' : 'Ruwad'}. {t.footer.rights}</p>
        </div>
      </footer>
    </main>
  )
}
