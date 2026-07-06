'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Survey } from '@/lib/types'
import { CodeQrImage } from '@/components/shared/CodeQrImage'
import { Copy, Check } from 'lucide-react'

export function SurveyForm({ initialSurvey, instituteId, redirectBase = '/surveys' }: { initialSurvey?: Survey; instituteId?: string; redirectBase?: string }) {
  const [title, setTitle] = useState(initialSurvey?.title ?? '')
  const [description, setDescription] = useState(initialSurvey?.description ?? '')
  const [logoUrl, setLogoUrl] = useState(initialSurvey?.logo_url ?? '')
  const [isAnonymous, setIsAnonymous] = useState(initialSurvey?.is_anonymous ?? false)
  const [isActive, setIsActive] = useState(initialSurvey?.is_active ?? true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('عنوان الاستبيان مطلوب')
      return
    }
    setLoading(true)
    setError(null)

    const payload = {
      title,
      description: description || null,
      logo_url: logoUrl || null,
      is_anonymous: isAnonymous,
      is_active: isActive,
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (initialSurvey) {
      const { error: updateError } = await supabase.from('surveys').update(payload).eq('id', initialSurvey.id)
      if (updateError) { setError('حدث خطأ أثناء الحفظ'); setLoading(false); return }
      router.refresh()
      setLoading(false)
    } else {
      const { data, error: insertError } = await supabase
        .from('surveys')
        .insert(instituteId ? { ...payload, institute_id: instituteId } : { ...payload, trainer_id: user.id })
        .select()
        .single()

      if (insertError || !data) { setError('حدث خطأ أثناء إنشاء الاستبيان'); setLoading(false); return }
      router.push(`${redirectBase}/${data.id}`)
      router.refresh()
    }
  }

  function copyShareLink() {
    if (!initialSurvey) return
    navigator.clipboard.writeText(`${window.location.origin}/survey/${initialSurvey.share_token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 max-w-2xl">
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

      {initialSurvey && (
        <div className="flex items-center justify-between bg-ruwad-gray/20 rounded-ruwad-sm px-4 py-3 gap-4">
          <div>
            <p className="text-sm font-medium text-ruwad-navy">رابط مشاركة الاستبيان</p>
            <p className="text-xs text-ruwad-navy/50">/survey/{initialSurvey.share_token}</p>
            <button type="button" onClick={copyShareLink} className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-blue mt-2">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'تم النسخ' : 'نسخ الرابط'}
            </button>
          </div>
          <CodeQrImage url={`${process.env.NEXT_PUBLIC_APP_URL || 'https://ruwadapp.vercel.app'}/survey/${initialSurvey.share_token}`} size={90} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">عنوان الاستبيان</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">الوصف</label>
        <textarea
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">رابط اللوغو (اختياري)</label>
        <input
          value={logoUrl ?? ''}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
        />
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-ruwad-navy">مجهول الهوية (لا يُسجَّل اسم المستجيب)</span>
          <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-5 h-5 accent-ruwad-blue" />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-ruwad-navy">الاستبيان نشط (متاح للردود)</span>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-5 h-5 accent-ruwad-blue" />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-2 w-fit"
      >
        {loading ? 'جارٍ الحفظ...' : initialSurvey ? 'حفظ التعديلات' : 'إنشاء الاستبيان'}
      </button>
    </form>
  )
}
