'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  currentUrl: string | null
  fallbackLetter: string
  /** 'profiles' لصورة المدرب الشخصية، 'institutes' لشعار المعهد */
  table: 'profiles' | 'institutes'
  /** معرّف الصف المطلوب تحديثه (المستخدم نفسه للمدرب، أو معرّف المعهد لمالكه) */
  rowId: string
  column: 'avatar_url' | 'logo_url'
  size?: number
}

// ضغط صورة إلى مربّع بحجم محدد وإخراجها كـ data URL (JPEG) — عادةً 15–30KB
async function compressToDataUrl(file: File, size: number, quality: number): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  const sy = (bitmap.height - side) / 2
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', quality)
}

export function AvatarUpload({ currentUrl, fallbackLetter, table, rowId, column, size = 80 }: AvatarUploadProps) {
  const [url, setUrl] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('يجب اختيار صورة'); return }
    if (file.size > 5 * 1024 * 1024) { setError('الحد الأقصى 5MB'); return }
    setUploading(true)
    setError(null)

    // بلا تخزين ملفات: تُضغَط الصورة في المتصفح إلى 256×256 وتُحفظ مضمَّنة (data URL) في قاعدة البيانات مباشرة
    let newUrl: string
    try {
      newUrl = await compressToDataUrl(file, 256, 0.82)
    } catch {
      setError('تعذّر معالجة الصورة'); setUploading(false); return
    }

    const { error: updateError } = await supabase.from(table).update({ [column]: newUrl }).eq('id', rowId)
    setUploading(false)
    if (updateError) { setError('تعذّر حفظ الصورة'); return }

    setUrl(newUrl)
    router.refresh()
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full overflow-hidden bg-white/15 backdrop-blur text-white flex items-center justify-center font-bold shadow-ruwad"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          fallbackLetter
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="تغيير الصورة"
        className="absolute -bottom-1 -left-1 bg-ruwad-lime text-ruwad-navy rounded-full p-1.5 shadow-md hover:opacity-90 transition disabled:opacity-50"
      >
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {error && <p className="absolute top-full mt-1 text-[10px] text-red-300 whitespace-nowrap">{error}</p>}
    </div>
  )
}
