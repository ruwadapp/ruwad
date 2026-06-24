'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function PresentationForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('عنوان العرض مطلوب'); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: insertError } = await supabase
      .from('presentations')
      .insert({ trainer_id: user.id, title, description: description || null })
      .select()
      .single()

    if (insertError || !data) { setError('حدث خطأ أثناء إنشاء العرض'); setLoading(false); return }
    router.push(`/presentations/${data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleCreate} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 max-w-xl">
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">عنوان العرض التقديمي</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">الوصف (اختياري)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none" />
      </div>
      <button type="submit" disabled={loading}
        className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 mt-2 w-fit">
        {loading ? 'جارٍ الإنشاء...' : 'إنشاء العرض'}
      </button>
    </form>
  )
}
