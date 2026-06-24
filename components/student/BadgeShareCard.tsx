'use client'
import { useState } from 'react'
import type { Badge } from '@/lib/types'
import { Share2, Download, Copy, Check, X } from 'lucide-react'

const RARITY_GRADIENTS: Record<string, [string, string]> = {
  common: ['#DEE0ED', '#33A4FA'],
  rare: ['#3A4EFB', '#33A4FA'],
  epic: ['#3A4EFB', '#E3FF3B'],
  legendary: ['#252943', '#3A4EFB'],
}

const CAPTION = (name: string) =>
  `حصلت على شارة "${name}" في تطبيق رُوّاد! 🏆\n#تطبيق_رواد #رواد #RuwadApp #Ruwad`

export function BadgeShareCard({ badge, studentName }: { badge: Badge; studentName: string }) {
  const [open, setOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  async function generateImage(): Promise<{ blob: Blob; url: string }> {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')!

    // التأكد من تحميل الخط قبل الرسم
    try { await document.fonts.load('700 80px Alyamama'); await document.fonts.ready } catch {}

    const [c1, c2] = RARITY_GRADIENTS[badge.rarity] ?? RARITY_GRADIENTS.common
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1920)
    gradient.addColorStop(0, c1)
    gradient.addColorStop(1, c2)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1080, 1920)

    // دائرة الأيقونة
    ctx.save()
    ctx.beginPath()
    ctx.arc(540, 700, 220, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.fill()
    ctx.restore()

    ctx.font = '220px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(badge.icon ?? '🏆', 540, 720)

    // اسم الشارة
    ctx.fillStyle = '#FFFFFF'
    ctx.font = "700 72px 'Alyamama', sans-serif"
    ctx.direction = 'rtl'
    wrapText(ctx, badge.name, 540, 1020, 920, 90)

    // اسم الطالب
    ctx.font = "500 40px 'Alyamama', sans-serif"
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(studentName, 540, 1140)

    // مستوى الندرة
    ctx.font = "700 34px 'Alyamama', sans-serif"
    ctx.fillStyle = '#E3FF3B'
    const rarityLabel = { common: 'شارة عادية', rare: 'شارة نادرة', epic: 'شارة أسطورية', legendary: 'شارة فريدة 🔥' }[badge.rarity] ?? ''
    ctx.fillText(rarityLabel, 540, 1210)

    // شعار التطبيق + الهاشتاغ
    ctx.font = "700 56px 'Alyamama', sans-serif"
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('رُوّاد', 540, 1680)
    ctx.font = "400 30px 'Inter', sans-serif"
    ctx.direction = 'ltr'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillText('Ruwad', 540, 1735)

    ctx.font = "600 32px 'Inter', sans-serif"
    ctx.fillStyle = '#E3FF3B'
    ctx.fillText('#تطبيق_رواد   #RuwadApp', 540, 1820)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve({ blob, url: URL.createObjectURL(blob) })
      }, 'image/png')
    })
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ')
    let line = ''
    const lines: string[] = []
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    lines.push(line)
    const startY = y - ((lines.length - 1) * lineHeight) / 2
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight))
  }

  async function handleOpen() {
    setOpen(true)
    setGenerating(true)
    const { url } = await generateImage()
    setImageUrl(url)
    setGenerating(false)
  }

  async function handleShare() {
    if (!imageUrl) return
    const res = await fetch(imageUrl)
    const blob = await res.blob()
    const file = new File([blob], 'ruwad-badge.png', { type: 'image/png' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: CAPTION(badge.name) })
        return
      } catch {
        // المستخدم أغلق نافذة المشاركة، لا حاجة لفعل شيء
      }
    } else {
      handleDownload()
    }
  }

  function handleDownload() {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `ruwad-badge-${badge.name}.png`
    a.click()
  }

  function copyCaption() {
    navigator.clipboard.writeText(CAPTION(badge.name))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-ruwad-navy text-white px-3 py-2 rounded-ruwad-sm hover:opacity-90 transition w-full"
      >
        <Share2 size={14} /> مشاركة على إنستغرام
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-ruwad p-5 max-w-sm w-full flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ruwad-navy">شارك إنجازك</h3>
              <button onClick={() => setOpen(false)} aria-label="إغلاق"><X size={20} className="text-ruwad-navy/50" /></button>
            </div>

            <div className="rounded-ruwad-sm overflow-hidden bg-ruwad-gray/20 aspect-[9/16] flex items-center justify-center">
              {generating ? (
                <p className="text-sm text-ruwad-navy/50">جارٍ تجهيز البطاقة...</p>
              ) : imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={badge.name} className="w-full h-full object-cover" />
              ) : null}
            </div>

            <div className="bg-ruwad-gray/20 rounded-ruwad-sm p-3 flex items-center justify-between gap-2">
              <p className="text-xs text-ruwad-navy/70 line-clamp-2">{CAPTION(badge.name)}</p>
              <button onClick={copyCaption} className="shrink-0 text-ruwad-blue">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                disabled={generating}
                className="flex-1 bg-ruwad-blue text-white py-2.5 rounded-ruwad-sm font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Share2 size={15} /> مشاركة
              </button>
              <button
                onClick={handleDownload}
                disabled={generating}
                className="flex-1 border-2 border-ruwad-gray text-ruwad-navy py-2.5 rounded-ruwad-sm font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Download size={15} /> تنزيل
              </button>
            </div>
            <p className="text-[11px] text-ruwad-navy/40 text-center">
              افتح إنستغرام ← أضف للقصة ← اختر الصورة من المعرض
            </p>
          </div>
        </div>
      )}
    </>
  )
}
