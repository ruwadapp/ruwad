'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BadgeRarity } from '@/lib/types'

const CONDITION_LABELS: Record<string, string> = {
  exam_score: 'درجة في امتحان (%)',
  attendance_rate: 'نسبة حضور (%)',
  course_complete: 'إكمال كورس كامل',
  challenge_score: 'نتيجة في تحدٍ (%)',
}

export function CreateBadgeForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🏅')
  const [conditionType, setConditionType] = useState('exam_score')
  const [conditionValue, setConditionValue] = useState('90')
  const [rarity, setRarity] = useState<BadgeRarity>('rare')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('اسم الشارة مطلوب'); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const needsValue = conditionType !== 'course_complete'

    const { error: insertError } = await supabase.from('badges').insert({
      trainer_id: user.id,
      name,
      description: description || null,
      icon,
      condition_type: conditionType,
      condition_value: needsValue ? Number(conditionValue) || 0 : 0,
      rarity,
    })

    if (insertError) { setError('حدث خطأ أثناء إنشاء الشارة'); setLoading(false); return }

    setOpen(false)
    setName(''); setDescription(''); setIcon('🏅'); setConditionValue('90')
    router.refresh()
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad w-fit"
      >
        + شارة مخصصة جديدة
      </button>
    )
  }

  return (
    <form onSubmit={handleCreate} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4 max-w-xl">
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">{error}</div>}

      <div className="grid grid-cols-[80px_1fr] gap-3">
        <input value={icon} onChange={(e) => setIcon(e.target.value)} className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-center text-2xl outline-none focus:border-ruwad-blue" />
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الشارة"
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue" />
      </div>

      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="وصف الشارة وكيفية الحصول عليها"
        className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue resize-none" />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ruwad-navy">شرط المنح</label>
          <select value={conditionType} onChange={(e) => setConditionType(e.target.value)}
            className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-blue bg-white">
            {Object.entries(CONDITION_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        </div>
        {conditionType !== 'course_complete' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ruwad-navy">القيمة المطلوبة</label>
            <input type="number" min={0} max={100} value={conditionValue} onChange={(e) => setConditionValue(e.target.value)}
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 outline-none focus:border-ruwad-blue" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ruwad-navy">مستوى الندرة</label>
        <div className="grid grid-cols-3 gap-2">
          {(['common', 'rare', 'epic'] as BadgeRarity[]).map((r) => (
            <button key={r} type="button" onClick={() => setRarity(r)}
              className={`py-2 rounded-ruwad-sm text-sm font-semibold border-2 transition ${
                rarity === r ? 'bg-ruwad-blue text-white border-ruwad-blue' : 'bg-white text-ruwad-navy border-ruwad-gray'
              }`}>
              {r === 'common' ? 'عادية' : r === 'rare' ? 'نادرة' : 'أسطورية'}
            </button>
          ))}
        </div>
        <p className="text-xs text-ruwad-navy/50">هذه الشارة خاصة بطلابك فقط ولن تظهر لطلاب مدربين آخرين.</p>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
          {loading ? 'جارٍ الإنشاء...' : 'إنشاء الشارة'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-6 py-2.5 rounded-ruwad-sm font-semibold text-ruwad-navy/60 hover:bg-ruwad-gray/30 transition">
          إلغاء
        </button>
      </div>
    </form>
  )
}
