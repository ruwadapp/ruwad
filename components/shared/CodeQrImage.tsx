'use client'
import { useState } from 'react'
import { Maximize2, X } from 'lucide-react'

interface CodeQrImageProps {
  code?: string
  url?: string
  size?: number
  className?: string
}

export function CodeQrImage({ code, url, size = 120, className = '' }: CodeQrImageProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const target = url ?? `${process.env.NEXT_PUBLIC_APP_URL || 'https://ruwadapp.vercel.app'}/qr/${code}`
  const qrSrc = (s: number) => `https://api.qrserver.com/v1/create-qr-code/?size=${s}x${s}&data=${encodeURIComponent(target)}`
  const badgeSize = Math.min(22, Math.max(14, Math.round(size * 0.22)))

  return (
    <>
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        aria-label="تكبير رمز QR لتسهيل مسحه"
        title="اضغط للتكبير"
        className={`relative shrink-0 inline-block ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="absolute inset-0 rounded-ruwad-sm overflow-hidden block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc(size)} alt="رمز QR" width={size} height={size} className="bg-white w-full h-full block" />
        </span>
        <span
          className="absolute -bottom-2 -right-2 bg-ruwad-blue text-white rounded-full flex items-center justify-center shadow-ruwad-lg ring-2 ring-white z-10"
          style={{ width: badgeSize, height: badgeSize }}
        >
          <Maximize2 size={Math.round(badgeSize * 0.58)} />
        </span>
      </button>

      {fullscreen && (
        <div
          className="fixed inset-0 z-[80] bg-ruwad-navy/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 px-6"
          dir="rtl"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            aria-label="إغلاق"
            className="absolute top-5 left-5 text-white/80 hover:text-white p-2 transition"
          >
            <X size={28} />
          </button>

          <div className="bg-white rounded-ruwad p-6 shadow-ruwad-lg" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc(640)}
              alt="رمز QR مكبّر"
              className="block"
              style={{ width: 'min(70vw, 320px)', height: 'min(70vw, 320px)' }}
            />
          </div>

          {code && (
            <p className="text-white font-mono text-3xl font-bold tracking-widest" dir="ltr">{code}</p>
          )}

          <p className="text-white/60 text-sm text-center max-w-xs">
            وجّه كاميرا الطالب نحو هذا الرمز لمسحه، أو أدخل الكود يدوياً إن تعذّر المسح
          </p>
        </div>
      )}
    </>
  )
}
