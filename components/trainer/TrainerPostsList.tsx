'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrainerPost } from '@/lib/types'
import { Trash2, BookOpen, FileText, FileCheck, Trophy, ClipboardList } from 'lucide-react'

const CARD_ICON = { course: BookOpen, exam: FileText, assignment: FileCheck, challenge: Trophy, survey: ClipboardList }
const CARD_LABEL = { course: 'كورس', exam: 'امتحان', assignment: 'واجب', challenge: 'تحدٍ', survey: 'استبيان' }

export function TrainerPostsList({ posts }: { posts: TrainerPost[] }) {
  const [items, setItems] = useState(posts)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا المنشور نهائياً؟')) return
    const { error } = await supabase.from('trainer_posts').delete().eq('id', id)
    if (!error) {
      setItems((prev) => prev.filter((p) => p.id !== id))
      router.refresh()
    }
  }

  if (items.length === 0) {
    return <p className="text-center text-ruwad-navy/50 text-sm py-8">لم تنشر شيئاً بعد.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((post) => {
        const Icon = post.card_type ? CARD_ICON[post.card_type] : null
        return (
          <div key={post.id} className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-ruwad-navy whitespace-pre-wrap flex-1">{post.content}</p>
              <button onClick={() => handleDelete(post.id)} aria-label="حذف المنشور" className="text-red-500 hover:bg-red-50 p-1.5 rounded-ruwad-sm transition shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-ruwad-navy/40">
              {Icon && post.card_type && (
                <span className="flex items-center gap-1 bg-ruwad-blue/10 text-ruwad-blue px-2 py-0.5 rounded-full">
                  <Icon size={11} /> {CARD_LABEL[post.card_type]}
                </span>
              )}
              <span>{new Date(post.created_at).toLocaleString('ar')}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
