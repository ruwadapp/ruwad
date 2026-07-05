'use client'
import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { CodeQrImage } from '@/components/shared/CodeQrImage'

interface ShareCodeBlockProps {
  code: string
  title?: string
  description?: string
  qrSize?: number
}

/**
 * كتلة مشاركة موحّدة: تعرض الكود + QR + زر "نسخ رابط المشاركة".
 * الرابط يوجّه إلى /qr/[code] الذي يسجّل الطالب تلقائياً (تماماً كأنه مسح رمز QR).
 */
export function ShareCodeBlock({
  code,
  title = 'كود المشاركة',
  description = 'شارك هذا الكود أو رمز QR أو الرابط مع طلابك للدخول مباشرة',
  qrSize = 90,
}: ShareCodeBlockProps) {
  const [linkCopied, setLinkCopied] = useState(false)

  function copyLink() {
    const url = `${window.location.origin}/qr/${code}`
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-between bg-ruwad-blue/5 rounded-ruwad-sm px-4 py-3 gap-4 flex-wrap">
      <div>
        <p className="text-sm font-medium text-ruwad-navy">{title}</p>
        <p className="text-xs text-ruwad-navy/50">{description}</p>
        <p className="text-2xl font-mono font-bold text-ruwad-blue tracking-widest mt-1" dir="ltr">{code}</p>
        <button
          type="button"
          onClick={copyLink}
          className="flex items-center gap-1.5 text-xs font-semibold bg-ruwad-blue/10 text-ruwad-blue px-3 py-1.5 rounded-full hover:bg-ruwad-blue/20 transition mt-2"
        >
          {linkCopied ? <Check size={14} /> : <Link2 size={14} />}
          {linkCopied ? 'تم نسخ الرابط ✓' : 'نسخ رابط المشاركة'}
        </button>
      </div>
      <CodeQrImage code={code} size={qrSize} />
    </div>
  )
}
