'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AvatarUpload } from '@/components/shared/AvatarUpload'
import { Loader2, Check } from 'lucide-react'

interface Institute { id: string; name: string; description: string | null; logo_url: string | null; address: string | null; institute_code: string }

export function InstituteProfileForm({ institute }: { institute: Institute }) {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState(institute.name)
  const [description, setDescription] = useState(institute.description ?? '')
  const [address, setAddress] = useState(institute.address ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (name.trim().length < 2) { setError('اكتب اسماً صحيحاً للمعهد'); return }
    setSaving(true); setError(''); setSaved(false)
    const { error: err } = await supabase.from('institutes')
      .update({ name: name.trim(), description: description.trim() || null, address: address.trim() || null })
      .eq('id', institute.id)
    setSaving(false)
    if (err) { setError('تعذّر الحفظ — أعد المحاولة'); return }
    setSaved(true)
    router.refresh()
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'

  return (
    <div className="bg-white rounded-ruwad shadow-card p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <AvatarUpload currentUrl={institute.logo_url} fallbackLetter={institute.name.charAt(0)} table="institutes" rowId={institute.id} column="logo_url" size={72} />
        <div>
          <p className="text-sm font-extrabold text-ruwad-navy">شعار المعهد</p>
          <p className="text-xs text-ruwad-navy/50">اضغط على الصورة لتغييرها</p>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-extrabold text-ruwad-navy">اسم المعهد</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-extrabold text-ruwad-navy">نبذة عن المعهد</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls + ' resize-none'} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-extrabold text-ruwad-navy">العنوان</span>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-extrabold text-ruwad-navy">معرّف المعهد</span>
        <input value={institute.institute_code} readOnly disabled className={inputCls + ' opacity-60 cursor-not-allowed font-mono tracking-widest'} />
      </label>

      {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
      <button onClick={save} disabled={saving}
        className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
        {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
        {saved ? 'تم الحفظ ✓' : 'حفظ التعديلات'}
      </button>
    </div>
  )
}
