'use client'
import { useEffect, useRef } from 'react'

export function ParallaxLayer({ speed = 0.15, children, className = '' }: { speed?: number; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    function onScroll() {
      const rect = el!.getBoundingClientRect()
      const offset = rect.top * speed
      el!.style.transform = `translateY(${offset}px)`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
