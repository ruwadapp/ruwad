'use client'
import { useState } from 'react'
import { Smile } from 'lucide-react'

// لوحة إيموجي سريعة (بلا مكتبة خارجية) — مفيدة لمستخدمي الحاسوب بلا كيبورد إيموجي جاهز
const CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: 'وجوه', emojis: ['😀','😂','🥰','😍','😊','😉','😎','🤩','😢','😭','😡','😱','🤔','😴','🙄','😅','🥳','😇','🤗','😏'] },
  { label: 'إيماءات', emojis: ['👍','👎','👏','🙏','💪','🤝','✌️','🤞','👌','🫡','👋','🤙','✋','🫶'] },
  { label: 'قلوب', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💯','🔥','✨','🎉','🎊'] },
  { label: 'تعليمي', emojis: ['📚','✏️','📝','🎓','🏆','⭐','✅','❌','⏰','📌','💡','🎯'] },
]

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState(0)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="إيموجي"
        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition ${open ? 'bg-ruwad-blue text-white' : 'bg-ruwad-gray/30 text-ruwad-navy hover:bg-ruwad-gray/50'}`}
      >
        <Smile size={19} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 right-0 z-20 bg-white rounded-ruwad shadow-ruwad-lg border border-ruwad-gray/40 w-72 overflow-hidden">
            <div className="flex border-b border-ruwad-gray/30">
              {CATEGORIES.map((c, i) => (
                <button
                  key={c.label}
                  onClick={() => setTab(i)}
                  className={`flex-1 text-xs font-bold py-2 transition ${tab === i ? 'text-ruwad-blue border-b-2 border-ruwad-blue' : 'text-ruwad-navy/45'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 p-3 max-h-48 overflow-y-auto">
              {CATEGORIES[tab].emojis.map((e) => (
                <button
                  key={e}
                  onClick={() => { onPick(e); setOpen(false) }}
                  className="text-2xl hover:bg-ruwad-gray/20 rounded-lg py-1 transition"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
