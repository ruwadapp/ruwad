'use client'
import { Flame } from 'lucide-react'

/**
 * تأثير بصري ناري يُستخدم لتمييز التحديات النشطة (Live) — شعلة متحركة + جمرات متطايرة + توهج نابض
 * بألوان الهوية (الليموني الكهربائي + تدرجات دافئة داعمة).
 */
export function FireChallengeBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
  const iconSize = size === 'sm' ? 14 : 18

  return (
    <span className={`relative ${box} shrink-0 flex items-center justify-center`}>
      {/* الجمرات المتطايرة */}
      <span className="absolute inset-0 pointer-events-none">
        <span className="absolute bottom-0 left-1/2 w-1 h-1 rounded-full bg-ruwad-lime animate-ember" style={{ ['--ember-x' as string]: '4px' }} />
        <span className="absolute bottom-0 left-1/3 w-[3px] h-[3px] rounded-full bg-orange-400 animate-ember" style={{ animationDelay: '0.5s', ['--ember-x' as string]: '-6px' }} />
        <span className="absolute bottom-0 right-1/3 w-1 h-1 rounded-full bg-yellow-300 animate-ember" style={{ animationDelay: '1s', ['--ember-x' as string]: '5px' }} />
      </span>

      {/* الشعلة */}
      <span className="relative animate-flame-flicker text-transparent bg-clip-text bg-gradient-to-t from-orange-600 via-ruwad-lime to-yellow-200">
        <Flame size={iconSize} className="fill-current" />
      </span>
    </span>
  )
}

/** إطار متوهج نابض يُلبَس حول أي بطاقة تحدٍ نشط */
export function FireCardFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-ruwad-sm p-[2px] animate-fire-glow rounded-ruwad-sm">
      <div className="absolute inset-0 rounded-ruwad-sm bg-gradient-to-br from-orange-500 via-ruwad-lime to-yellow-300 animate-fire-bg" />
      <div className="relative rounded-[10px] bg-white">{children}</div>
    </div>
  )
}
