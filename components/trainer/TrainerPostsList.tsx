'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrainerPost } from '@/lib/types'
import { Trash2, Pencil, Check, X, BookOpen, FileText, FileCheck, Trophy, ClipboardList, Award } from 'lucide-react'

const CARD_ICON = { course: BookOpen, exam: FileText, assignment: FileCheck, challenge: Trophy, survey: ClipboardList, certificate: Award }
const CARD_LABEL = { course: 'كورس', exam: 'امتحان', assignment: 'واجب', challenge: 'تحدٍ', survey: 'استبيان', certificate: 'شهادة' }

export function TrainerPostsList({ posts }: { posts: TrainerPost[] }) {
  const [items, setItems] = useState(posts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
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

  function startEdit(post: TrainerPost) {
    setEditingId(post.id)
    setDraft(post.content)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const { error } = await supabase.from('trainer_posts').update({ content: draft }).eq('id', id)
    setSaving(false)
    if (!error) {
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, content: draft } : p)))
      setEditingId(null)
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
        const isEditing = editingId === post.id
        return (
          <div key={post.id} className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              {isEditing ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  autoFocus
                  className="flex-1 border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue transition resize-none"
                />
              ) : (
                <p className="text-ruwad-navy whitespace-pre-wrap flex-1">{post.content}</p>
              )}
              <div className="flex items-center gap-1 shrink-0">
                {isEditing ? (
                  <>
                    <button onClick={() => saveEdit(post.id)} disabled={saving} aria-label="حفظ" className="text-ruwad-blue hover:bg-ruwad-blue/10 p-1.5 rounded-ruwad-sm transition disabled:opacity-50">
                      <Check size={15} />
                    </button>
                    <button onClick={() => setEditingId(null)} aria-label="إلغاء" className="text-ruwad-navy/40 hover:bg-ruwad-gray/20 p-1.5 rounded-ruwad-sm transition">
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(post)} aria-label="تعديل المنشور" className="text-ruwad-blue hover:bg-ruwad-blue/10 p-1.5 rounded-ruwad-sm transition">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(post.id)} aria-label="حذف المنشور" className="text-red-500 hover:bg-red-50 p-1.5 rounded-ruwad-sm transition">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
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
