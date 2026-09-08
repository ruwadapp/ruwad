'use client'
import { useEffect, useState } from 'react'

// سلايدر الهيرو: تبديل تلقائي بتلاشٍ ناعم + نقاط تنقّل — بلا أي مكتبة خارجية
export function HeroSlider({ images, intervalS = 5 }: { images: string[]; intervalS?: number }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), Math.max(intervalS, 2) * 1000)
    return () => clearInterval(t)
  }, [images.length, intervalS])

  if (images.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + i}
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      {/* تعتيم للنص فوق الصور */}
      <div className="absolute inset-0 bg-gradient-to-l from-ruwad-navy/85 via-ruwad-navy/60 to-ruwad-navy/30" />
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`شريحة ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
