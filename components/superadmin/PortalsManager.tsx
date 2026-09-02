'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Globe, Plus, X, Loader2, Pause, Play, ExternalLink, Trash2,
  Palette, Link2, RefreshCw, CheckCircle2, Copy, Users,
} from 'lucide-react'

/* ================================================================
   لوحة إدارة بوابات المعاهد (super_admin) — إنشاء، هوية بمعاينة حية،
   تفعيل/إيقاف/تمديد، وربط الدومينات الحقيقية عبر Vercel API
   ================================================================ */

interface Brand {
  primary?: string; secondary?: string; accent?: string
  logo_url?: string; display_name?: string
}
interface Portal {
  id: string; institute_id: string; subdomain: string
  custom_domain: string | null; domain_status: 'none' | 'pending_dns' | 'active'
  status: 'active' | 'suspended' | 'expired'
  expires_at: string | null; brand: Brand; notes: string | null
  institute: { name: string } | null
}

const DEFAULT_BRAND: Brand = { primary: '#3A4EFB', secondary: '#33A4FA', accent: '#E3FF3B' }

const STATUS_UI = {
  active: { label: 'نشطة', cls: 'bg-green-50 text-green-600', dot: 'bg-green-500' },
  suspended: { label: 'موقوفة', cls: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  expired: { label: 'منتهية', cls: 'bg-red-50 text-red-500', dot: 'bg-red-400' },
} as const

export function PortalsManager({ initial, institutes, signupCounts }: {
  initial: Portal[]
  institutes: { id: string; name: string }[]
  signupCounts: Record<string, number>
}) {
  const [portals, setPortals] = useState<Portal[]>(initial)
  const [editing, setEditing] = useState<Portal | 'new' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function toggleStatus(p: Portal) {
    const next = p.status === 'active' ? 'suspended' : 'active'
    const { error } = await supabase.from('institute_portals').update({ status: next }).eq('id', p.id)
    if (!error) setPortals((list) => list.map((x) => x.id === p.id ? { ...x, status: next } : x))
  }

  async function removePortal(p: Portal) {
    if (!confirm(`حذف بوابة "${p.institute?.name}" نهائياً؟\nسيتوقف ${p.subdomain}.ruwaad.app فوراً${p.custom_domain ? ` وسيُفكّ ربط ${p.custom_domain}` : ''}.`)) return
    if (p.custom_domain) {
      await fetch('/api/portals/domain', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ portalId: p.id, domain: p.custom_domain }) })
    }
    const { error } = await supabase.from('institute_portals').delete().eq('id', p.id)
    if (!error) setPortals((list) => list.filter((x) => x.id !== p.id))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ruwad-navy/60 font-medium">
          {portals.length} بوابة — التسجيلات عبر البوابات: {Object.values(signupCounts).reduce((a, b) => a + b, 0)}
        </p>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 bg-ruwad-blue text-white text-sm font-extrabold px-4 py-2.5 rounded-ruwad-sm hover:opacity-90 transition">
          <Plus size={16} /> بوابة جديدة
        </button>
      </div>

      {portals.length === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/50">
          لا بوابات بعد — أنشئ أول بوابة لمعهد من الزر أعلاه.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {portals.map((p) => {
            const st = STATUS_UI[p.status]
            const expired = p.expires_at && new Date(p.expires_at) < new Date()
            return (
              <div key={p.id} className="bg-white rounded-ruwad shadow-card overflow-hidden flex flex-col">
                <div className="h-2" style={{ background: `linear-gradient(90deg, ${p.brand?.primary ?? '#3A4EFB'}, ${p.brand?.secondary ?? '#33A4FA'})` }} />
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-ruwad-navy truncate">{p.brand?.display_name || p.institute?.name}</h3>
                      <p className="text-[11px] text-ruwad-navy/45 font-medium truncate">{p.institute?.name}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${expired ? STATUS_UI.expired.cls : st.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${expired ? STATUS_UI.expired.dot : st.dot} ${p.status === 'active' && !expired ? 'animate-pulse' : ''}`} />
                      {expired ? 'منتهية' : st.label}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-sm">
                    <a href={`https://${p.subdomain}.ruwaad.app`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-ruwad-blue font-bold hover:underline w-fit">
                      <Globe size={13} /> {p.subdomain}.ruwaad.app <ExternalLink size={11} />
                    </a>
                    {p.custom_domain && (
                      <span className="flex items-center gap-1.5 text-ruwad-navy/70 font-semibold">
                        <Link2 size={13} /> {p.custom_domain}
                        {p.domain_status === 'active'
                          ? <CheckCircle2 size={13} className="text-green-500" />
                          : <span className="text-[10px] text-amber-600 font-bold">بانتظار DNS</span>}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-ruwad-navy/50 font-bold">
                    <span className="flex items-center gap-1"><Users size={11} /> {signupCounts[p.id] ?? 0} تسجيل عبرها</span>
                    {p.expires_at && <span>تنتهي {new Date(p.expires_at).toLocaleDateString('ar')}</span>}
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-ruwad-gray/40">
                    <button onClick={() => setEditing(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-extrabold text-ruwad-navy bg-[#F5F6FA] hover:bg-ruwad-gray/50 rounded-ruwad-sm py-2 transition">
                      <Palette size={13} /> إدارة
                    </button>
                    <button onClick={() => toggleStatus(p)} title={p.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      className={`w-9 h-9 rounded-ruwad-sm flex items-center justify-center transition ${p.status === 'active' ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}>
                      {p.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => removePortal(p)} title="حذف"
                      className="w-9 h-9 rounded-ruwad-sm text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <PortalEditor
          portal={editing === 'new' ? null : editing}
          institutes={institutes}
          takenInstitutes={new Set(portals.map((p) => p.institute_id))}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh() }}
        />
      )}
    </div>
  )
}

/* ================= محرّر البوابة: هوية بمعاينة حية + الدومين ================= */

function PortalEditor({ portal, institutes, takenInstitutes, onClose, onSaved }: {
  portal: Portal | null
  institutes: { id: string; name: string }[]
  takenInstitutes: Set<string>
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const [instituteId, setInstituteId] = useState(portal?.institute_id ?? '')
  const [subdomain, setSubdomain] = useState(portal?.subdomain ?? '')
  const [displayName, setDisplayName] = useState(portal?.brand?.display_name ?? '')
  const [logoUrl, setLogoUrl] = useState(portal?.brand?.logo_url ?? '')
  const [primary, setPrimary] = useState(portal?.brand?.primary ?? DEFAULT_BRAND.primary!)
  const [secondary, setSecondary] = useState(portal?.brand?.secondary ?? DEFAULT_BRAND.secondary!)
  const [accent, setAccent] = useState(portal?.brand?.accent ?? DEFAULT_BRAND.accent!)
  const [expiresAt, setExpiresAt] = useState(portal?.expires_at ? portal.expires_at.slice(0, 10) : '')
  const [notes, setNotes] = useState(portal?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // الدومين الخاص
  const [domain, setDomain] = useState(portal?.custom_domain ?? '')
  const [domainStatus, setDomainStatus] = useState(portal?.domain_status ?? 'none')
  const [domainBusy, setDomainBusy] = useState(false)
  const [dnsInfo, setDnsInfo] = useState<{ type: string; name: string; value: string; note: string }[] | null>(null)

  const availableInstitutes = useMemo(
    () => institutes.filter((i) => i.id === portal?.institute_id || !takenInstitutes.has(i.id)),
    [institutes, takenInstitutes, portal],
  )

  async function save() {
    const sub = subdomain.trim().toLowerCase()
    if (!instituteId || !/^[a-z0-9]([a-z0-9-]{1,40}[a-z0-9])?$/.test(sub)) {
      setError('اختر المعهد واكتب subdomain صالحاً (أحرف إنجليزية صغيرة وأرقام وشرطات)')
      return
    }
    setSaving(true); setError('')
    const payload = {
      institute_id: instituteId,
      subdomain: sub,
      brand: { primary, secondary, accent, display_name: displayName.trim() || undefined, logo_url: logoUrl.trim() || undefined },
      expires_at: expiresAt ? new Date(expiresAt + 'T23:59:59').toISOString() : null,
      notes: notes.trim() || null,
    }
    const { error: err } = portal
      ? await supabase.from('institute_portals').update(payload).eq('id', portal.id)
      : await supabase.from('institute_portals').insert(payload)
    setSaving(false)
    if (err) {
      setError(err.message.includes('unique') || err.code === '23505'
        ? 'هذا الـ subdomain أو المعهد مستخدم في بوابة أخرى'
        : 'تعذّر الحفظ — تأكد من صلاحياتك')
      return
    }
    onSaved()
  }

  async function attachDomain() {
    if (!portal) return
    setDomainBusy(true); setError('')
    const res = await fetch('/api/portals/domain', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portalId: portal.id, domain }),
    })
    const body = await res.json()
    setDomainBusy(false)
    if (!res.ok) { setError(body.error === 'invalid_domain' ? 'صيغة الدومين غير صالحة' : 'تعذّر ربط الدومين لدى Vercel'); return }
    setDomainStatus('pending_dns')
    setDnsInfo(body.dns)
  }

  async function checkDomain() {
    if (!portal || !domain) return
    setDomainBusy(true)
    const res = await fetch(`/api/portals/domain?portalId=${portal.id}&domain=${encodeURIComponent(domain.toLowerCase())}`)
    const body = await res.json()
    setDomainBusy(false)
    if (body.ready) setDomainStatus('active')
    else setError('لم ينتشر DNS بعد — قد يستغرق دقائق إلى ساعات، أعد المحاولة لاحقاً')
  }

  async function detachDomain() {
    if (!portal || !domain || !confirm(`فك ربط ${domain}؟`)) return
    setDomainBusy(true)
    await fetch('/api/portals/domain', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portalId: portal.id, domain }),
    })
    setDomainBusy(false)
    setDomain(''); setDomainStatus('none'); setDnsInfo(null)
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full'

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-ruwad sm:rounded-ruwad max-h-[94vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray sticky top-0 bg-white z-10">
          <h3 className="font-extrabold text-ruwad-navy">{portal ? 'إدارة البوابة' : 'بوابة جديدة'}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>

        <div className="p-5 grid sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">المعهد *</span>
            <select value={instituteId} onChange={(e) => setInstituteId(e.target.value)} disabled={!!portal} className={inputCls + ' bg-white disabled:opacity-60'}>
              <option value="">— اختر —</option>
              {availableInstitutes.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">Subdomain *</span>
            <div className="flex items-center gap-1.5" dir="ltr">
              <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="alnour" className={inputCls + ' text-left'} />
              <span className="text-xs font-bold text-ruwad-navy/50 shrink-0">.ruwaad.app</span>
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">الاسم المعروض</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="اسم المعهد كما يظهر على بوابته" className={inputCls} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">رابط الشعار</span>
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." dir="ltr" className={inputCls + ' text-left'} />
          </label>

          {/* الألوان + معاينة حية */}
          <div className="sm:col-span-2 grid sm:grid-cols-[1fr_auto] gap-4 items-start">
            <div className="flex flex-col gap-3">
              {([['اللون الأساسي', primary, setPrimary], ['اللون الثانوي', secondary, setSecondary], ['لون التمييز', accent, setAccent]] as const).map(([label, val, set]) => (
                <label key={label} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-ruwad-navy">{label}</span>
                  <span className="flex items-center gap-2" dir="ltr">
                    <input type="color" value={val} onChange={(e) => set(e.target.value)} className="w-9 h-9 rounded-lg border-2 border-ruwad-gray cursor-pointer" />
                    <input value={val} onChange={(e) => set(e.target.value)} className="w-24 border-2 border-ruwad-gray rounded-lg px-2 py-1.5 text-xs font-mono text-ruwad-navy outline-none focus:border-ruwad-blue" />
                  </span>
                </label>
              ))}
            </div>
            {/* المعاينة الحية */}
            <div className="w-full sm:w-56 rounded-ruwad overflow-hidden border-2 border-ruwad-gray">
              <div className="p-4 text-white text-center" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="w-10 h-10 rounded-xl bg-white object-contain p-1 mx-auto mb-2" />
                ) : <span className="block text-2xl mb-1">🎓</span>}
                <p className="font-extrabold text-sm">{displayName || 'اسم المعهد'}</p>
                <span className="inline-block mt-2 text-[10px] font-extrabold px-3 py-1.5 rounded-lg" style={{ background: accent, color: '#252943' }}>
                  سجّل كطالب
                </span>
              </div>
              <p className="text-center text-[10px] text-ruwad-navy/40 font-bold py-1.5">معاينة حية</p>
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">تاريخ انتهاء الاشتراك</span>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">ملاحظات إدارية</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
          </label>

          {/* الدومين الخاص — بعد إنشاء البوابة */}
          {portal && (
            <div className="sm:col-span-2 border-2 border-ruwad-gray rounded-ruwad-sm p-4 flex flex-col gap-3">
              <p className="text-xs font-extrabold text-ruwad-navy flex items-center gap-1.5"><Link2 size={14} /> الدومين الخاص</p>
              <div className="flex items-center gap-2" dir="ltr">
                <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="alnour-academy.com"
                  disabled={domainStatus !== 'none'} className={inputCls + ' text-left disabled:opacity-60'} />
                {domainStatus === 'none' ? (
                  <button onClick={attachDomain} disabled={domainBusy || !domain}
                    className="shrink-0 bg-ruwad-navy text-white text-xs font-extrabold px-4 py-2.5 rounded-ruwad-sm disabled:opacity-50 flex items-center gap-1.5">
                    {domainBusy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} ربط
                  </button>
                ) : (
                  <>
                    {domainStatus === 'pending_dns' && (
                      <button onClick={checkDomain} disabled={domainBusy}
                        className="shrink-0 bg-amber-500 text-white text-xs font-extrabold px-3 py-2.5 rounded-ruwad-sm disabled:opacity-50 flex items-center gap-1.5">
                        {domainBusy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} تحقق
                      </button>
                    )}
                    {domainStatus === 'active' && <CheckCircle2 size={20} className="text-green-500 shrink-0" />}
                    <button onClick={detachDomain} disabled={domainBusy}
                      className="shrink-0 text-red-500 hover:bg-red-50 rounded-ruwad-sm p-2.5"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
              {(dnsInfo || domainStatus === 'pending_dns') && (
                <div className="bg-[#F5F6FA] rounded-ruwad-sm p-3 flex flex-col gap-2">
                  <p className="text-[11px] font-extrabold text-ruwad-navy/70">أضف هذه السجلات عند مسجّل النطاق ثم اضغط «تحقق»:</p>
                  {(dnsInfo ?? [
                    { type: 'A', name: '@', value: '76.76.21.21', note: 'للدومين الجذر' },
                    { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com', note: 'اختياري لـ www' },
                  ]).map((r) => (
                    <div key={r.type} className="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-2 text-[11px] font-mono" dir="ltr">
                      <span className="font-extrabold text-ruwad-navy w-14">{r.type}</span>
                      <span className="text-ruwad-navy/60 w-10">{r.name}</span>
                      <span className="flex-1 text-ruwad-blue font-bold truncate">{r.value}</span>
                      <button onClick={() => navigator.clipboard.writeText(r.value)} className="text-ruwad-navy/40 hover:text-ruwad-navy"><Copy size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-ruwad-navy/40 font-medium">شهادة SSL تصدر تلقائياً فور اكتمال DNS.</p>
            </div>
          )}

          {error && <p className="sm:col-span-2 text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
        </div>

        <div className="px-5 pb-5">
          <button onClick={save} disabled={saving}
            className="w-full bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
            {saving && <Loader2 size={15} className="animate-spin" />} {portal ? 'حفظ التعديلات' : 'إنشاء البوابة'}
          </button>
        </div>
      </div>
    </div>
  )
}
