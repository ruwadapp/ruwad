'use client'
import { useState, useEffect } from 'react'

export function SanitizedHtml({ html, className = '' }: { html: string; className?: string }) {
  const [clean, setClean] = useState('')

  useEffect(() => {
    if (!html) { setClean(''); return }
    import('dompurify').then((mod) => setClean(mod.default.sanitize(html)))
  }, [html])

  if (!clean) return null

  return (
    <div
      className={`text-ruwad-navy leading-relaxed [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5 [&_p]:mb-1.5 ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
