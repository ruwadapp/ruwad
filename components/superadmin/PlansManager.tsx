'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlatformPlan } from '@/lib/plans'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, X, Loader2,
  CheckCircle2, Star, Globe2, AlertTriangle,
} from 'lucide-react'

/* بطاقات الخطط هنا معاينة حية مطابقة للصفحة التسويقية:
   ما تراه هنا هو ما يراه الزائر تماماً — نفس الألوان ونفس التمييز. */

const num = (v: unknown) => Number(v) || 0

export function PlansManager({ initial }: { initial: PlatformPlan[] }) {
  const [rows, setRows] = useState<PlatformPlan[]>(
    initial.map((p) => ({ ...p, monthly_price: num(p.monthly_price), yearly_price: num(p.yearly_price) }))
  )
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [editing, setEditing] = useState<PlatformPlan | 'new' | null>(null)
  const [armedDelete, setArmedDelete] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const supabase = createClient()

  const sorted = useMemo(() => [...rows].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)), [rows])

  async function toggleActive(p: PlatformPlan) {
    setBusy(p.id); setError('')
    const { error: err } = await supabase.from('platform_plans').update({ is_active: !p.is_active }).eq('id', p.id)
    setBusy(null)
    if (err) return setError('تعذّر تغيير حالة الخطة')
    setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, is_active: !p.is_active } : r)))
  }

  async function remove(p: PlatformPlan) {
    if (armedDelete !== p.id) {
      setArmedDelete(p.id)
      setTimeout(() => setArmedDelete((cur) => (cur === p.id ? null : cur)), 3500)
      return
    }
    setBusy(p.id); setArmedDelete(null); setError('')
    const { error: err } = await supabase.from('platform_plans').delete().eq('id', p.id)
    setBusy(null)
    if (err) return setError('تعذّر حذف الخطة')
    setRows((prev) => prev.filter((r) => r.id !== p.id))
  }

  async function move(p: PlatformPlan, dir: -1 | 1) {
    const i = sorted.findIndex((r) => r.id === p.id)
    const j = i + dir
    if (j < 0 || j >= sorted.length) return
    // إعادة ترقيم متسلسل بعد التبديل — يحمينا أيضاً من أي تكرار قديم في sort_order
    const next = [...sorted]
    ;[next[i], next[j]] = [next[j], next[i]]
    const renumbered = next.map((r, idx) => ({ ...r, sort_order: idx + 1 }))
    const changed = renumbered.filter((r) => rows.find((o) => o.id === r.id)?.sort_order !== r.sort_order)
    setBusy(p.id); setError('')
    const results = await Promise.all(
      changed.map((r) => supabase.from('platform_plans').update({ sort_order: r.sort_order }).eq('id', r.id))
    )
    setBusy(null)
    if (results.some((r) => r.error)) return setError('تعذّر حفظ الترتيب')
    setRows(renumbered)
  }

  function onSaved(saved: PlatformPlan, clearedOthersPopular: boolean) {
    setRows((prev) => {
      const exists = prev.some((r) => r.id === saved.id)
      const base = exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [...prev, saved]
      return clearedOthersPopular ? base.map((r) => (r.id === saved.id ? r : { ...r, is_popular: false })) : base
    })
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      {/* شريط علوي: معاينة الفوترة + إضافة */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white border-2 border-ruwad-gray rounded-ruwad-sm p-1">
          {(['monthly', 'yearly'] as const).map((b) => (
            <button key={b} onClick={() => setBilling(b)}
              className={`px-4 py-2 rounded-lg text-sm font-extrabold transition ${billing === b ? 'bg-ruwad-navy text-white' : 'text-ruwad-navy/60 hover:text-ruwad-navy'}`}>
              {b === 'monthly' ? 'معاينة شهرية' : 'معاينة سنوية'}
            </button>
          ))}
        </div>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-2 bg-ruwad-blue text-white font-extrabold px-5 py-2.5 rounded-ruwad-sm border-2 border-ruwad-navy shadow-hard hover-pop">
          <Plus size={17} /> إضافة خطة
        </button>
      </div>

      <p className="text-xs font-bold text-ruwad-navy/50 -mt-2">
        كل تعديل هنا يظهر فوراً في الصفحة الرئيسية وفي نوافذ تعيين خطط الحسابات والبوابات.
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm font-bold px-4 py-3 rounded-ruwad-sm border-2 border-red-200">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* بطاقات الخطط — معاينة مطابقة للصفحة التسويقية */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {sorted.map((plan, idx) => {
          const price = billing === 'monthly' ? plan.monthly_price : plan.yearly_price
          const hi = plan.is_popular
          return (
            <div key={plan.id}
              className={`relative rounded-ruwad p-6 flex flex-col gap-4 border-2 border-ruwad-navy shadow-hard transition ${
                hi ? 'bg-ruwad-navy text-white' : 'bg-white text-ruwad-navy'
              } ${plan.is_active ? '' : 'opacity-60'}`}>

              {hi && (
                <span className="absolute -top-3.5 right-1/2 translate-x-1/2 flex items-center gap-1 bg-ruwad-lime text-ruwad-navy text-[11px] font-extrabold px-3 py-1 rounded-full border-2 border-ruwad-navy rotate-2">
                  <Star size={11} className="fill-ruwad-navy" /> الأكثر طلباً
                </span>
              )}

              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-extrabold">{plan.name}</h3>
                  <p className={`text-xs mt-0.5 font-bold ${hi ? 'text-white/70' : 'text-ruwad-navy/60'}`}>{plan.tagline}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {!plan.is_active && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">مخفية</span>
                  )}
                  {plan.is_portal && (
                    <span className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${hi ? 'bg-white/10 text-white border-white/30' : 'bg-ruwad-blue/10 text-ruwad-blue border-ruwad-blue/30'}`}>
                      <Globe2 size={10} /> بوابة
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold">${price}</span>
                <span className={`text-xs font-bold ${hi ? 'text-white/60' : 'text-ruwad-navy/50'}`}>/ {billing === 'monthly' ? 'شهرياً' : 'سنوياً'}</span>
              </div>

              <ul className="flex flex-col gap-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] font-semibold">
                    <CheckCircle2 size={15} className={`shrink-0 ${hi ? 'text-ruwad-lime' : 'text-ruwad-blue'}`} /> {f}
                  </li>
                ))}
              </ul>

              {/* أدوات التحكم */}
              <div className={`flex items-center gap-1.5 pt-3 border-t-2 ${hi ? 'border-white/15' : 'border-ruwad-gray'}`}>
                <button onClick={() => setEditing(plan)} title="تعديل"
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-extrabold py-2 rounded-lg bg-ruwad-blue text-white hover:opacity-90 transition">
                  <Pencil size={13} /> تعديل
                </button>
                <button onClick={() => toggleActive(plan)} title={plan.is_active ? 'إخفاء من الصفحة الرئيسية' : 'إظهار في الصفحة الرئيسية'}
                  className={`p-2 rounded-lg border-2 transition ${hi ? 'border-white/25 hover:bg-white/10' : 'border-ruwad-gray hover:bg-ruwad-gray/40'}`}>
                  {busy === plan.id ? <Loader2 size={14} className="animate-spin" /> : plan.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => move(plan, -1)} disabled={idx === 0} title="تقديم"
                  className={`p-2 rounded-lg border-2 disabled:opacity-30 transition ${hi ? 'border-white/25 hover:bg-white/10' : 'border-ruwad-gray hover:bg-ruwad-gray/40'}`}>
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => move(plan, 1)} disabled={idx === sorted.length - 1} title="تأخير"
                  className={`p-2 rounded-lg border-2 disabled:opacity-30 transition ${hi ? 'border-white/25 hover:bg-white/10' : 'border-ruwad-gray hover:bg-ruwad-gray/40'}`}>
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => remove(plan)} title="حذف"
                  className={`p-2 rounded-lg border-2 transition ${armedDelete === plan.id ? 'bg-red-500 text-white border-red-500' : `${hi ? 'border-white/25 hover:bg-white/10' : 'border-ruwad-gray hover:bg-red-50'} text-red-400`}`}>
                  <Trash2 size={14} />
                </button>
              </div>
              {armedDelete === plan.id && (
                <p className="text-[11px] font-extrabold text-red-400 -mt-2">اضغط الحذف مرة أخرى للتأكيد</p>
              )}
            </div>
          )
        })}
      </div>

      {editing && (
        <PlanEditor
          plan={editing === 'new' ? null : editing}
          nextSort={(sorted[sorted.length - 1]?.sort_order ?? 0) + 1}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

/* ================= نافذة تحرير خطة ================= */

function PlanEditor({ plan, nextSort, onClose, onSaved }: {
  plan: PlatformPlan | null
  nextSort: number
  onClose: () => void
  onSaved: (saved: PlatformPlan, clearedOthersPopular: boolean) => void
}) {
  const [name, setName] = useState(plan?.name ?? '')
  const [nameEn, setNameEn] = useState(plan?.name_en ?? '')
  const [tagline, setTagline] = useState(plan?.tagline ?? '')
  const [taglineEn, setTaglineEn] = useState(plan?.tagline_en ?? '')
  const [monthly, setMonthly] = useState(plan ? String(num(plan.monthly_price)) : '')
  const [yearly, setYearly] = useState(plan ? String(num(plan.yearly_price)) : '')
  const [featAr, setFeatAr] = useState((plan?.features ?? []).join('\n'))
  const [featEn, setFeatEn] = useState((plan?.features_en ?? []).join('\n'))
  const [popular, setPopular] = useState(plan?.is_popular ?? false)
  const [portal, setPortal] = useState(plan?.is_portal ?? false)
  const [active, setActive] = useState(plan?.is_active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const wasPopular = plan?.is_popular ?? false
  const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)

  // اقتراح السعر السنوي تلقائياً = شهري × 10 (وفّر شهرين) إن تُرك فارغاً
  function suggestYearly() {
    if (!yearly.trim() && Number(monthly) > 0) setYearly(String(Math.round(Number(monthly) * 10)))
  }

  async function save() {
    if (!name.trim()) return setError('اسم الخطة بالعربية مطلوب')
    if (!(Number(monthly) > 0) || !(Number(yearly) > 0)) return setError('السعران الشهري والسنوي مطلوبان')
    if (lines(featAr).length === 0) return setError('أضف ميزة واحدة على الأقل')
    setSaving(true); setError('')

    const payload = {
      name: name.trim(),
      name_en: nameEn.trim(),
      tagline: tagline.trim(),
      tagline_en: taglineEn.trim(),
      monthly_price: Number(monthly),
      yearly_price: Number(yearly),
      features: lines(featAr),
      features_en: lines(featEn),
      is_popular: popular,
      is_portal: portal,
      is_active: active,
    }

    const q = plan
      ? supabase.from('platform_plans').update(payload).eq('id', plan.id).select().single()
      : supabase.from('platform_plans').insert({ ...payload, sort_order: nextSort }).select().single()
    const { data, error: err } = await q

    let clearedOthers = false
    if (!err && data && popular && !wasPopular) {
      // خطة واحدة فقط تحمل "الأكثر طلباً"
      await supabase.from('platform_plans').update({ is_popular: false }).neq('id', data.id)
      clearedOthers = true
    }
    setSaving(false)
    if (err || !data) return setError('تعذّر الحفظ — تأكد من صلاحياتك')
    onSaved({ ...data, monthly_price: num(data.monthly_price), yearly_price: num(data.yearly_price) }, clearedOthers)
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'
  const labelCls = 'text-xs font-extrabold text-ruwad-navy'

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-ruwad sm:rounded-ruwad max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray z-10">
          <h3 className="font-extrabold text-ruwad-navy">{plan ? `تعديل خطة — ${plan.name}` : 'خطة جديدة'}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>الاسم (عربي)</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="مثال: معهد" />
            </label>
            <label className="flex flex-col gap-1.5" dir="ltr">
              <span className={`${labelCls} text-right`} dir="rtl">الاسم (إنجليزي)</span>
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputCls} placeholder="Institute" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>الوصف المختصر (عربي)</span>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} placeholder="لفريق مدربين تحت مظلة واحدة" />
            </label>
            <label className="flex flex-col gap-1.5" dir="ltr">
              <span className={`${labelCls} text-right`} dir="rtl">الوصف المختصر (إنجليزي)</span>
              <input value={taglineEn} onChange={(e) => setTaglineEn(e.target.value)} className={inputCls} placeholder="For a team of trainers" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>السعر الشهري ($)</span>
              <input type="number" min={0} value={monthly} onChange={(e) => setMonthly(e.target.value)} onBlur={suggestYearly} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>السعر السنوي ($) <span className="text-ruwad-navy/40">— يُقترح ×10 تلقائياً</span></span>
              <input type="number" min={0} value={yearly} onChange={(e) => setYearly(e.target.value)} className={inputCls} />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>الميزات (عربي — ميزة في كل سطر)</span>
              <textarea rows={5} value={featAr} onChange={(e) => setFeatAr(e.target.value)} className={`${inputCls} resize-y leading-7`} />
            </label>
            <label className="flex flex-col gap-1.5" dir="ltr">
              <span className={`${labelCls} text-right`} dir="rtl">الميزات (إنجليزي — ميزة في كل سطر)</span>
              <textarea rows={5} value={featEn} onChange={(e) => setFeatEn(e.target.value)} className={`${inputCls} resize-y leading-7`} />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Toggle checked={popular} onChange={setPopular} label="الأكثر طلباً" hint="تُنزع من غيرها تلقائياً" />
            <Toggle checked={portal} onChange={setPortal} label="خطة بوابة" hint="تظهر في نافذة البوابات" />
            <Toggle checked={active} onChange={setActive} label="نشطة" hint="ظاهرة في الصفحة الرئيسية" />
          </div>

          {error && <p className="text-sm font-bold text-red-500">{error}</p>}

          <button onClick={save} disabled={saving}
            className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
            {saving && <Loader2 size={15} className="animate-spin" />} حفظ الخطة
          </button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label, hint }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; hint: string
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-ruwad-sm border-2 text-right transition ${
        checked ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray hover:border-ruwad-navy/40'
      }`}>
      <span className="text-xs font-extrabold">{label}</span>
      <span className={`text-[10px] font-bold ${checked ? 'text-white/60' : 'text-ruwad-navy/40'}`}>{hint}</span>
    </button>
  )
}
