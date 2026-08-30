'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Shield, Zap, FileCheck, Gem, ArrowUp, ArrowDown, X, Plus, Save, Check, GraduationCap } from 'lucide-react'

export interface BuilderItem {
  uid: string // معرّف محلي للقائمة
  item_type: 'lecture' | 'exam' | 'challenge' | 'assignment' | 'treasure'
  item_id: string | null
  title: string
}

const TYPE_META = {
  lecture: { icon: BookOpen, label: 'محاضرة', cls: 'bg-ruwad-blue/10 text-ruwad-blue' },
  assignment: { icon: FileCheck, label: 'واجب', cls: 'bg-sky-100 text-sky-600' },
  exam: { icon: Shield, label: 'بوابة امتحان', cls: 'bg-ruwad-navy text-ruwad-lime' },
  challenge: { icon: Zap, label: 'تحدي', cls: 'bg-amber-100 text-amber-600' },
  treasure: { icon: Gem, label: 'كنز مخفي +25', cls: 'bg-gradient-to-br from-amber-300 to-amber-500 text-white' },
} as const

// منظِّم رحلة الكورس: ترتيب المحطات (محاضرات/امتحانات/تحديات/واجبات) وزرع الكنوز
export function JourneyBuilder({ courseId, initialItems }: { courseId: string; initialItems: BuilderItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    setItems(next)
    setSaved(false)
  }

  function removeTreasure(i: number) {
    setItems(items.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  function addTreasure() {
    setItems([...items, { uid: `new-${Date.now()}`, item_type: 'treasure', item_id: null, title: 'كنز مخفي' }])
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    // استبدال كامل: حذف الترتيب السابق ثم إدراج الجديد
    const { error: delErr } = await supabase.from('journey_items').delete().eq('course_id', courseId)
    if (delErr) { setError('تعذّر الحفظ، حاول مجدداً.'); setSaving(false); return }
    const { error: insErr } = await supabase.from('journey_items').insert(
      items.map((it, idx) => ({
        course_id: courseId,
        item_type: it.item_type,
        item_id: it.item_id,
        order_index: idx,
      }))
    )
    setSaving(false)
    if (insErr) { setError('تعذّر الحفظ، حاول مجدداً.'); return }
    setSaved(true)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-ruwad shadow-card p-5">
        <p className="text-sm text-ruwad-navy/60 leading-relaxed">
          رتّب محطات رحلة طلابك بالأسهم، وازرع كنوزاً مخفية 💎 بين المحطات (كل كنز يمنح الطالب 25 نقطة عند الوصول إليه).
          الطالب يفتح المحطات <span className="font-bold">بهذا الترتيب تماماً</span> في الكورسات المتسلسلة، وتنتهي الرحلة دائماً بقمة الشهادة 🎓.
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-2.5">{error}</div>}

      <div className="flex flex-col gap-2">
        {items.map((it, i) => {
          const meta = TYPE_META[it.item_type]
          const Icon = meta.icon
          return (
            <div key={it.uid} className="bg-white rounded-ruwad-sm shadow-card p-3 flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-ruwad-gray/30 text-ruwad-navy/60 text-xs font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className={`w-10 h-10 rounded-ruwad-sm flex items-center justify-center shrink-0 ${meta.cls}`}><Icon size={18} /></span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ruwad-navy text-sm truncate">{it.title}</p>
                <p className="text-[10px] text-ruwad-navy/45">{meta.label}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="أعلى" className="p-2 rounded-ruwad-sm text-ruwad-navy/50 hover:bg-ruwad-gray/30 disabled:opacity-25 transition"><ArrowUp size={15} /></button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="أسفل" className="p-2 rounded-ruwad-sm text-ruwad-navy/50 hover:bg-ruwad-gray/30 disabled:opacity-25 transition"><ArrowDown size={15} /></button>
                {it.item_type === 'treasure' && (
                  <button onClick={() => removeTreasure(i)} aria-label="حذف الكنز" className="p-2 rounded-ruwad-sm text-red-400 hover:bg-red-50 transition"><X size={15} /></button>
                )}
              </div>
            </div>
          )
        })}

        {/* القمة الثابتة */}
        <div className="rounded-ruwad-sm p-3 flex items-center gap-3 border-2 border-dashed border-amber-300 bg-amber-50/50">
          <span className="w-7 h-7 shrink-0" />
          <span className="w-10 h-10 rounded-ruwad-sm bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-white flex items-center justify-center shrink-0"><GraduationCap size={18} /></span>
          <p className="flex-1 font-bold text-amber-700 text-sm">قمة الرحلة: شهادة إتمام الكورس (ثابتة في النهاية)</p>
        </div>
      </div>

      <div className="sticky bottom-20 md:bottom-4 z-30 bg-white rounded-ruwad shadow-ruwad-lg p-3.5 flex items-center gap-2.5">
        <button onClick={addTreasure} className="flex items-center gap-1.5 border-2 border-amber-400 text-amber-600 text-sm font-bold px-4 py-2.5 rounded-ruwad-sm hover:bg-amber-50 transition">
          <Plus size={15} /> <Gem size={14} /> إضافة كنز
        </button>
        <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-ruwad-blue text-white font-bold px-6 py-2.5 rounded-ruwad-sm hover:opacity-90 transition shadow-ruwad disabled:opacity-50">
          {saved ? <><Check size={16} /> حُفظ الترتيب</> : <><Save size={16} /> {saving ? 'جارٍ الحفظ...' : 'حفظ ترتيب الرحلة'}</>}
        </button>
      </div>
    </div>
  )
}
