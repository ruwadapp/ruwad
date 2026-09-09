'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PlatformAdCard, type Ad } from '@/components/shared/PlatformAdCard'
import { Plus, Trash2, Pencil, Eye, EyeOff, X, Save, Check } from 'lucide-react'

type AdRow = {
  id: string; title: string; body: string | null; badge: string | null; badge_big: boolean
  image_url: string | null; style: string; button_text: string | null
  button_type: string; button_value: string | null; target_roles: string[] | null
  starts_at: string; ends_at: string | null; frequency_hours: number
  max_dismissals: number; is_active: boolean; created_at: string
}

const ROLES = [
  { v: 'student', label: 'الطلاب' },
  { v: 'trainer', label: 'المدربون' },
  { v: 'institute_admin', label: 'المعاهد' },
]

const inputCls = 'border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition w-full bg-white'
const labelCls = 'block text-[11px] font-bold text-ruwad-navy/60 mb-1'

function empty(): Partial<AdRow> {
  return {
    title: '', body: '', badge: '', badge_big: false,
    image_url: '', style: 'gradient', button_text: '', button_type: 'url', button_value: '',
    target_roles: null, frequency_hours: 24, max_dismissals: 3,
    starts_at: new Date().toISOString().slice(0, 16), ends_at: '', is_active: true,
  }
}

export function AdsManager({ initial }: { initial: AdRow[] }) {
  const [ads, setAds] = useState(initial)
  const [form, setForm] = useState<Partial<AdRow> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const F = (k: keyof AdRow, v: unknown) => setForm((p) => ({ ...p!, [k]: v }))

  async function save() {
    if (!form?.title?.trim()) { setError('العنوان مطلوب'); return }
    setError(null); setSaving(true)
    const payload = {
      title: form.title!.trim(),
      body: form.body?.trim() || null,
      badge: form.badge?.trim() || null,
      badge_big: form.badge_big ?? false,
      image_url: form.image_url?.trim() || null,
      style: form.style || 'gradient',
      button_text: form.button_text?.trim() || null,
      button_type: form.button_type || 'url',
      button_value: form.button_value?.trim() || null,
      target_roles: form.target_roles?.length ? form.target_roles : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      frequency_hours: Number(form.frequency_hours) || 24,
      max_dismissals: Number(form.max_dismissals) || 3,
      is_active: form.is_active ?? true,
    }
    if (form.id) {
      const { error: e } = await supabase.from('platform_ads').update(payload).eq('id', form.id)
      if (e) { setError(e.message); setSaving(false); return }
      setAds(ads.map((a) => a.id === form.id ? { ...a, ...payload } as AdRow : a))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: e } = await supabase.from('platform_ads').insert({ ...payload, created_by: user!.id }).select().single()
      if (e || !data) { setError(e?.message ?? 'خطأ'); setSaving(false); return }
      setAds([data as AdRow, ...ads])
    }
    setSaving(false); setForm(null); router.refresh()
  }

  async function toggle(ad: AdRow) {
    const { error: e } = await supabase.from('platform_ads').update({ is_active: !ad.is_active }).eq('id', ad.id)
    if (!e) setAds(ads.map((a) => a.id === ad.id ? { ...a, is_active: !a.is_active } : a))
  }

  async function del(id: string) {
    if (!confirm('حذف هذا الإعلان نهائياً؟')) return
    const { error: e } = await supabase.from('platform_ads').delete().eq('id', id)
    if (!e) setAds(ads.filter((a) => a.id !== id))
  }

  const previewAd = form ? {
    id: 'preview', title: form.title || 'عنوان الإعلان', body: form.body || null,
    badge: form.badge || null, badge_big: form.badge_big ?? false,
    image_url: form.image_url || null, style: form.style as Ad['style'] || 'gradient',
    button_text: form.button_text || null, button_type: form.button_type as Ad['button_type'] || 'url',
    button_value: form.button_value || null, dismissed_count: 0,
  } as Ad : null

  return (
    <div className="flex flex-col gap-5">
      {/* ===== الترويسة ===== */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ruwad-navy/60">{ads.length} إعلان</p>
        <button onClick={() => setForm(empty())}
          className="flex items-center gap-1.5 bg-ruwad-blue text-white font-bold text-sm px-5 py-2.5 rounded-ruwad-sm hover:opacity-90 transition">
          <Plus size={15} /> إعلان جديد
        </button>
      </div>

      {/* ===== نموذج الإنشاء/التعديل ===== */}
      {form && (
        <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-4 border-2 border-ruwad-blue/30">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-ruwad-navy">{form.id ? 'تعديل الإعلان' : 'إعلان جديد'}</h3>
            <button onClick={() => setForm(null)} className="text-ruwad-navy/40 hover:text-ruwad-navy"><X size={18} /></button>
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-2.5">{error}</div>}

          {/* المحتوى */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>العنوان *</label>
              <input value={form.title ?? ''} onChange={(e) => F('title', e.target.value)} className={inputCls} placeholder="نص الإعلان الرئيسي" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>النص التفصيلي (اختياري)</label>
              <textarea rows={2} value={form.body ?? ''} onChange={(e) => F('body', e.target.value)} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={labelCls}>الوسم / الرقم الضخم (مثال: "50%" أو "عرض محدود")</label>
              <input value={form.badge ?? ''} onChange={(e) => F('badge', e.target.value)} className={inputCls} placeholder="خصم 30%" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-ruwad-navy">
                <button type="button" onClick={() => F('badge_big', !form.badge_big)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.badge_big ? 'bg-ruwad-blue' : 'bg-ruwad-gray'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.badge_big ? 'right-0.5' : 'right-5'}`} />
                </button>
                الوسم بخط ضخم جداً (خصومات)
              </label>
            </div>
          </div>

          {/* الشكل */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>نوع التصميم</label>
              <select value={form.style ?? 'gradient'} onChange={(e) => F('style', e.target.value)} className={inputCls}>
                <option value="gradient">تدرج ملوّن</option>
                <option value="image">صورة مع fade</option>
                <option value="dark">داكن كحلي</option>
              </select>
            </div>
            {(form.style === 'image') && (
              <div className="sm:col-span-2">
                <label className={labelCls}>رابط الصورة</label>
                <input value={form.image_url ?? ''} onChange={(e) => F('image_url', e.target.value)} className={inputCls} dir="ltr" placeholder="https://..." />
              </div>
            )}
          </div>

          {/* الزر */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>نوع الزر</label>
              <select value={form.button_type ?? 'url'} onChange={(e) => F('button_type', e.target.value)} className={inputCls}>
                <option value="url">رابط</option>
                <option value="whatsapp">مراسلة واتساب</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>نص الزر</label>
              <input value={form.button_text ?? ''} onChange={(e) => F('button_text', e.target.value)} className={inputCls} placeholder="اشترك الآن" />
            </div>
            <div>
              <label className={labelCls}>{form.button_type === 'whatsapp' ? 'رقم واتساب (بصيغة دولية)' : 'الرابط'}</label>
              <input value={form.button_value ?? ''} onChange={(e) => F('button_value', e.target.value)} className={inputCls} dir="ltr"
                placeholder={form.button_type === 'whatsapp' ? '9639xxxxxxxx' : 'https://'} />
            </div>
          </div>

          {/* الجمهور */}
          <div>
            <label className={labelCls}>الجمهور المستهدف (فارغ = الجميع)</label>
            <div className="flex items-center gap-3 flex-wrap mt-1">
              {ROLES.map((r) => (
                <label key={r.v} className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-ruwad-navy">
                  <input type="checkbox"
                    checked={(form.target_roles ?? []).includes(r.v)}
                    onChange={(e) => {
                      const cur = form.target_roles ?? []
                      F('target_roles', e.target.checked ? [...cur, r.v] : cur.filter((x) => x !== r.v))
                    }}
                    className="rounded" />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          {/* التوقيت */}
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>يبدأ من</label>
              <input type="datetime-local" value={form.starts_at?.slice(0, 16) ?? ''} onChange={(e) => F('starts_at', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>ينتهي في (اختياري)</label>
              <input type="datetime-local" value={form.ends_at?.slice(0, 16) ?? ''} onChange={(e) => F('ends_at', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>تكرار العرض (ساعة)</label>
              <input type="number" min={1} max={720} value={form.frequency_hours ?? 24} onChange={(e) => F('frequency_hours', +e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>حد الإخفاءات</label>
              <input type="number" min={1} max={100} value={form.max_dismissals ?? 3} onChange={(e) => F('max_dismissals', +e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* معاينة + حفظ */}
          {previewAd && (
            <div>
              <label className={labelCls}>معاينة حية</label>
              <div className="max-w-sm">
                <PlatformAdCard ad={previewAd} onDismiss={() => {}} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-ruwad-blue text-white font-bold text-sm px-6 py-2.5 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-50">
              <Save size={15} /> {saving ? 'جارٍ الحفظ...' : form.id ? 'حفظ التعديلات' : 'نشر الإعلان'}
            </button>
            <button onClick={() => setForm(null)} className="text-sm font-semibold text-ruwad-navy/50 px-3 py-2.5 hover:text-ruwad-navy transition">إلغاء</button>
          </div>
        </div>
      )}

      {/* ===== قائمة الإعلانات ===== */}
      {ads.length === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/50">لا توجد إعلانات بعد.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {ads.map((ad) => {
            const expired = ad.ends_at && new Date(ad.ends_at) < new Date()
            return (
              <div key={ad.id} className={`bg-white rounded-ruwad shadow-card p-4 flex items-center gap-4 ${!ad.is_active || expired ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-ruwad-navy truncate">{ad.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ad.is_active && !expired ? 'bg-green-50 text-green-600' : 'bg-ruwad-gray/40 text-ruwad-navy/50'}`}>
                      {expired ? 'منتهي' : ad.is_active ? 'نشط' : 'موقوف'}
                    </span>
                    <span className="text-[10px] font-bold bg-ruwad-blue/10 text-ruwad-blue px-2 py-0.5 rounded-full">
                      {ad.target_roles ? ad.target_roles.map((r) => ROLES.find((x) => x.v === r)?.label).join('، ') : 'الجميع'}
                    </span>
                    <span className="text-[10px] text-ruwad-navy/40">كل {ad.frequency_hours}س · حد {ad.max_dismissals} إخفاء</span>
                  </div>
                  {ad.body && <p className="text-xs text-ruwad-navy/50 mt-0.5 truncate">{ad.body}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggle(ad)} aria-label={ad.is_active ? 'إيقاف' : 'تفعيل'}
                    className={`p-2 rounded-ruwad-sm transition ${ad.is_active ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}>
                    {ad.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => setForm({ ...ad })} aria-label="تعديل"
                    className="p-2 rounded-ruwad-sm text-ruwad-blue bg-ruwad-blue/10 hover:bg-ruwad-blue/20 transition">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => del(ad.id)} aria-label="حذف"
                    className="p-2 rounded-ruwad-sm text-red-400 hover:text-red-500 hover:bg-red-50 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
