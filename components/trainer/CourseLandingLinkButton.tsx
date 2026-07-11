'use client'
import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

export function CourseLandingLinkButton({ courseId, published }: { courseId: string; published: boolean }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = `${window.location.origin}/land/${courseId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!published) {
    return (
      <span className="text-xs text-ruwad-navy/40 flex items-center justify-center gap-1.5 px-2">
        انشر التدريب أولاً لتفعيل صفحة التسويق
      </span>
    )
  }

  return (
    <button
      onClick={handleCopy}
      className="bg-white border-2 border-ruwad-gray text-ruwad-navy px-5 py-2.5 rounded-ruwad-sm font-semibold hover:bg-ruwad-gray/20 transition flex items-center gap-2"
    >
      {copied ? <Check size={18} className="text-ruwad-lime" /> : <Link2 size={18} />}
      {copied ? 'تم النسخ!' : 'نسخ رابط التسويق'}
    </button>
  )
}
