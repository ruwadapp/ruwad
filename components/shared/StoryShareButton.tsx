'use client'
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Share2, Download, X, Loader2, Building2 } from 'lucide-react'

interface StoryShareButtonProps {
  authorName: string
  isInstitute: boolean
  content: string
  cardTitle?: string | null
  cardTypeLabel?: string | null
}

export function StoryShareButton({ authorName, isInstitute, content, cardTitle, cardTypeLabel }: StoryShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  async function generateAndShare() {
    if (!cardRef.current) return
    setGenerating(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'ruwad-story.png', { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'رُوّاد' })
      } else {
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = 'ruwad-story.png'
        link.click()
      }
    } catch {
      // تجاهل إلغاء المستخدم لمشاركة النظام
    }
    setGenerating(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-navy/50 hover:text-ruwad-blue px-3 py-1.5 rounded-full transition">
        <Share2 size={16} /> مشاركة
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ width: 270, height: 480 }}>
              <div
                ref={cardRef}
                className="relative w-full h-full flex flex-col justify-between p-7 text-white"
                style={{ width: 270, height: 480, backgroundImage: 'linear-gradient(160deg, #3A4EFB 0%, #33A4FA 55%, #252943 100%)' }}
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-24 -left-10 w-32 h-32 bg-[#E3FF3B]/25 rounded-full blur-2xl" />

                <div className="relative flex items-center gap-2.5">
                  <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold text-sm">
                    {isInstitute ? <Building2 size={16} /> : authorName.charAt(0)}
                  </span>
                  <p className="font-bold text-sm">{authorName}</p>
                </div>

                <div className="relative flex flex-col gap-3">
                  {cardTypeLabel && (
                    <span className="self-start text-[10px] font-bold bg-[#E3FF3B] text-[#252943] px-3 py-1 rounded-full">{cardTypeLabel}</span>
                  )}
                  {cardTitle && <p className="text-lg font-extrabold leading-snug">{cardTitle}</p>}
                  <p className="text-sm leading-relaxed line-clamp-6 opacity-90">{content}</p>
                </div>

                <div className="relative flex items-center justify-center gap-1.5 text-xs font-bold opacity-80">
                  رُوّاد <span className="opacity-50">· Ruwad</span>
                </div>
              </div>
            </div>

            <button
              onClick={generateAndShare}
              disabled={generating}
              className="flex items-center gap-2 bg-white text-ruwad-navy font-bold px-6 py-3 rounded-full shadow-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {generating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {generating ? 'جارٍ التجهيز...' : 'حفظ ومشاركة كستوري'}
            </button>
            <button onClick={() => setOpen(false)} className="text-white/70 text-sm flex items-center gap-1">
              <X size={14} /> إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  )
}
