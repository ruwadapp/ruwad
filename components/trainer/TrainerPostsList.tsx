'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrainerPost } from '@/lib/types'
import { Trash2, Pencil, Check, X, BookOpen, FileText, FileCheck, Trophy, ClipboardList, Award, Link2, Heart, MoreHorizontal } from 'lucide-react'

const CARD_ICON = { course: BookOpen, exam: FileText, assignment: FileCheck, challenge: Trophy, survey: ClipboardList, certificate: Award }
const CARD_LABEL = { course: 'كورس', exam: 'امتحان', assignment: 'واجب', challenge: 'تحدٍ', survey: 'استبيان', certificate: 'شهادة' }

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'الآن'
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`
  if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`
  return new Date(dateStr).toLocaleDateString('ar')
}

// قائمة منشورات صاحب الصفحة (مدرب أو معهد) بأسلوب الشبكات الاجتماعية،
// مع تعديل وحذف مباشرين من قائمة ⋯ في رأس كل منشور
export function TrainerPostsList({
  posts,
  authorName = 'أنا',
  authorAvatarUrl,
  likeCounts = {},
}: {
  posts: TrainerPost[]
  authorName?: string
  authorAvatarUrl?: string | null
  likeCounts?: Record<string, number>
}) {
  const [items, setItems] = useState(posts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
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
    setMenuId(null)
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
    return (
      <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/50 text-sm">
        لم تنشر شيئاً بعد — اكتب أول منشور لك أعلاه وسيظهر لمتابعيك في الرواق فوراً. ✨
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((post) => {
        const Icon = post.card_type ? CARD_ICON[post.card_type] : null
        const isEditing = editingId === post.id
        const likes = likeCounts[post.id] ?? 0
        return (
          <article key={post.id} className="bg-white rounded-ruwad shadow-card overflow-hidden">
            {/* ===== رأس المنشور: الكاتب + الوقت + قائمة الإجراءات ===== */}
            <div className="flex items-center gap-3 px-5 pt-4">
              <div className="w-11 h-11 rounded-full bg-ruwad-gradient text-white flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                {authorAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={authorAvatarUrl} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  authorName.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ruwad-navy text-sm leading-tight truncate">{authorName}</p>
                <p className="text-[11px] text-ruwad-navy/40 mt-0.5">{timeAgo(post.created_at)}</p>
              </div>
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuId(menuId === post.id ? null : post.id)}
                  aria-label="خيارات المنشور"
                  className="text-ruwad-navy/40 hover:bg-ruwad-gray/30 p-2 rounded-full transition"
                >
                  <MoreHorizontal size={18} />
                </button>
                {menuId === post.id && (
                  <div className="absolute left-0 top-10 z-20 bg-white rounded-ruwad-sm shadow-ruwad border border-ruwad-gray/40 py-1 w-40">
                    <button onClick={() => startEdit(post)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ruwad-navy hover:bg-ruwad-gray/20 transition">
                      <Pencil size={14} className="text-ruwad-blue" /> تعديل المنشور
                    </button>
                    <button onClick={() => { setMenuId(null); handleDelete(post.id) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
                      <Trash2 size={14} /> حذف المنشور
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ===== المحتوى ===== */}
            <div className="px-5 py-3">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={4}
                    autoFocus
                    className="w-full border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue transition resize-none"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-sm text-ruwad-navy/50 px-3 py-1.5 rounded-ruwad-sm hover:bg-ruwad-gray/20 transition">
                      <X size={14} /> إلغاء
                    </button>
                    <button onClick={() => saveEdit(post.id)} disabled={saving} className="flex items-center gap-1 text-sm font-semibold text-white bg-ruwad-blue px-4 py-1.5 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-50">
                      <Check size={14} /> حفظ
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-ruwad-navy whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>
              )}
            </div>

            {/* ===== المرفقات ===== */}
            {(Icon || (post.link_url && post.link_label)) && (
              <div className="px-5 pb-3 flex flex-wrap items-center gap-2">
                {Icon && post.card_type && (
                  <span className="flex items-center gap-1.5 bg-ruwad-blue/10 text-ruwad-blue text-xs font-semibold px-3 py-1.5 rounded-full">
                    <Icon size={13} /> مرفق: {CARD_LABEL[post.card_type]}
                  </span>
                )}
                {post.link_url && post.link_label && (
                  <span title={post.link_url} className="flex items-center gap-1.5 bg-ruwad-navy/10 text-ruwad-navy text-xs font-semibold px-3 py-1.5 rounded-full">
                    <Link2 size={13} /> زر: {post.link_label}
                  </span>
                )}
              </div>
            )}

            {/* ===== تذييل التفاعل ===== */}
            <div className="border-t border-ruwad-gray/40 px-5 py-2.5 flex items-center justify-between text-xs text-ruwad-navy/50">
              <span className="flex items-center gap-1.5">
                <Heart size={14} className={likes > 0 ? 'text-red-500 fill-red-500' : ''} />
                {likes > 0 ? `${likes} إعجاب` : 'لا إعجابات بعد'}
              </span>
              <span>يظهر لمتابعيك في الرواق</span>
            </div>
          </article>
        )
      })}
    </div>
  )
}
