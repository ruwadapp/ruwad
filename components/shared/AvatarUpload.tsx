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

    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${user!.id}/${column}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { setError('تعذّر رفع الصورة'); setUploading(false); return }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const newUrl = publicUrlData.publicUrl

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
