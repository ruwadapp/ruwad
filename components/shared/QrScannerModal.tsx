'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, ScanLine, AlertTriangle, CheckCircle2 } from 'lucide-react'

type Status = 'scanning' | 'success' | 'error'

export function QrScannerModal({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null)
  const startedRef = useRef(false)
  const [status, setStatus] = useState<Status>('scanning')
  const [errorMessage, setErrorMessage] = useState('تعذّر الوصول للكاميرا — تأكد من إعطاء التطبيق صلاحية الكاميرا')
  const router = useRouter()

  // يوقف الكاميرا فعلياً ويحرّرها بالكامل (stop + clear) بدل تركها قيد التشغيل
  // وهو ما كان يمنع أي محاولة مسح تالية من الوصول للكاميرا فتظهر رسالة خطأ غير صحيحة
  async function releaseCamera() {
    const scanner = scannerRef.current
    if (!scanner) return
    try {
      if (scanner.isScanning) await scanner.stop()
    } catch {
      /* ignore */
    }
    try {
      scanner.clear()
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    let active = true

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!active || !containerRef.current || startedRef.current) return
      startedRef.current = true
      const scanner = new Html5Qrcode('qr-reader-region')
      scannerRef.current = scanner

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (!active || status !== 'scanning') return
            setStatus('success')
            await releaseCamera()
            if (!active) return

            const text = decodedText.trim()
            const codeMatch = text.match(/\/qr\/([A-Za-z0-9]{4,8})/)

            let destination: string
            if (codeMatch) {
              destination = `/qr/${encodeURIComponent(codeMatch[1])}`
            } else {
              try {
                const url = new URL(text)
                destination = url.pathname + url.search
              } catch {
                // ليس رابطاً — نعتبره كوداً مباشراً
                destination = `/qr/${encodeURIComponent(text)}`
              }
            }

            // إغلاق نافذة المسح فعلياً قبل التنقّل، حتى لا تبقى عالقة فوق الصفحة الوجهة
            setTimeout(() => {
              if (!active) return
              onClose()
              router.push(destination)
            }, 500)
          },
          () => {}
        )
        .catch(() => {
          if (!active) return
          setErrorMessage('تعذّر الوصول للكاميرا — تأكد من إعطاء التطبيق صلاحية الكاميرا، أو أن كاميرا أخرى ليست قيد الاستخدام حالياً')
          setStatus('error')
        })
    })

    return () => {
      active = false
      releaseCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleClose() {
    await releaseCamera()
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
        {status === 'error' ? (
          <div className="text-center flex flex-col items-center gap-3 text-white">
            <AlertTriangle size={40} className="text-amber-400" />
            <p className="text-sm max-w-xs">{errorMessage}</p>
            <button
              onClick={() => { startedRef.current = false; setStatus('scanning') }}
              className="mt-2 bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : status === 'success' ? (
          <div className="text-center flex flex-col items-center gap-3 text-white">
            <CheckCircle2 size={48} className="text-ruwad-lime" />
            <p className="text-sm">تم العثور على الكود، جارٍ التحويل...</p>
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
