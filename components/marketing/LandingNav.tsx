'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Languages } from 'lucide-react'
import { useLang } from './LangProvider'

export function LandingNav() {
  const { t, lang, toggle, hasProvider } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const LangButton = ({ full = false }: { full?: boolean }) => hasProvider ? (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.nav.switchTo}
      title={t.nav.switchTo}
      className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-full border-2 border-ruwad-navy shadow-hard-sm hover-pop transition-colors ${
        scrolled || full ? 'bg-white text-ruwad-navy' : 'bg-ruwad-navy text-white'
      }`}
    >
      <Languages size={14} />
      <span className={lang === 'ar' ? 'font-sans' : ''}>{full ? t.nav.switchTo : t.nav.switchShort}</span>
    </button>
  ) : null

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg shadow-card' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <span className={`text-xl font-extrabold transition-colors flex items-center gap-2 ${scrolled ? 'text-ruwad-navy' : 'text-white'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="رُوّاد" className="w-8 h-8 rounded-full border-2 border-ruwad-navy" />
          {lang === 'ar' ? 'رُوّاد' : 'Ruwad'}
        </span>

        <div className="hidden md:flex items-center gap-7">
          {t.nav.links.map((l) => (
            <a key={l.href} href={l.href} className={`text-sm font-semibold transition-colors ${scrolled ? 'text-ruwad-navy/70 hover:text-ruwad-blue' : 'text-white/80 hover:text-white'}`}>
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LangButton />
          <Link href="/login" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-ruwad-navy/70 hover:text-ruwad-blue' : 'text-white/90 hover:text-white'}`}>
            {t.nav.login}
          </Link>
          <Link href="/register" className="bg-ruwad-lime text-ruwad-navy text-sm font-extrabold px-5 py-2.5 rounded-ruwad-sm border-2 border-ruwad-navy shadow-hard-sm hover-pop">
            {t.nav.start}
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-3">
          <LangButton />
          <button onClick={() => setOpen((v) => !v)} className={scrolled ? 'text-ruwad-navy' : 'text-white'} aria-label={t.nav.menu}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white shadow-card px-5 py-4 flex flex-col gap-3">
          {t.nav.links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-semibold text-ruwad-navy/80 py-1.5">
              {l.label}
            </a>
          ))}
          <div className="flex gap-2 mt-2">
            <Link href="/login" className="flex-1 text-center border-2 border-ruwad-gray text-ruwad-navy text-sm font-semibold py-2.5 rounded-ruwad-sm">{t.nav.loginShort}</Link>
            <Link href="/register" className="flex-1 text-center bg-ruwad-lime text-ruwad-navy text-sm font-extrabold py-2.5 rounded-ruwad-sm border-2 border-ruwad-navy shadow-hard-sm">{t.nav.start}</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
