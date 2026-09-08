'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText, Trophy, ClipboardList, FileCheck, CalendarCheck, Users } from 'lucide-react'

export type ActiveItemType = 'exam' | 'challenge' | 'survey' | 'assignment' | 'attendance'

export interface ActiveItem {
  id: string
  type: ActiveItemType
  title: string
  courseTitle: string
  href: string
  table: string
  submitted: number
  total: number
}

const TYPE_META: Record<ActiveItemType, { label: string; icon: typeof FileText; color: string; bg: string }> = {
  exam: { label: 'امتحان', icon: FileText, color: 'text-ruwad-blue', bg: 'bg-ruwad-blue/10' },
  challenge: { label: 'تحدٍ', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-100' },
  survey: { label: 'استبيان', icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-100' },
  assignment: { label: 'واجب', icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  attendance: { label: 'جلسة حضور', icon: CalendarCheck, color: 'text-ruwad-navy', bg: 'bg-ruwad-gray/50' },
}

// لوحة "النشاط الحي الآن": كل عنصر مفعّل حالياً (امتحان/تحدٍ/استبيان/واجب/جلسة حضور)
// مع عدّاد التسليمات مقابل عدد طلاب الكورس، وسويتش موحّد للإغلاق الفوري من هنا.
export function ActiveItemsPanel({ initial }: { initial: ActiveItem[] }) {
  const [items, setItems] = useState(initial)
  const [busyId, setBusyId] = useState<string | null>(null)
  const supabase = createClient()

  async function deactivate(item: ActiveItem) {
    if (busyId) return
    setBusyId(item.id)
    const patch: Record<string, unknown> = { is_active: false }
    if (item.type === 'attendance') patch.closed_at = new Date().toISOString()
    const { error } = await supabase.from(item.table).update(patch).eq('id', item.id)
    setBusyId(null)
    if (!error) setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-6 text-center">
        <p className="text-ruwad-navy/50 text-sm">لا يوجد أي نشاط مفعّل الآن — كل الامتحانات والتحديات والاستبيانات والواجبات وجلسات الحضور مغلقة.</p>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => {
        const meta = TYPE_META[item.type]
        const Icon = meta.icon
        const pct = item.total > 0 ? Math.round((item.submitted / item.total) * 100) : 0
        const busy = busyId === item.id
        return (
          <div key={`${item.type}-${item.id}`} className="bg-white rounded-ruwad shadow-card p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <Link href={item.href} className="flex items-center gap-2.5 min-w-0 group">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}>
                  <Icon size={16} className={meta.color} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-ruwad-navy/50">{meta.label} · {item.courseTitle}</p>
                  <p className="text-sm font-extrabold text-ruwad-navy truncate group-hover:text-ruwad-blue transition">{item.title}</p>
                </div>
              </Link>
              <button
                onClick={() => deactivate(item)}
                disabled={busy}
                role="switch"
                aria-checked="true"
                aria-label={`إطفاء ${meta.label} ${item.title}`}
                title="مفعّل الآن — اضغط للإطفاء"
                className="relative inline-flex items-center h-7 w-[52px] rounded-full transition-colors duration-300 shrink-0 disabled:opacity-60 bg-green-500 shadow-[0_0_12px_rgba(34,197,94,.5)]"
              >
                <span className="absolute top-1 right-[26px] h-5 w-5 rounded-full bg-white shadow transition-all duration-300 flex items-center justify-center text-[9px]">
                  {busy ? '…' : '✓'}
                </span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-ruwad-navy/50 mb-1">
                <span className="flex items-center gap-1"><Users size={11} /> التسليمات</span>
                <span>{item.submitted} / {item.total || '—'}</span>
              </div>
              <div className="h-2 rounded-full bg-ruwad-gray/50 overflow-hidden">
                <div className="h-full bg-ruwad-blue transition-all" style={{ width: `${item.total > 0 ? Math.min(pct, 100) : 0}%` }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
