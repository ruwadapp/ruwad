'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, ScanLine, AlertTriangle } from 'lucide-react'

export function QrScannerModal({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [handled, setHandled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let active = true

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!active || !containerRef.current) return
      const scanner = new Html5Qrcode('qr-reader-region')
      scannerRef.current = scanner

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            if (handled) return
            setHandled(true)
            scanner.stop().catch(() => {})

            const text = decodedText.trim()
            const codeMatch = text.match(/\/qr\/([A-Za-z0-9]{4,8})/)

            if (codeMatch) {
              router.push(`/qr/${encodeURIComponent(codeMatch[1])}`)
              return
            }

            // رابط كامل لمسار آخر في التطبيق (مثل رابط استبيان عام أو شهادة) — التنقّل إليه مباشرة
            try {
              const url = new URL(text)
              router.push(url.pathname + url.search)
              return
            } catch {
              // ليس رابطاً — نعتبره كوداً مباشراً
              router.push(`/qr/${encodeURIComponent(text)}`)
            }
          },
          () => {}
        )
        .catch(() => setError('تعذّر الوصول للكاميرا — تأكد من إعطاء التطبيق صلاحية الكاميرا'))
    })

    return () => {
      active = false
      scannerRef.current?.stop().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose() {
    scannerRef.current?.stop().catch(() => {})
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col" dir="rtl">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-white font-bold flex items-center gap-2">
          <ScanLine size={20} className="text-ruwad-lime" /> مسح كود QR
        </h2>
        <button onClick={handleClose} aria-label="إغلاق" className="text-white/80 p-1">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative px-6">
        {error ? (
          <div className="text-center flex flex-col items-center gap-3 text-white">
            <AlertTriangle size={40} className="text-amber-400" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div id="qr-reader-region" ref={containerRef} className="w-full max-w-sm rounded-ruwad overflow-hidden" />
        )}
      </div>

      <p className="text-white/60 text-sm text-center pb-10 px-6">
        وجّه الكاميرا نحو كود QR الخاص بمعهد، كورس، امتحان، تحدٍ، أو استبيان
      </p>
    </div>
  )
}
