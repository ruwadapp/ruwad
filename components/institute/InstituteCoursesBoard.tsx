'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Plus, X, Loader2, BookOpen, Users, PlaySquare, Building2,
  UserRound, ExternalLink, Trash2, ArrowDownWideNarrow, GraduationCap,
} from 'lucide-react'

/* ================================================================
   تدريبات المعهد — بطاقات غنية + بحث وفرز وفلترة صريحة
   المصدر: تدريب أوكله المعهد لمدرب، أو تدريب شاركه المدرب مع المعهد
   ================================================================ */

export interface InstCourse {
  share_id: string
  origin: 'trainer' | 'institute'
  course: {
    id: string; title: string; description: string | null; cover_image: string | null
    status: string; created_at: string
    trainer: { id: string; full_name: string; avatar_url: string | null } | null
    lectures: { count: number }[]
  }
  students: number
}
interface Trainer { user_id: string; profile: { full_name: string } }

type SortKey = 'newest' | 'oldest' | 'students' | 'alpha'
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'الأحدث' },
  { key: 'oldest', label: 'الأقدم' },
  { key: 'students', label: 'الأكثر طلاباً' },
  { key: 'alpha', label: 'أبجدي' },
]
const ACCENTS = ['#3A4EFB', '#0d9488', '#d97706', '#7c3aed', '#dc2626', '#0284c7']

export function InstituteCoursesBoard({ instituteId, initial, trainers }: {
  instituteId: string
  initial: InstCourse[]
  trainers: Trainer[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [originFilter, setOriginFilter] = useState<'all' | 'institute' | 'trainer'>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [creating, setCreating] = useState(false)

  const shown = useMemo(() => {
    const term = q.trim()
    let list = initial.filter((x) => {
      if (statusFilter !== 'all' && x.course.status !== statusFilter) return false
      if (originFilter !== 'all' && x.origin !== originFilter) return false
      if (term && !x.course.title.includes(term) && !(x.course.trainer?.full_name ?? '').includes(term)) return false
      return true
    })
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest': return a.course.created_at.localeCompare(b.course.created_at)
        case 'students': return b.students - a.students
        case 'alpha': return a.course.title.localeCompare(b.course.title, 'ar')
        default: return b.course.created_at.localeCompare(a.course.created_at)
      }
    })
    return list
  }, [initial, q, statusFilter, originFilter, sort])

  async function unlink(x: InstCourse) {
    if (!confirm(`إزالة "${x.course.title}" من معهدك؟\nلن يُحذف التدريب نفسه — سيبقى بحساب المدرب، وتُفكّ مشاركته مع المعهد فقط.`)) return
    await supabase.from('resource_institute_shares').delete().eq('id', x.share_id)
    router.refresh()
  }

  const chip = (active: boolean, color?: string) =>
    `shrink-0 text-[11px] font-extrabold px-3.5 py-2 rounded-full border-2 transition ${
      active ? 'text-white' : 'bg-white text-ruwad-navy/60 border-ruwad-gray hover:border-ruwad-navy/30'}`

  return (
    <div className="flex flex-col gap-4">
      {/* شريط الأدوات: بحث + إنشاء */}
      <div className="flex gap-2.5 items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ruwad-navy/35" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم التدريب أو المدرب..."
            className="w-full bg-white border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm pr-10 pl-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none shadow-card" />
        </div>
        <button onClick={() => setCreating(true)}
          className="shrink-0 flex items-center gap-1.5 bg-ruwad-blue text-white text-sm font-extrabold px-4 py-2.5 rounded-ruwad-sm hover:opacity-90 shadow-ruwad transition">
          <Plus size={16} /> <span className="hidden sm:inline">تدريب جديد</span><span className="sm:hidden">جديد</span>
        </button>
      </div>

      {/* الفلاتر والفرز — صريحة ومسماة */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <span className="shrink-0 text-[11px] font-extrabold text-ruwad-navy/40">الحالة:</span>
          <button onClick={() => setStatusFilter('all')} className={chip(statusFilter === 'all')} style={statusFilter === 'all' ? { background: '#252943', borderColor: '#252943' } : undefined}>الكل ({initial.length})</button>
          <button onClick={() => setStatusFilter('published')} className={chip(statusFilter === 'published')} style={statusFilter === 'published' ? { background: '#16a34a', borderColor: '#16a34a' } : undefined}>منشور ({initial.filter((x) => x.course.status === 'published').length})</button>
          <button onClick={() => setStatusFilter('draft')} className={chip(statusFilter === 'draft')} style={statusFilter === 'draft' ? { background: '#d97706', borderColor: '#d97706' } : undefined}>مسودة ({initial.filter((x) => x.course.status === 'draft').length})</button>
          <span className="shrink-0 text-[11px] font-extrabold text-ruwad-navy/40 mr-2">المصدر:</span>
          <button onClick={() => setOriginFilter('all')} className={chip(originFilter === 'all')} style={originFilter === 'all' ? { background: '#252943', borderColor: '#252943' } : undefined}>الكل</button>
          <button onClick={() => setOriginFilter('institute')} className={chip(originFilter === 'institute')} style={originFilter === 'institute' ? { background: '#3A4EFB', borderColor: '#3A4EFB' } : undefined}>بتكليف المعهد</button>
          <button onClick={() => setOriginFilter('trainer')} className={chip(originFilter === 'trainer')} style={originFilter === 'trainer' ? { background: '#0d9488', borderColor: '#0d9488' } : undefined}>مشاركة مدرب</button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-[11px] font-extrabold text-ruwad-navy/40 flex items-center gap-1"><ArrowDownWideNarrow size={12} /> الفرز:</span>
          {SORTS.map((s) => (
            <button key={s.key} onClick={() => setSort(s.key)}
              className={`shrink-0 text-[11px] font-extrabold px-3 py-1.5 rounded-full transition ${sort === s.key ? 'bg-ruwad-blue/10 text-ruwad-blue ring-2 ring-ruwad-blue/30' : 'text-ruwad-navy/50 hover:text-ruwad-navy'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* الشبكة */}
      {shown.length === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-12 text-center flex flex-col items-center gap-3">
          <GraduationCap size={34} className="text-ruwad-blue/30" />
          <p className="text-sm text-ruwad-navy/50 font-medium">
            {initial.length === 0 ? 'لا تدريبات بعد — أنشئ أول تدريب وأوكله لأحد مدربيك.' : 'لا نتائج تطابق البحث أو الفلاتر.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((x, idx) => {
            const c = x.course
            const accent = ACCENTS[idx % ACCENTS.length]
            const published = c.status === 'published'
            const lectures = c.lectures?.[0]?.count ?? 0
            return (
              <div key={x.share_id} className="group bg-white rounded-ruwad shadow-card overflow-hidden flex flex-col hover:shadow-ruwad-lg hover:-translate-y-0.5 transition-all">
                {/* الغلاف */}
                <div className="relative h-28 overflow-hidden">
                  {c.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}>
                      <BookOpen size={30} className="text-white/70" />
                    </div>
                  )}
                  <span className={`absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur ${published ? 'bg-green-500/90 text-white' : 'bg-white/90 text-amber-600'}`}>
                    {published ? 'منشور' : 'مسودة'}
                  </span>
                  <span className={`absolute top-2.5 left-2.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur flex items-center gap-1 ${x.origin === 'institute' ? 'bg-ruwad-blue/90 text-white' : 'bg-teal-600/90 text-white'}`}>
                    {x.origin === 'institute' ? <><Building2 size={9} /> بتكليف المعهد</> : <><UserRound size={9} /> مشاركة مدرب</>}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-2.5 flex-1">
                  <h3 className="font-extrabold text-ruwad-navy leading-snug line-clamp-2 group-hover:text-ruwad-blue transition-colors">{c.title}</h3>
                  {c.description && <p className="text-xs text-ruwad-navy/55 leading-relaxed line-clamp-2">{c.description}</p>}

                  {/* المدرب */}
                  <div className="flex items-center gap-2 mt-0.5">
                    {c.trainer?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.trainer.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-ruwad-gray/60" />
                    ) : (
                      <span className="w-7 h-7 rounded-full text-white text-[11px] font-extrabold flex items-center justify-center" style={{ background: accent }}>
                        {(c.trainer?.full_name ?? '؟').charAt(0)}
                      </span>
                    )}
                    <span className="text-xs font-extrabold text-ruwad-navy/70 truncate">{c.trainer?.full_name ?? 'بلا مدرب'}</span>
                  </div>

                  {/* الإحصاءات */}
                  <div className="grid grid-cols-2 gap-2 text-center mt-1">
                    <div className="rounded-ruwad-sm bg-[#F5F6FA] py-1.5">
                      <p className="text-sm font-extrabold text-ruwad-navy leading-none flex items-center justify-center gap-1"><Users size={12} className="text-ruwad-blue" /> {x.students}</p>
                      <p className="text-[10px] font-bold text-ruwad-navy/40 mt-1">طالباً</p>
                    </div>
                    <div className="rounded-ruwad-sm bg-[#F5F6FA] py-1.5">
                      <p className="text-sm font-extrabold text-ruwad-navy leading-none flex items-center justify-center gap-1"><PlaySquare size={12} className="text-ruwad-blue" /> {lectures}</p>
                      <p className="text-[10px] font-bold text-ruwad-navy/40 mt-1">محاضرة</p>
                    </div>
                  </div>

                  {/* التذييل */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-ruwad-gray/40">
                    <span className="text-[10px] font-bold text-ruwad-navy/35">
                      {new Date(c.created_at).toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Link href={`/land/${c.id}`} target="_blank" title="صفحة التدريب"
                        className="w-8 h-8 rounded-full text-ruwad-navy/35 hover:text-ruwad-blue hover:bg-ruwad-blue/10 flex items-center justify-center transition"><ExternalLink size={14} /></Link>
                      <button onClick={() => unlink(x)} title="إزالة من المعهد"
                        className="w-8 h-8 rounded-full text-ruwad-navy/25 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition"><Trash2 size={14} /></button>
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {creating && (
        <NewCourseModal instituteId={instituteId} trainers={trainers}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); router.refresh() }} />
      )}
    </div>
  )
}

/* ================= إنشاء تدريب موكّل لمدرب ================= */

function NewCourseModal({ instituteId, trainers, onClose, onSaved }: {
  instituteId: string; trainers: Trainer[]
  onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [trainerId, setTrainerId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (title.trim().length < 2) { setError('اكتب اسم التدريب'); return }
    if (!trainerId) { setError('اختر المدرب المسؤول'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.rpc('institute_create_course', {
      p_institute_id: instituteId,
      p_trainer_id: trainerId,
      p_title: title.trim(),
      p_description: description.trim() || null,
    })
    setSaving(false)
    if (err) { setError('تعذّر الإنشاء — أعد المحاولة'); return }
    onSaved()
  }

  const inputCls = 'border-2 border-ruwad-gray focus:border-ruwad-blue rounded-ruwad-sm px-3.5 py-2.5 text-sm font-semibold text-ruwad-navy outline-none w-full bg-white'

  return (
    <div className="fixed inset-0 z-[70] bg-ruwad-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" dir="rtl">
      <div className="bg-white w-full sm:max-w-md rounded-t-ruwad sm:rounded-ruwad overflow-hidden">
        <div className="h-1.5 w-full bg-ruwad-gradient" />
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ruwad-gray">
          <h3 className="font-extrabold text-ruwad-navy">تدريب جديد بتكليف المعهد</h3>
          <button onClick={onClose} aria-label="إغلاق" className="text-ruwad-navy/50 hover:text-ruwad-navy"><X size={20} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">اسم التدريب *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: دورة المحاسبة العملية" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">المدرب المسؤول *</span>
            <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className={inputCls}>
              <option value="">— اختر من مدربي المعهد —</option>
              {trainers.map((t) => <option key={t.user_id} value={t.user_id}>{t.profile.full_name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold text-ruwad-navy">وصف مختصر</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls + ' resize-none'} />
          </label>
          <p className="text-[11px] font-bold text-ruwad-navy/50 bg-ruwad-blue/5 rounded-ruwad-sm px-3 py-2">
            سيُنشأ التدريب كمسودة باسم المدرب المختار ويصله إشعار فوري ليبني محاضراته وينشره.
          </p>
          {error && <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-ruwad-sm px-3 py-2">{error}</p>}
          <button onClick={save} disabled={saving}
            className="bg-ruwad-blue text-white font-extrabold py-3 rounded-ruwad-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition">
            {saving && <Loader2 size={15} className="animate-spin" />} إنشاء وتوكيل
          </button>
        </div>
      </div>
    </div>
  )
}
