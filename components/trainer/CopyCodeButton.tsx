'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

// نسخ كود الجلسة بضغطة — لمشاركته على الشاشة أو في الدردشة
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  async function copy(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* بيئات لا تدعم الحافظة */ }
  }
  return (
    <button onClick={copy} aria-label="نسخ الكود" title="نسخ الكود"
      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${copied ? 'bg-green-100 text-green-600' : 'bg-white/70 text-ruwad-navy/50 hover:text-ruwad-navy hover:bg-white'}`}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}
