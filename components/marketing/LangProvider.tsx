'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { LANDING_TEXT, type Lang, type LandingText } from './i18n'

const STORAGE_KEY = 'ruwad-landing-lang'

interface LangContextValue {
  lang: Lang
  t: LandingText
  dir: 'rtl' | 'ltr'
  toggle: () => void
  setLang: (l: Lang) => void
  hasProvider: boolean
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')

  // استرجاع اللغة المحفوظة بعد التحميل (تجنّب اختلاف السيرفر/العميل)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === 'en' || saved === 'ar') setLangState(saved)
    } catch {}
  }, [])

  // مزامنة <html lang dir> مع اللغة الحالية
  useEffect(() => {
    const html = document.documentElement
    const prevLang = html.lang
    const prevDir = html.dir
    html.lang = lang
    html.dir = LANDING_TEXT[lang].dir
    return () => { html.lang = prevLang; html.dir = prevDir }
  }, [lang])

  function setLang(l: Lang) {
    setLangState(l)
    try { window.localStorage.setItem(STORAGE_KEY, l) } catch {}
  }

  const value: LangContextValue = {
    lang,
    t: LANDING_TEXT[lang],
    dir: LANDING_TEXT[lang].dir,
    toggle: () => setLang(lang === 'ar' ? 'en' : 'ar'),
    setLang,
    hasProvider: true,
  }

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

const FALLBACK: LangContextValue = {
  lang: 'ar',
  t: LANDING_TEXT.ar,
  dir: 'rtl',
  toggle: () => {},
  setLang: () => {},
  hasProvider: false,
}

/** خارج <LangProvider> (مثل صفحات المدونة) نعود للعربية بدون زر تبديل */
export function useLang() {
  return useContext(LangContext) ?? FALLBACK
}
