'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, FileCheck, Zap, BookOpen, ClipboardList, Link2, X, Search } from 'lucide-react'

export type AttachmentType = 'exam' | 'assignment' | 'challenge' | 'course' | 'survey' | 'link'
export interface ChatAttachment { type: AttachmentType; ref_id: string | null; title: string; url: string }

const TYPES: { v: AttachmentType; label: string; icon: typeof FileText; table?: string }[] = [
  { v: 'exam', label: 'امتحان', icon: FileText, table: 'exams' },
  { v: 'assignment', label: 'واجب', icon: FileCheck, table: 'assignments' },
  { v: 'challenge', label: 'تحدي', icon: Zap, table: 'challenges' },
  { v: 'course', label: 'كورس', icon: BookOpen, table: 'courses' },
  { v: 'survey', label: 'استبيان', icon: ClipboardList, table: 'surveys' },
  { v: 'link', label: 'رابط', icon: Link2 },
]

const PATH: Record<AttachmentType, (id: string) => string> = {
  exam: (id) => `/exams/${id}`,
  assignment: (id) => `/assignments/${id}`,
  challenge: (id) => `/challenges/${id}`,
  course: (id) => `/courses/${id}`,
  survey: (id) => `/surveys/${id}`,
  link: () => '',
}

// ورقة اختيار المرفق: امتحان/واجب/تحدي/كورس/استبيان من موارد المرسل، أو رابط خارجي
export function ChatAttachmentPicker({ onPick, onClose }: { onPick: (a: ChatAttachment) => void; onClose: () => void }) {
  const [type, setType] = useState<AttachmentType | null>(null)
  const [items, setItems] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!type || type === 'link') return
    const meta = TYPES.find((t) => t.v === type)!
    setLoading(true)
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const { data } = await supabase.from(meta.table!).select('id, title').eq('trainer_id', user!.id).order('created_at', { ascending: false }).limit(100)
      setItems(data ?? [])
      setLoading(false)
    })
  }, [type, supabase])

  const filtered = items.filter((i) => i.title.includes(q))

  function addLink() {
    let url = linkUrl.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    try { new URL(url) } catch { return }
    onPick({ type: 'link', ref_id: null, title: linkTitle.trim() || url, url })
  }

  return (
    <div className="absolute inset-x-0 bottom-full mb-2 bg-white rounded-ruwad shadow-ruwad-lg border border-ruwad-gray/40 overflow-hidden max-h-[60vh] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ruwad-gray/30 shrink-0">
        <p className="text-sm font-bold text-ruwad-navy">{type ? TYPES.find((t) => t.v === type)?.label : 'إرفاق'}</p>
        <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/40 hover:text-ruwad-navy p-1"><X size={16} /></button>
      </div>

      {!type ? (
        <div className="grid grid-cols-3 gap-2 p-4">
          {TYPES.map((t) => (
            <button key={t.v} onClick={() => setType(t.v)} className="flex flex-col items-center gap-1.5 p-3 rounded-ruwad-sm hover:bg-ruwad-gray/15 transition">
              <span className="w-11 h-11 rounded-full bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center"><t.icon size={20} /></span>
              <span className="text-xs font-semibold text-ruwad-navy">{t.label}</span>
            </button>
          ))}
        </div>
      ) : type === 'link' ? (
        <div className="p-4 flex flex-col gap-2.5">
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." dir="ltr" className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue" />
          <input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="عنوان مختصر للرابط (اختياري)" className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue" />
          <button onClick={addLink} disabled={!linkUrl.trim()} className="bg-ruwad-blue text-white font-bold text-sm py-2.5 rounded-ruwad-sm disabled:opacity-40">إرفاق الرابط</button>
          <button onClick={() => setType(null)} className="text-xs font-semibold text-ruwad-navy/50">رجوع لأنواع المرفقات</button>
        </div>
      ) : (
        <>
          <div className="px-4 py-2 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ruwad-navy/35" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className="w-full border border-ruwad-gray rounded-ruwad-sm pr-8 pl-3 py-2 text-sm outline-none focus:border-ruwad-blue" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <p className="text-center text-xs text-ruwad-navy/40 py-6">جارٍ التحميل...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-xs text-ruwad-navy/40 py-6">لا يوجد شيء لعرضه.</p>
            ) : (
              filtered.map((it) => (
                <button
                  key={it.id}
                  onClick={() => onPick({ type, ref_id: it.id, title: it.title, url: PATH[type](it.id) })}
                  className="w-full text-right px-4 py-2.5 text-sm text-ruwad-navy hover:bg-ruwad-blue/5 transition truncate"
                >
                  {it.title}
                </button>
              ))
            )}
          </div>
          <button onClick={() => setType(null)} className="text-xs font-semibold text-ruwad-navy/50 px-4 py-2 border-t border-ruwad-gray/30 shrink-0">رجوع لأنواع المرفقات</button>
        </>
      )}
    </div>
  )
}
