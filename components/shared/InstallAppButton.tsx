'use client'
import { useEffect, useState } from 'react'
import { usePortalBrand } from '@/lib/portal/brand-context'
import { MonitorDown, Check, Share, PlusSquare } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// زر تثبيت التطبيق كتطبيق PWA:
// - كروم/أندرويد/إيدج: يلتقط حدث beforeinstallprompt ويُظهر نافذة التثبيت الأصلية
// - iOS سفاري: لا يدعم التثبيت البرمجي، فنعرض إرشاد "مشاركة ← إضافة إلى الشاشة الرئيسية"
// - مثبّت بالفعل: علامة تأكيد
export function InstallAppButton() {
  const brand = usePortalBrand()
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    setInstalled(standalone)

    const ua = navigator.userAgent
    setIsIos(/iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/i.test(ua) ? true : /iPhone|iPad|iPod/i.test(ua))

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => { setInstalled(true); setInstallEvent(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!installEvent) return
    setBusy(true)
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    setInstallEvent(null)
    setBusy(false)
  }

  if (installed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-600 bg-green-50 rounded-ruwad-sm px-4 py-2.5 self-start">
        <Check size={15} /> التطبيق مثبّت على هذا الجهاز
      </span>
    )
  }

  if (installEvent) {
    return (
      <button
        onClick={install}
        disabled={busy}
        className="self-start flex items-center gap-2 bg-ruwad-blue text-white text-sm font-bold px-5 py-2.5 rounded-ruwad-sm hover:opacity-90 transition shadow-ruwad disabled:opacity-50"
      >
        <MonitorDown size={16} /> {busy ? 'جارٍ التثبيت...' : 'تثبيت التطبيق الآن'}
      </button>
    )
  }

  if (isIos) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowIosHelp(!showIosHelp)}
          className="self-start flex items-center gap-2 bg-ruwad-blue text-white text-sm font-bold px-5 py-2.5 rounded-ruwad-sm hover:opacity-90 transition shadow-ruwad"
        >
          <MonitorDown size={16} /> كيف أثبّت التطبيق؟
        </button>
        {showIosHelp && (
          <div className="bg-ruwad-blue/5 border border-ruwad-blue/20 rounded-ruwad-sm p-4 text-sm text-ruwad-navy leading-relaxed flex flex-col gap-1.5">
            <p className="font-bold">على iPhone/iPad (سفاري):</p>
            <p className="flex items-center gap-1.5">1. اضغط زر المشاركة <Share size={14} className="text-ruwad-blue inline" /> أسفل المتصفح</p>
            <p className="flex items-center gap-1.5">2. اختر <span className="font-bold">"إضافة إلى الشاشة الرئيسية"</span> <PlusSquare size={14} className="text-ruwad-blue inline" /></p>
            <p>3. اضغط "إضافة" — وستجد أيقونة {brand ? brand.displayName : 'رُوّاد'} على شاشتك 🎉</p>
          </div>
        )}
      </div>
    )
  }

  // متصفح لا يتيح التثبيت البرمجي حالياً (أو التطبيق مثبّت من قبل في هذا المتصفح)
  return (
    <p className="text-xs text-ruwad-navy/50 leading-relaxed">
      لم يعرض متصفحك خيار التثبيت — إن كان التطبيق مثبّتًا سابقاً فافتحه من أيقونته، أو جرّب من متصفح Chrome على جهازك.
    </p>
  )
}
