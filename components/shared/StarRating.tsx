'use client'
import { useState } from 'react'
import { Star } from 'lucide-react'

export function StarRatingDisplay({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? 'fill-ruwad-lime text-ruwad-lime' : 'text-ruwad-gray'}
        />
      ))}
    </div>
  )
}

export function StarRatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} نجوم`}
        >
          <Star
            size={26}
            className={n <= (hover || value) ? 'fill-ruwad-lime text-ruwad-lime' : 'text-ruwad-gray'}
          />
        </button>
      ))}
    </div>
  )
}
