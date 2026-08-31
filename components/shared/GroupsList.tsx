'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Plus, Users, BookOpen, BellOff, LogIn, ChevronLeft } from 'lucide-react'

export interface GroupCard {
  id: string
  name: string
  description: string | null
  course_id: string
  courseTitle: string
  membersCount: number
  isMember: boolean
  muted: boolean
  unread: number
  lastMessage: { content: string; sender: string; at: string } | null
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'الآن'
  if (m < 60) return `${m} د`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} س`
  return new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'short' })
}

const inputCls = 'border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition w-full bg-white'

// قائمة المجموعات: إنشاء (مدرب/معهد) + انضمام (طالب) + فتح الدردشة
export function GroupsList({
  groups,
  canCreate,
  courses,
  groupBasePath,
}: {
  groups: GroupCard[]
  canCreate: boolean
  courses: { id: string; title: string }[]
  groupBasePath: string
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [joining, setJoining] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function create() {
    setError(null)
    if (!name.trim() || !courseId) { setError('اسم المجموعة والكورس مطلوبان.'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase
      .from('chat_groups')
      .insert({ name: name.trim(), description: description.trim() || null, course_id: courseId, created_by: user!.id })
      .select('id')
      .single()
    setSaving(false)
    if (err || !data) { setError('تعذّر إنشاء الدردشة، حاول مجدداً.'); return }
    router.push(`${groupBasePath}/${data.id}`)
  }

  async function join(groupId: string) {
    setJoining(groupId)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('chat_members').insert({ group_id: groupId, user_id: user!.id })
    setJoining(null)
    if (!err) router.push(`${groupBasePath}/${groupId}`)
  }

  const mine = groups.filter((g) => g.isMember)
  const joinable = groups.filter((g) => !g.isMember)

  return (
    <div className="flex flex-col gap-5">
      {canCreate && (
        <div className="bg-white rounded-ruwad shadow-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-extrabold text-ruwad-navy">
              <span className="w-9 h-9 rounded-ruwad-sm bg-ruwad-blue/10 flex items-center justify-center"><MessageCircle size={17} className="text-ruwad-blue" /></span>
              دردشة جديدة
            </h2>
            {!formOpen && (
              <button onClick={() => setFormOpen(true)} disabled={courses.length === 0} className="bg-ruwad-blue text-white px-4 py-2 rounded-ruwad-sm text-sm font-bold hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-40">
                <Plus size={15} /> إنشاء
              </button>
            )}
          </div>
          {courses.length === 0 && <p className="text-xs text-ruwad-navy/50 mt-2">تحتاج كورساً واحداً على الأقل لإنشاء مجموعة.</p>}
          {formOpen && (
            <div className="flex flex-col gap-3 mt-4">
              {error && <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-2.5">{error}</div>}
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الدردشة (مثال: دفعة المونتاج — نقاشات)" className={inputCls} />
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر اختياري" className={inputCls} />
              <p className="text-[11px] text-ruwad-navy/45">يستطيع كل طالب مسجَّل في هذا الكورس الانضمام للدردشة.</p>
              <div className="flex items-center gap-2">
                <button onClick={create} disabled={saving} className="bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm text-sm font-bold hover:opacity-90 transition disabled:opacity-50">{saving ? 'جارٍ الإنشاء...' : 'إنشاء الدردشة'}</button>
                <button onClick={() => { setFormOpen(false); setError(null) }} className="text-sm font-semibold text-ruwad-navy/50 px-3 py-2.5 hover:text-ruwad-navy transition">إلغاء</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== مجموعاتي ===== */}
      {mine.length > 0 && (
        <div className="bg-white rounded-ruwad shadow-card overflow-hidden divide-y divide-ruwad-gray/30">
          {mine.map((g) => (
            <Link key={g.id} href={`${groupBasePath}/${g.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-ruwad-gray/10 transition">
              <span className="w-12 h-12 rounded-full bg-ruwad-gradient text-white flex items-center justify-center font-bold text-lg shrink-0">{g.name.charAt(0)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-ruwad-navy text-sm truncate flex items-center gap-1.5">
                    {g.name}{g.muted && <BellOff size={12} className="text-ruwad-navy/35" />}
                  </p>
                  {g.lastMessage && <span className={`text-[11px] shrink-0 ${g.unread > 0 ? 'text-ruwad-blue font-bold' : 'text-ruwad-navy/40'}`}>{timeAgo(g.lastMessage.at)}</span>}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-ruwad-navy/55 truncate">
                    {g.lastMessage ? <><span className="font-semibold">{g.lastMessage.sender}:</span> {g.lastMessage.content}</> : <span className="text-ruwad-navy/40">{g.courseTitle}</span>}
                  </p>
                  {g.unread > 0 && (
                    <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-ruwad-blue text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">{g.unread > 99 ? '99+' : g.unread}</span>
                  )}
                </div>
              </div>
              <ChevronLeft size={16} className="text-ruwad-navy/25 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* ===== مجموعات يمكنك الانضمام لها ===== */}
      {joinable.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-ruwad-navy/60 flex items-center gap-1.5"><LogIn size={14} /> دردشات كورساتك — انضم إليها</h3>
          {joinable.map((g) => (
            <div key={g.id} className="bg-white rounded-ruwad shadow-card p-4 flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-ruwad-navy text-ruwad-lime flex items-center justify-center font-bold shrink-0">{g.name.charAt(0)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ruwad-navy text-sm truncate">{g.name}</p>
                <p className="flex items-center gap-2 text-[11px] text-ruwad-navy/50 mt-0.5">
                  <span className="flex items-center gap-1"><BookOpen size={11} /> {g.courseTitle}</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {g.membersCount}</span>
                </p>
              </div>
              <button onClick={() => join(g.id)} disabled={joining === g.id} className="bg-ruwad-blue text-white text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50 shrink-0">
                {joining === g.id ? '...' : 'انضمام'}
              </button>
            </div>
          ))}
        </div>
      )}

      {mine.length === 0 && joinable.length === 0 && (
        <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
          <MessageCircle className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
          <p className="text-ruwad-navy/60">{canCreate ? 'لا توجد دردشات بعد — أنشئ أول دردشة لطلابك.' : 'لا توجد دردشات لكورساتك بعد.'}</p>
        </div>
      )}
    </div>
  )
}
