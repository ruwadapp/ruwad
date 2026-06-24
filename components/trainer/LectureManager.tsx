'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Lecture } from '@/lib/types'
import { Plus, Trash2, Video, FileText, GripVertical } from 'lucide-react'

export function LectureManager({ courseId, lectures }: { courseId: string; lectures: Lecture[] }) {
  const [items, setItems] = useState(lectures)
  const router = useRouter()
  const supabase = createClient()

  async function togglePublish(lecture: Lecture) {
    const { error } = await supabase
      .from('lectures')
      .update({ is_published: !lecture.is_published })
      .eq('id', lecture.id)
    if (!error) {
      setItems((prev) =>
        prev.map((l) => (l.id === lecture.id ? { ...l, is_published: !l.is_published } : l))
      )
    }
  }

  async function deleteLecture(id: string) {
    if (!confirm('هل تريد حذف هذه المحاضرة نهائياً؟')) return
    const { error } = await supabase.from('lectures').delete().eq('id', id)
    if (!error) {
      setItems((prev) => prev.filter((l) => l.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ruwad-navy">المحاضرات</h2>
        <Link
          href={`/courses/${courseId}/lectures/new`}
          className="bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition flex items-center gap-1.5"
        >
          <Plus size={16} /> محاضرة جديدة
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد محاضرات بعد.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items
            .sort((a, b) => a.order_index - b.order_index)
            .map((lecture, idx) => (
              <div
                key={lecture.id}
                className="flex items-center gap-3 p-4 rounded-ruwad-sm border border-ruwad-gray/60"
              >
                <GripVertical size={18} className="text-ruwad-navy/30 shrink-0" />
                <span className="w-6 h-6 rounded-full bg-ruwad-gray/40 text-ruwad-navy text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                {lecture.video_url ? (
                  <Video size={18} className="text-ruwad-blue shrink-0" />
                ) : (
                  <FileText size={18} className="text-ruwad-blue shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ruwad-navy truncate">{lecture.title}</p>
                  {lecture.duration_minutes && (
                    <p className="text-xs text-ruwad-navy/50">{lecture.duration_minutes} دقيقة</p>
                  )}
                </div>
                <button
                  onClick={() => togglePublish(lecture)}
                  title="اضغط لتبديل حالة النشر"
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition shrink-0 ${
                    lecture.is_published
                      ? 'bg-ruwad-lime text-ruwad-navy'
                      : 'bg-ruwad-gray/50 text-ruwad-navy/60'
                  }`}
                >
                  {lecture.is_published ? 'منشورة' : 'مسودة'}
                </button>
                <button
                  onClick={() => deleteLecture(lecture.id)}
                  aria-label="حذف المحاضرة"
                  className="text-red-500 hover:bg-red-50 p-2 rounded-ruwad-sm transition shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
