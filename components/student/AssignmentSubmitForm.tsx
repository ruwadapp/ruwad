'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileUploadZone, type UploadedFile } from '@/components/shared/FileUploadZone'
import { RichTextEditor } from '@/components/trainer/RichTextEditor'
import { AlertTriangle, Send } from 'lucide-react'

export function AssignmentSubmitForm({ assignmentId, dueDate }: { assignmentId: string; dueDate: string | null }) {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmLate, setConfirmLate] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isLate = !!dueDate && new Date() > new Date(dueDate)

  async function doSubmit() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase.from('assignment_submissions').insert({
      assignment_id: assignmentId,
      student_id: user.id,
      content: content || null,
      file_urls: files,
    })

    if (insertError) {
      setError('حدث خطأ أثناء التسليم، حاول مرة أخرى')
      setLoading(false)
      return
    }

    router.refresh()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const plain = content.replace(/<[^>]*>/g, '').trim()
    if (!plain && files.length === 0) {
      setError('أضف إجابة نصية أو ملفاً واحداً على الأقل')
      return
    }
    if (isLate && !confirmLate) {
      setConfirmLate(true)
      return
    }
    doSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-5">
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

      {isLate && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm rounded-ruwad-sm px-4 py-3">
          <AlertTriangle size={16} className="shrink-0" /> انتهى الموعد المحدَّد لهذا الواجب — سيُسجَّل تسليمك كمتأخر.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">إجابتك</label>
        <RichTextEditor value={content} onChange={setContent} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">الملفات المرفقة (اختياري)</label>
        <FileUploadZone
          bucket="assignment-submissions"
          pathPrefix={assignmentId}
          files={files}
          onChange={setFiles}
        />
      </div>

      {confirmLate ? (
        <div className="flex flex-col gap-3 bg-amber-50 rounded-ruwad-sm p-4">
          <p className="text-sm text-amber-700 font-medium">هل تريد المتابعة وتسليم الواجب متأخراً؟</p>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-amber-600 text-white px-5 py-2.5 rounded-ruwad-sm font-semibold disabled:opacity-50">
              {loading ? 'جارٍ التسليم...' : 'تأكيد التسليم المتأخر'}
            </button>
            <button type="button" onClick={() => setConfirmLate(false)} className="px-5 py-2.5 rounded-ruwad-sm font-semibold text-ruwad-navy/60 hover:bg-white transition">
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-bold hover:opacity-90 transition shadow-ruwad disabled:opacity-50 w-fit"
        >
          <Send size={17} /> {loading ? 'جارٍ التسليم...' : 'تسليم الواجب'}
        </button>
      )}
    </form>
  )
}
