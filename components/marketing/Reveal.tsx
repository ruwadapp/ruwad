'use client'
import { useEffect, useRef, useState } from 'react'

export function Reveal({ children, delay = 0, rotate = 0, className = '' }: { children: React.ReactNode; delay?: number; rotate?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${shown ? 'reveal-shown' : 'reveal-hidden'} ${className}`}
      style={{ '--r': `${rotate}deg`, ...(shown ? { animationDelay: `${delay}ms` } : {}) } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
