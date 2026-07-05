'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Trash2, Link2, Check, FileText, Users, BookOpen, Clock, type LucideIcon } from 'lucide-react'

// حصراً التدرّجان المعتمدان رسمياً في الهوية البصرية (--gradient-primary و --gradient-dark)،
// بالإضافة لِلَون الليموني كخلفية صلبة (بلا مزج مع الأزرق) — لأن مزج الأزرق بالليموني في تدرّج واحد
// يُولّد درجات وسيطة مخضّرة غير موجودة في لوحة الهوية إطلاقاً، وهو ما تمنعه قواعد التصميم صراحة
// (الليموني "لمسة" وليس تدرّجاً). لا نخترع أي مزيج ألوان خارج ما هو معتمد رسمياً.
export type EntityCardGradient = 'blue' | 'navy' | 'lime' | 'blueReverse'

const GRADIENTS: Record<EntityCardGradient, { bg: string; text: string; subtext: string; chip: string; chipText: string; iconBg: string; actionHover: string }> = {
  // التدرّج الأساسي المعتمد: --gradient-primary
  blue: {
    bg: 'linear-gradient(135deg, #3A4EFB 0%, #33A4FA 100%)',
    text: 'text-white',
    subtext: 'text-white/75',
    chip: 'bg-white/20',
    chipText: 'text-white',
    iconBg: 'bg-white/15',
    actionHover: 'hover:bg-white/20',
  },
  // نفس التدرّج الأساسي بالاتجاه المعكوس — للتنويع البصري دون إدخال أي لون جديد
  blueReverse: {
    bg: 'linear-gradient(135deg, #33A4FA 0%, #3A4EFB 100%)',
    text: 'text-white',
    subtext: 'text-white/75',
    chip: 'bg-white/20',
    chipText: 'text-white',
    iconBg: 'bg-white/15',
    actionHover: 'hover:bg-white/20',
  },
  // التدرّج الداكن المعتمد: --gradient-dark
  navy: {
    bg: 'linear-gradient(180deg, #252943 0%, #1a1e33 100%)',
    text: 'text-white',
    subtext: 'text-white/60',
    chip: 'bg-white/15',
    chipText: 'text-white',
    iconBg: 'bg-white/10',
    actionHover: 'hover:bg-white/15',
  },
  // لون الليموني كخلفية صلبة واحدة (Accent) بلا تدرّج — كما تنص الهوية: الليموني "لمسة" لا مزيج
  lime: {
    bg: '#E3FF3B',
    text: 'text-ruwad-navy',
    subtext: 'text-ruwad-navy/70',
    chip: 'bg-ruwad-navy/10',
    chipText: 'text-ruwad-navy',
    iconBg: 'bg-white/50',
    actionHover: 'hover:bg-white/50',
  },
}

// نمرّر اسم الأيقونة كنص (لا كمكوّن دالة) لأن تمرير الدوال من Server Component إلى Client Component ممنوع في Next.js
export type StatIconName = 'file' | 'users' | 'book' | 'clock'

const STAT_ICONS: Record<StatIconName, LucideIcon> = {
  file: FileText,
  users: Users,
  book: BookOpen,
  clock: Clock,
}

interface StatItem { icon: StatIconName; label: string }

interface EntityCardProps {
  href: string
  gradient: EntityCardGradient
  title: string
  description?: string | null
  badge?: { text: string; active: boolean }
  stats?: StatItem[]
  shareCode?: string | null
  deleteTable: string
  deleteId: string
  deleteConfirmText: string
}

export function EntityCard({
  href,
  gradient,
  title,
  description,
  badge,
  stats = [],
  shareCode,
  deleteTable,
  deleteId,
  deleteConfirmText,
}: EntityCardProps) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const style = GRADIENTS[gradient]

  function goToContent() {
    router.push(href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToContent() }
  }

  function copyLink(e: React.MouseEvent) {
    e.stopPropagation()
    if (!shareCode) return
    navigator.clipboard.writeText(`${window.location.origin}/qr/${shareCode}`)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(deleteConfirmText)) return
    setDeleting(true)
    const { error } = await supabase.from(deleteTable).delete().eq('id', deleteId)
    if (error) { alert('حدث خطأ أثناء الحذف، حاول مرة أخرى'); setDeleting(false); return }
    router.refresh()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToContent}
      onKeyDown={handleKeyDown}
      style={{ background: style.bg }}
      className="relative overflow-hidden rounded-ruwad shadow-card hover:shadow-ruwad-lg hover:-translate-y-0.5 transition-all cursor-pointer p-4 flex flex-col gap-2.5 min-h-0"
    >
      <div className="absolute -top-8 -left-8 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex items-start justify-between gap-2">
        <h3 className={`font-bold text-base line-clamp-1 ${style.text}`}>{title}</h3>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${style.chip} ${style.chipText}`}>
            {badge.text}
          </span>
        )}
      </div>

      {description && (
        <p className={`relative text-xs line-clamp-1 ${style.subtext}`}>{description}</p>
      )}

      {stats.length > 0 && (
        <div className="relative flex items-center gap-3 flex-wrap">
          {stats.map((s, i) => {
            const Icon = STAT_ICONS[s.icon]
            return (
              <span key={i} className={`flex items-center gap-1 text-xs ${style.subtext}`}>
                <Icon size={13} /> {s.label}
              </span>
            )
          })}
        </div>
      )}

      <div className="relative flex items-center gap-1.5 mt-1 pt-2.5 border-t border-white/20">
        <button
          onClick={(e) => { e.stopPropagation(); goToContent() }}
          aria-label="تعديل"
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold ${style.text} ${style.actionHover} px-2.5 py-1.5 rounded-ruwad-sm transition`}
        >
          <Pencil size={14} /> تعديل
        </button>
        {shareCode && (
          <button
            onClick={copyLink}
            aria-label="مشاركة الرابط"
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold ${style.text} ${style.actionHover} px-2.5 py-1.5 rounded-ruwad-sm transition`}
          >
            {linkCopied ? <Check size={14} /> : <Link2 size={14} />} {linkCopied ? 'تم النسخ' : 'مشاركة'}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label="حذف"
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold ${style.text} ${style.actionHover} px-2.5 py-1.5 rounded-ruwad-sm transition disabled:opacity-50`}
        >
          <Trash2 size={14} /> {deleting ? '...' : 'حذف'}
        </button>
      </div>
    </div>
  )
}
