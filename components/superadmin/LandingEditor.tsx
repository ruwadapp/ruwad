'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { mergeLanding, type LandingContent } from '@/lib/portal/landing'
import {
  Save, Check, Eye, Image as ImageIcon, Plus, Trash2, ArrowUp, ArrowDown,
  ToggleLeft, ToggleRight, Upload, X, Loader2,
} from 'lucide-react'

const inputCls = 'w-full border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition bg-white'
const labelCls = 'block text-xs font-bold text-ruwad-navy/60 mb-1'
const SECTION_LABELS: Record<string, string> = {
  hero: 'الهيرو (البانر الرئيسي)', stats: 'شريط الإحصاءات', courses: 'التدريبات المتاحة',
  about: 'من نحن', news: 'آخر الأخبار', testimonials: 'آراء الطلاب', cta: 'البانر الختامي', inquiry: 'نموذج الاستفسار',
}
const SECTION_KEYS = Object.keys(SECTION_LABELS) as (keyof LandingContent['sections'])[]

// ===== رفع صورة على Supabase Storage (bucket: portal-assets) =====
function useImageUploader(portalId: string) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()
  async function upload(file: File): Promise<string | null> {
    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${portalId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('portal-assets').upload(path, file, { upsert: true })
    setUploading(false)
    if (error) { alert('فشل رفع الصورة: ' + error.message); return null }
    const { data } = supabase.storage.from('portal-assets').getPublicUrl(path)
    return data.publicUrl
  }
  return { upload, uploading }
}

function UploadButton({ onUrl, portalId, label = 'رفع صورة' }: { onUrl: (url: string) => void; portalId: string; label?: string }) {
  const { upload, uploading } = useImageUploader(portalId)
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await upload(f); if (u) onUrl(u) } }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
        className="flex items-center gap-1.5 text-xs font-bold text-ruwad-blue border border-ruwad-blue/30 bg-ruwad-blue/5 rounded-ruwad-sm px-3 py-2 hover:bg-ruwad-blue/10 transition disabled:opacity-50">
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} {uploading ? 'جارٍ الرفع...' : label}
      </button>
    </>
  )
}

// ===== محرر صفحة الهبوط الكاملة — Super Admin فقط =====
export function LandingEditor({ portalId, portalSubdomain, initialLanding }: {
  portalId: string
  portalSubdomain: string
  initialLanding: unknown
}) {
  const [L, setL] = useState<LandingContent>(() => mergeLanding(initialLanding))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const set = <K extends keyof LandingContent>(key: K, val: LandingContent[K]) => {
    setL((p) => ({ ...p, [key]: val })); setSaved(false)
  }
  const setH = (val: Partial<LandingContent['hero']>) => set('hero', { ...L.hero, ...val })
  const setA = (val: Partial<LandingContent['about']>) => set('about', { ...L.about, ...val })
  const setC = (val: Partial<LandingContent['cta']>) => set('cta', { ...L.cta, ...val })
  const setFtr = (val: Partial<LandingContent['footer']>) => set('footer', { ...L.footer, ...val })
  const setSoc = (key: keyof LandingContent['footer']['socials'], val: string) =>
    setFtr({ socials: { ...L.footer.socials, [key]: val } })

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('institute_portals').update({ landing: L }).eq('id', portalId)
    setSaving(false)
    if (error) { alert('فشل الحفظ: ' + error.message); return }
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ===== شريط الحفظ الثابت ===== */}
      <div className="sticky top-0 z-20 bg-white border border-ruwad-gray/40 rounded-ruwad-sm px-4 py-3 flex items-center gap-3 shadow-card">
        <a href={`https://${portalSubdomain}.ruwaad.app`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-bold text-ruwad-navy/50 hover:text-ruwad-blue transition">
          <Eye size={14} /> معاينة حية
        </a>
        <span className="flex-1" />
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-ruwad-blue text-white font-bold text-sm px-5 py-2.5 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-50 shadow-ruwad">
          {saved ? <><Check size={15} /> حُفظ</> : <><Save size={15} /> {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</>}
        </button>
      </div>

      {/* ===== مفاتيح الأقسام ===== */}
      <section className="bg-white rounded-ruwad shadow-card p-5">
        <h3 className="font-extrabold text-ruwad-navy mb-4">الأقسام — إظهار / إخفاء</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SECTION_KEYS.map((k) => (
            <button key={k} type="button" onClick={() => set('sections', { ...L.sections, [k]: !L.sections[k] })}
              className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-ruwad-sm transition ${L.sections[k] ? 'bg-ruwad-blue text-white' : 'bg-ruwad-gray/20 text-ruwad-navy/50 hover:bg-ruwad-gray/30'}`}>
              {L.sections[k] ? <ToggleRight size={14} /> : <ToggleLeft size={14} />} {SECTION_LABELS[k]}
            </button>
          ))}
        </div>
      </section>

      {/* ===== الهيرو ===== */}
      {L.sections.hero && (
        <section className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-4">
          <h3 className="font-extrabold text-ruwad-navy">الهيرو</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className={labelCls}>العنوان الرئيسي</label><input value={L.hero.headline} onChange={(e) => setH({ headline: e.target.value })} className={inputCls} placeholder="اسم المعهد (الافتراضي)" /></div>
            <div><label className={labelCls}>الوصف / التاقلاين</label><input value={L.hero.tagline} onChange={(e) => setH({ tagline: e.target.value })} className={inputCls} placeholder="وصف المعهد (الافتراضي)" /></div>
            <div><label className={labelCls}>نص زر التسجيل</label><input value={L.hero.cta_text} onChange={(e) => setH({ cta_text: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>مدة تبديل السلايدر (ثواني)</label><input type="number" min={2} max={30} value={L.hero.slide_interval_s} onChange={(e) => setH({ slide_interval_s: +e.target.value })} className={inputCls} /></div>
          </div>

          {/* إدارة السلايدر */}
          <div>
            <label className={labelCls}>صور السلايدر (تُخزَّن على Supabase — أضف حتى ٦)</label>
            <div className="flex flex-col gap-2 mt-1">
              {L.hero.slides.map((url, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#F5F6FA] rounded-ruwad-sm px-3 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-12 h-8 object-cover rounded shrink-0" onError={(e) => (e.currentTarget.style.display='none')} />
                  <span className="flex-1 text-xs text-ruwad-navy/60 truncate" dir="ltr">{url}</span>
                  <button type="button" onClick={() => setH({ slides: L.hero.slides.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                  <button type="button" disabled={i === 0} onClick={() => { const s=[...L.hero.slides];[s[i-1],s[i]]=[s[i],s[i-1]];setH({slides:s}) }} className="text-ruwad-navy/40 hover:text-ruwad-navy disabled:opacity-25"><ArrowUp size={13} /></button>
                  <button type="button" disabled={i === L.hero.slides.length-1} onClick={() => { const s=[...L.hero.slides];[s[i],s[i+1]]=[s[i+1],s[i]];setH({slides:s}) }} className="text-ruwad-navy/40 hover:text-ruwad-navy disabled:opacity-25"><ArrowDown size={13} /></button>
                </div>
              ))}
              {L.hero.slides.length < 6 && (
                <UploadButton portalId={portalId} label="رفع صورة سلايدر"
                  onUrl={(u) => setH({ slides: [...L.hero.slides, u] })} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== الإحصاءات ===== */}
      {L.sections.stats && (
        <section className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-3">
          <h3 className="font-extrabold text-ruwad-navy">الإحصاءات</h3>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-ruwad-navy">
            <button type="button" onClick={() => set('stats', { ...L.stats, auto: !L.stats.auto })}
              className={`w-11 h-6 rounded-full transition-colors ${L.stats.auto ? 'bg-ruwad-blue' : 'bg-ruwad-gray'} relative`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${L.stats.auto ? 'right-0.5' : 'right-5'}`} />
            </button>
            {L.stats.auto ? 'تلقائي من قاعدة البيانات (كورسات + طلاب + شهادات)' : 'أرقام يدوية'}
          </label>
          {!L.stats.auto && (
            <div className="flex flex-col gap-2">
              {L.stats.manual.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={m.value} onChange={(e) => { const a=[...L.stats.manual];a[i]={...a[i],value:e.target.value};set('stats',{...L.stats,manual:a}) }} placeholder="500+" className={`${inputCls} w-28 shrink-0`} />
                  <input value={m.label} onChange={(e) => { const a=[...L.stats.manual];a[i]={...a[i],label:e.target.value};set('stats',{...L.stats,manual:a}) }} placeholder="طالب" className={inputCls} />
                  <button type="button" onClick={() => set('stats',{...L.stats,manual:L.stats.manual.filter((_,j)=>j!==i)})} className="text-red-400 shrink-0"><X size={15} /></button>
                </div>
              ))}
              {L.stats.manual.length < 4 && (
                <button type="button" onClick={() => set('stats',{...L.stats,manual:[...L.stats.manual,{label:'',value:''}]})}
                  className="self-start flex items-center gap-1 text-xs font-bold text-ruwad-blue"><Plus size={13} /> إضافة إحصائية</button>
              )}
            </div>
          )}
        </section>
      )}

      {/* ===== من نحن ===== */}
      {L.sections.about && (
        <section className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-3">
          <h3 className="font-extrabold text-ruwad-navy">من نحن</h3>
          <div><label className={labelCls}>العنوان</label><input value={L.about.title} onChange={(e) => setA({title:e.target.value})} className={inputCls} /></div>
          <div><label className={labelCls}>النص</label><textarea rows={4} value={L.about.body} onChange={(e) => setA({body:e.target.value})} className={`${inputCls} resize-none`} placeholder="وصف المعهد (الافتراضي إن تُرك فارغًا)" /></div>
          <div>
            <label className={labelCls}>صورة القسم</label>
            {L.about.image_url && (
              <div className="relative w-32 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={L.about.image_url} alt="" className="w-full h-20 object-cover rounded-ruwad-sm" />
                <button type="button" onClick={() => setA({image_url:''})} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"><X size={11} /></button>
              </div>
            )}
            <UploadButton portalId={portalId} onUrl={(u) => setA({image_url:u})} />
          </div>
        </section>
      )}

      {/* ===== آراء الطلاب ===== */}
      {L.sections.testimonials && (
        <section className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-3">
          <h3 className="font-extrabold text-ruwad-navy">آراء الطلاب</h3>
          {L.testimonials.map((t, i) => (
            <div key={i} className="border border-ruwad-gray/40 rounded-ruwad-sm p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ruwad-navy/50">رأي #{i+1}</span>
                <button type="button" onClick={() => set('testimonials',L.testimonials.filter((_,j)=>j!==i))} className="text-red-400"><Trash2 size={13} /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <input value={t.name} onChange={(e)=>{const a=[...L.testimonials];a[i]={...a[i],name:e.target.value};set('testimonials',a)}} placeholder="الاسم" className={inputCls} />
                <input value={t.role} onChange={(e)=>{const a=[...L.testimonials];a[i]={...a[i],role:e.target.value};set('testimonials',a)}} placeholder="الدور (طالب، مصمم...)" className={inputCls} />
              </div>
              <textarea rows={2} value={t.text} onChange={(e)=>{const a=[...L.testimonials];a[i]={...a[i],text:e.target.value};set('testimonials',a)}} placeholder="نص الرأي" className={`${inputCls} resize-none`} />
              <div className="flex items-center gap-2">
                {t.avatar_url && <img src={t.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />}
                <UploadButton portalId={portalId} label="صورة الطالب (اختياري)" onUrl={(u)=>{const a=[...L.testimonials];a[i]={...a[i],avatar_url:u};set('testimonials',a)}} />
              </div>
            </div>
          ))}
          {L.testimonials.length < 6 && (
            <button type="button" onClick={() => set('testimonials',[...L.testimonials,{name:'',role:'',text:'',avatar_url:''}])}
              className="self-start flex items-center gap-1 text-xs font-bold text-ruwad-blue border border-ruwad-blue/30 bg-ruwad-blue/5 rounded-ruwad-sm px-3 py-2 hover:bg-ruwad-blue/10 transition">
              <Plus size={13} /> إضافة رأي
            </button>
          )}
        </section>
      )}

      {/* ===== البانر الختامي ===== */}
      {L.sections.cta && (
        <section className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-3">
          <h3 className="font-extrabold text-ruwad-navy">البانر الختامي</h3>
          <div><label className={labelCls}>العنوان</label><input value={L.cta.title} onChange={(e)=>setC({title:e.target.value})} className={inputCls} placeholder="ابدأ رحلتك مع [اسم المعهد]" /></div>
          <div><label className={labelCls}>الوصف</label><input value={L.cta.subtitle} onChange={(e)=>setC({subtitle:e.target.value})} className={inputCls} /></div>
          <div><label className={labelCls}>نص الزر</label><input value={L.cta.button_text} onChange={(e)=>setC({button_text:e.target.value})} className={inputCls} /></div>
        </section>
      )}

      {/* ===== الفوتر ===== */}
      <section className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-4">
        <h3 className="font-extrabold text-ruwad-navy">الفوتر</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className={labelCls}>الهاتف</label><input value={L.footer.phone} onChange={(e)=>setFtr({phone:e.target.value})} className={inputCls} dir="ltr" /></div>
          <div><label className={labelCls}>البريد الإلكتروني</label><input value={L.footer.email} onChange={(e)=>setFtr({email:e.target.value})} className={inputCls} dir="ltr" /></div>
          <div><label className={labelCls}>العنوان</label><input value={L.footer.address} onChange={(e)=>setFtr({address:e.target.value})} className={inputCls} /></div>
        </div>
        <div>
          <label className={labelCls}>روابط التواصل الاجتماعي</label>
          <div className="grid sm:grid-cols-2 gap-2 mt-1">
            {(['facebook','instagram','whatsapp','telegram','youtube'] as const).map((k) => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-ruwad-navy/40 w-20 shrink-0">{k}</span>
                <input value={L.footer.socials[k]} onChange={(e)=>setSoc(k,e.target.value)} className={inputCls} dir="ltr" placeholder={k === 'whatsapp' ? 'رقم بصيغة دولية' : 'الرابط الكامل'} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
