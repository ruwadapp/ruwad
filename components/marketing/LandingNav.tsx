'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { href: '#features', label: 'الميزات' },
  { href: '#how', label: 'كيف تعمل' },
  { href: '#plans', label: 'الخطط' },
  { href: '#contact', label: 'تواصل معنا' },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg shadow-card' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <span className={`text-xl font-extrabold transition-colors ${scrolled ? 'text-ruwad-navy' : 'text-white'}`}>رُوّاد</span>

        <div className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={`text-sm font-semibold transition-colors ${scrolled ? 'text-ruwad-navy/70 hover:text-ruwad-blue' : 'text-white/80 hover:text-white'}`}>
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-ruwad-navy/70 hover:text-ruwad-blue' : 'text-white/90 hover:text-white'}`}>
            تسجيل الدخول
          </Link>
          <Link href="/register" className="bg-ruwad-lime text-ruwad-navy text-sm font-bold px-5 py-2.5 rounded-ruwad-sm hover:opacity-90 transition shadow-ruwad">
            ابدأ مجاناً
          </Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} className={`md:hidden ${scrolled ? 'text-ruwad-navy' : 'text-white'}`} aria-label="القائمة">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white shadow-card px-5 py-4 flex flex-col gap-3">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-semibold text-ruwad-navy/80 py-1.5">
              {l.label}
            </a>
          ))}
          <div className="flex gap-2 mt-2">
            <Link href="/login" className="flex-1 text-center border-2 border-ruwad-gray text-ruwad-navy text-sm font-semibold py-2.5 rounded-ruwad-sm">دخول</Link>
            <Link href="/register" className="flex-1 text-center bg-ruwad-lime text-ruwad-navy text-sm font-bold py-2.5 rounded-ruwad-sm">ابدأ مجاناً</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
