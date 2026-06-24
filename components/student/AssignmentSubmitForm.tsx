'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AssignmentSubmitForm({ assignmentId }: { assignmentId: string }) {
  const [content, setContent] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !fileUrl.trim()) {
      setError('أضف نص إجابة أو رابط ملف على الأقل')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase.from('assignment_submissions').insert({
      assignment_id: assignmentId,
      student_id: user.id,
      content: content || null,
      file_urls: fileUrl ? [fileUrl] : [],
    })

    if (insertError) {
      setError('حدث خطأ أثناء التسليم، حاول مرة أخرى')
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">إجابتك</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="اكتب إجابتك هنا"
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">رابط ملف (اختياري)</label>
        <input
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="https://..."
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 w-fit"
      >
        {loading ? 'جارٍ التسليم...' : 'تسليم الواجب'}
      </button>
    </form>
  )
}
