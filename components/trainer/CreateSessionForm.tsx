'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Course } from '@/lib/types'
import { Plus } from 'lucide-react'

export function CreateSessionForm({ courses }: { courses: Course[] }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('عنوان الجلسة مطلوب')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: codeData, error: codeError } = await supabase.rpc('generate_session_code')
    if (codeError || !codeData) {
      setError('حدث خطأ أثناء توليد كود الجلسة')
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('attendance_sessions')
      .insert({
        trainer_id: user.id,
        course_id: courseId || null,
        title,
        session_code: codeData,
        is_active: false,
      })
      .select()
      .single()

    if (insertError || !data) {
      setError('حدث خطأ أثناء إنشاء الجلسة')
      setLoading(false)
      return
    }

    router.push(`/attendance/${data.id}`)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad flex items-center gap-2 w-fit"
      >
        <Plus size={18} /> جلسة حضور جديدة
      </button>
    )
  }

  return (
    <form onSubmit={handleCreate} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 max-w-lg">
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">عنوان الجلسة</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: محاضرة الأحد — الأسبوع 3"
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">الكورس (اختياري)</label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition"
        >
          <option value="">بلا كورس محدد</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'جارٍ الإنشاء...' : 'إنشاء الجلسة'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-6 py-2.5 rounded-ruwad-sm font-semibold text-ruwad-navy/60 hover:bg-ruwad-gray/30 transition"
        >
          إلغاء
        </button>
      </div>
    </form>
  )
}
