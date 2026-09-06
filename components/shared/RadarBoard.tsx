'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OfferTrainingButton } from '@/components/shared/OfferTrainingButton'
import {
  Target, Phone, MessageCircle, Check, Clock, MapPin, Laptop,
  Users, BookOpen, CircleDot,
} from 'lucide-react'

/* ================================================================
   الرادار — دمج «المهتمون» و«طلبات التدريب» في شاشة فرص تفاعلية واحدة
   يراها المدرب والمعهد معاً: مهتمون عامون (بلا حساب) + طلبات طلاب مسجَّلين
   + (للمعهد فقط) رسائل استفسار بوابته الخاصة
   ================================================================ */

export type RadarKind = 'lead' | 'request' | 'inquiry'

export interface RadarItem {
  kind: RadarKind
  id: string
  name: string
  avatar?: string | null
  studentId?: string | null
  topic: string
  detail?: string | null
  phone?: string | null
  city?: string | null
  mode?: string | null
  courseTitle?: string | null
  createdAt: string
  status: string // lead: open/claimed/converted/closed · request: open/closed · inquiry: new/contacted/reserved/enrolled/closed
  claimedByMe: boolean
  offersCount?: number
}

const MODE_META: Record<string, { label: string; icon: typeof Users }> = {
  in_person: { label: 'حضوري', icon: Users },
  remote: { label: 'عن بُعد', icon: Laptop },
  any: { label: 'حضوري أو عن بُعد', icon: Target },
}
const INQUIRY_STAGES = [
  { key: 'new', label: 'جديد', color: '#3A4EFB' },
  { key: 'contacted', label: 'تواصلنا', color: '#d97706' },
  { key: 'reserved', label: 'حجز مقعد', color: '#7c3aed' },
  { key: 'enrolled', label: 'سجّل 🎉', color: '#16a34a' },
  { key: 'closed', label: 'مغلق', color: '#94a3b8' },
] as const

const timeAgo = (iso: string) => {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (h < 1) return 'قبل قليل'
  if (h < 24) return `قبل ${h} ساعة`
  const d = Math.floor(h / 24)
  return d === 1 ? 'أمس' : `قبل ${d} يوم`
}
const waHref = (phone: string) => `https://wa.me/${phone.replace(/^0/, '963').replace(/\D/g, '')}`

export function RadarBoard({ items, role, offerCourses }: {
  items: RadarItem[]
  role: 'trainer' | 'institute_admin'
  offerCourses: { id: string; title: string }[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | RadarKind>('all')
  const [busy, setBusy] = useState<string | null>(null)

  const counts = useMemo(() => ({
    lead: items.filter((i) => i.kind === 'lead').length,
    request: items.filter((i) => i.kind === 'request').length,
    inquiry: items.filter((i) => i.kind === 'inquiry').length,
  }), [items])

  const shown = useMemo(() => (filter === 'all' ? items : items.filter((i) => i.kind === filter))
    .filter((i) => !(i.kind === 'lead' && i.status === 'closed'))
    .filter((i) => !(i.kind === 'inquiry' && i.status === 'closed'))
    , [items, filter])

  async function claimLead(id: string) {
    setBusy(id)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('interest_leads').update({
      status: 'claimed', claimed_by: session!.user.id, claimed_by_role: role, claimed_at: new Date().toISOString(),
    }).eq('id', id)
    setBusy(null)
    router.refresh()
  }
  async function closeLead(id: string) {
    setBusy(id)
    await supabase.from('interest_leads').update({ status: 'converted' }).eq('id', id)
    setBusy(null)
    router.refresh()
  }
  async function moveInquiry(id: string, stage: string) {
    setBusy(id)
    await supabase.from('institute_inquiries').update({ stage }).eq('id', id)
    setBusy(null)
    router.refresh()
  }

  const chip = (v: 'all' | RadarKind, label: string, active: boolean) => (
    <button key={v} onClick={() => setFilter(v)}
      className={`shrink-0 text-xs font-extrabold px-3.5 py-2 rounded-full border-2 transition ${active ? 'bg-ruwad-navy text-white border-ruwad-navy' : 'bg-white text-ruwad-navy/60 border-ruwad-gray'}`}>
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden bg-ruwad-navy rounded-ruwad shadow-ruwad-lg p-6 text-white">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-ruwad-lime/20 rounded-full blur-3xl" />
        <h1 className="relative text-xl font-extrabold flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ruwad-lime opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-ruwad-lime" />
          </span>
          الرادار
        </h1>
        <p className="relative text-sm text-white/75 mt-1.5">كل من يبحث عن تدريب — مهتمون جدد وطلاب مسجَّلون — في مكان واحد تفاعلي.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {chip('all', `الكل (${items.length})`, filter === 'all')}
        {chip('lead', `مهتمون جدد (${counts.lead})`, filter === 'lead')}
        {chip('request', `طلبات طلاب (${counts.request})`, filter === 'request')}
        {role === 'institute_admin' && chip('inquiry', `رسائل بوابتي (${counts.inquiry})`, filter === 'inquiry')}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-12 text-center flex flex-col items-center gap-3">
          <Target size={34} className="text-ruwad-blue/30" />
          <p className="text-sm text-ruwad-navy/50">لا فرص في هذا التصنيف حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {shown.map((it) => {
            const mode = it.mode ? MODE_META[it.mode] ?? MODE_META.any : null
            const ModeIcon = mode?.icon
            const stage = it.kind === 'inquiry' ? INQUIRY_STAGES.find((s) => s.key === it.status) : null
            return (
              <div key={`${it.kind}-${it.id}`} className="bg-white rounded-ruwad shadow-card overflow-hidden flex flex-col">
                <div className="h-1.5" style={{
                  background: it.kind === 'lead' ? '#16a34a' : it.kind === 'request' ? 'linear-gradient(90deg,#3A4EFB,#33A4FA)' : '#7c3aed',
                }} />
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    {it.studentId ? (
                      <Link href={`/s/${it.studentId}`} className="flex items-center gap-2.5 group min-w-0">
                        <span className="w-10 h-10 rounded-full bg-ruwad-navy text-white flex items-center justify-center font-bold overflow-hidden ring-2 ring-ruwad-gray/40 shrink-0">
                          {it.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (it.name.charAt(0))}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-ruwad-navy text-sm group-hover:text-ruwad-blue transition truncate">{it.name}</span>
                          <span className="block text-[11px] text-ruwad-blue">عرض البروفايل ←</span>
                        </span>
                      </Link>
                    ) : (
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className="w-10 h-10 rounded-full bg-ruwad-gradient text-white flex items-center justify-center font-bold shrink-0">{it.name.charAt(0)}</span>
                        <span className="font-bold text-ruwad-navy text-sm truncate">{it.name}</span>
                      </span>
                    )}
                    <span className={`shrink-0 text-[10px] font-extrabold px-2 py-1 rounded-full ${
                      it.kind === 'lead' ? 'bg-green-50 text-green-600' : it.kind === 'request' ? 'bg-ruwad-blue/10 text-ruwad-blue' : 'bg-violet-50 text-violet-600'
                    }`}>
                      {it.kind === 'lead' ? 'مهتم جديد' : it.kind === 'request' ? 'طالب مسجَّل' : 'من بوابتي'}
                    </span>
                  </div>

                  <div>
                    <p className="font-extrabold text-ruwad-navy leading-snug">يريد: {it.topic}</p>
                    {it.detail && <p className="text-xs text-ruwad-navy/55 leading-relaxed mt-1.5 line-clamp-3">{it.detail}</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {it.city && <span className="flex items-center gap-1 text-[11px] font-bold text-ruwad-blue bg-ruwad-blue/10 rounded-full px-2.5 py-1"><MapPin size={11} /> {it.city}</span>}
                    {mode && ModeIcon && <span className="flex items-center gap-1 text-[11px] font-semibold text-ruwad-navy/50 bg-[#F5F6FA] rounded-full px-2.5 py-1"><ModeIcon size={11} /> {mode.label}</span>}
                    {it.courseTitle && <span className="flex items-center gap-1 text-[11px] font-semibold text-ruwad-navy/50 bg-[#F5F6FA] rounded-full px-2.5 py-1"><BookOpen size={11} /> {it.courseTitle}</span>}
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-ruwad-navy/40"><Clock size={11} /> {timeAgo(it.createdAt)}</span>
                    {it.offersCount != null && it.offersCount > 0 && <span className="text-[11px] font-bold bg-amber-50 text-amber-600 rounded-full px-2.5 py-1">🎯 {it.offersCount} {it.offersCount === 1 ? 'عرض' : 'عروض'}</span>}
                    {it.kind === 'lead' && it.status === 'claimed' && (
                      <span className={`flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 ${it.claimedByMe ? 'bg-green-50 text-green-600' : 'bg-ruwad-gray/40 text-ruwad-navy/45'}`}>
                        <CircleDot size={10} /> {it.claimedByMe ? 'تدّعيته' : 'ادّعاه آخر'}
                      </span>
                    )}
                    {stage && (
                      <span className="text-[11px] font-extrabold text-white px-2.5 py-1 rounded-full" style={{ background: stage.color }}>{stage.label}</span>
                    )}
                  </div>

                  <div className="mt-auto pt-1 flex flex-wrap items-center gap-2">
                    {it.kind === 'request' && <OfferTrainingButton requestId={it.id} courses={offerCourses} />}

                    {it.kind === 'lead' && (
                      <>
                        {it.phone && (
                          <>
                            <a href={`tel:${it.phone}`} className="w-9 h-9 rounded-full bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center hover:bg-ruwad-blue/20"><Phone size={15} /></a>
                            <a href={waHref(it.phone)} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100"><MessageCircle size={15} /></a>
                          </>
                        )}
                        {it.status === 'open' ? (
                          <button onClick={() => claimLead(it.id)} disabled={busy === it.id}
                            className="flex items-center gap-1.5 text-xs font-extrabold text-white bg-green-500 hover:bg-green-600 rounded-full px-4 py-2 transition disabled:opacity-60">
                            <Check size={13} /> تواصلت معه
                          </button>
                        ) : it.claimedByMe ? (
                          <button onClick={() => closeLead(it.id)} disabled={busy === it.id}
                            className="flex items-center gap-1.5 text-xs font-extrabold text-white bg-ruwad-navy hover:opacity-90 rounded-full px-4 py-2 transition disabled:opacity-60">
                            سجّل عندي ✓
                          </button>
                        ) : null}
                      </>
                    )}

                    {it.kind === 'inquiry' && it.phone && (
                      <>
                        <a href={`tel:${it.phone}`} className="w-9 h-9 rounded-full bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center hover:bg-ruwad-blue/20"><Phone size={15} /></a>
                        <a href={waHref(it.phone)} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100"><MessageCircle size={15} /></a>
                        {INQUIRY_STAGES.filter((s) => s.key !== it.status).slice(0, 2).map((s) => (
                          <button key={s.key} onClick={() => moveInquiry(it.id, s.key)} disabled={busy === it.id}
                            className="text-[11px] font-extrabold px-3 py-2 rounded-full border-2 transition disabled:opacity-60"
                            style={{ borderColor: s.color, color: s.color }}>
                            → {s.label}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
