'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Loader2 } from 'lucide-react'

// حذف جلسة حضور من بطاقتها مباشرة — أيقونة صغيرة مع تأكيد،
// وتوقف انتشار الحدث كي لا تفتح البطاقة (وهي رابط)
export function SessionDeleteButton({ sessionId, title }: { sessionId: string; title: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (loading) return
    if (!confirm(`حذف جلسة "${title}" نهائياً؟\nستُحذف معها كل سجلات الحضور المرتبطة بها ولا يمكن التراجع.`)) return
    setLoading(true)
    const { error } = await supabase.from('attendance_sessions').delete().eq('id', sessionId)
    setLoading(false)
    if (error) { alert('حدث خطأ أثناء الحذف، حاول مرة أخرى'); return }
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      aria-label="حذف الجلسة"
      title="حذف الجلسة"
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-ruwad-navy/30 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  )
}
