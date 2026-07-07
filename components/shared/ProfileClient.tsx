'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { LogOut, Pencil, Check, X, User, BookOpen, Award, Building2, Shield, ArrowRight } from 'lucide-react'
import { AvatarUpload } from './AvatarUpload'

const ROLE_LABELS: Record<string, string> = {
  trainer: 'مدرب',
  student: 'طالب',
  institute_admin: 'مدير معهد',
  super_admin: 'مالك المنصة',
}

const ROLE_STYLES: Record<string, { bg: string; chipBg: string; chipText: string; icon: typeof User }> = {
  trainer:        { bg: 'bg-ruwad-blue', chipBg: 'bg-ruwad-blue/10', chipText: 'text-ruwad-blue', icon: BookOpen  },
  student:        { bg: 'bg-ruwad-lime', chipBg: 'bg-ruwad-lime/30', chipText: 'text-ruwad-navy', icon: Award     },
  institute_admin:{ bg: 'bg-ruwad-navy', chipBg: 'bg-ruwad-navy/10', chipText: 'text-ruwad-navy', icon: Building2 },
  super_admin:    { bg: 'bg-red-500',    chipBg: 'bg-red-50',         chipText: 'text-red-500',    icon: Shield    },
}

interface Stat { label: string; value: string | number }

export function ProfileClient({ profile, stats }: { profile: Profile; stats: Stat[] }) {
  const [editing, setEditing]     = useState(false)
  const [name, setName]           = useState(profile.full_name)
  const [savedName, setSavedName] = useState(profile.full_name)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio]             = useState(profile.bio ?? '')
  const [savedBio, setSavedBio]   = useState(profile.bio ?? '')
  const [savingBio, setSavingBio] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const style    = ROLE_STYLES[profile.role] ?? ROLE_STYLES.student
  const RoleIcon = style.icon
  const initials = savedName?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? '؟'

  const HOME_ROUTES: Record<string, string> = {
    trainer: '/dashboard',
    student: '/home',
    institute_admin: '/org',
    super_admin: '/admin',
  }
  const homeHref = HOME_ROUTES[profile.role] ?? '/'

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push(homeHref)
  }

  async function saveName() {
    if (!name.trim()) { setError('الاسم لا يمكن أن يكون فارغاً'); return }
    if (name.trim() === savedName) { setEditing(false); return }
    setSaving(true); setError(null)
    const { error: e } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', profile.id)
    if (e) { setError('حدث خطأ أثناء الحفظ'); setSaving(false); return }
    setSavedName(name.trim()); setEditing(false); setSaving(false); router.refresh()
  }

  function cancelEdit() { setName(savedName); setEditing(false); setError(null) }

  async function saveBio() {
    setSavingBio(true)
    const { error: e } = await supabase.from('profiles').update({ bio: bio.trim() || null }).eq('id', profile.id)
    setSavingBio(false)
    if (e) return
    setSavedBio(bio.trim())
    setEditingBio(false)
    router.refresh()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const STAT_BG = ['bg-ruwad-blue/5', 'bg-ruwad-lime/15', 'bg-ruwad-navy/5']

  return (
    <div className="min-h-screen bg-[#F5F6FA]" dir="rtl">
      {/* ===== هيدر متدرّج ===== */}
      <div className="relative overflow-hidden bg-ruwad-gradient px-6 pt-10 pb-16 flex flex-col items-center gap-2 text-center">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />

        <button
          onClick={handleBack}
          aria-label="رجوع"
          className="absolute z-20 top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center text-white transition"
        >
          <ArrowRight size={20} />
        </button>

        {(profile.role === 'trainer' || profile.role === 'institute_admin') ? (
          <div className="relative z-10">
            <AvatarUpload currentUrl={profile.avatar_url} fallbackLetter={initials} table="profiles" rowId={profile.id} column="avatar_url" size={80} />
          </div>
        ) : (
          <div className={`relative z-10 w-20 h-20 rounded-full ${style.bg} flex items-center justify-center text-3xl font-extrabold text-white shadow-ruwad-lg ring-4 ring-white/20`}>
            {initials}
          </div>
        )}

        <span className="relative z-10 text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white flex items-center gap-1.5 mt-1">
          <RoleIcon size={12} /> {ROLE_LABELS[profile.role] ?? ''}
        </span>

        <div className="relative z-10 flex items-center gap-2">
          {editing ? (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEdit() }}
                autoFocus
                className="bg-white/20 backdrop-blur text-white border border-white/40 rounded-ruwad-sm px-4 py-2 text-xl font-bold text-center outline-none focus:ring-2 focus:ring-white/40 w-64"
              />
              <button onClick={saveName} disabled={saving} className="text-white hover:text-ruwad-lime transition p-1"><Check size={22} /></button>
              <button onClick={cancelEdit} className="text-white/60 hover:text-white transition p-1"><X size={20} /></button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-white">{savedName}</h1>
              <button onClick={() => setEditing(true)} className="text-white/60 hover:text-ruwad-lime transition p-1" aria-label="تعديل الاسم">
                <Pencil size={16} />
              </button>
            </>
          )}
        </div>
        {error && <p className="relative z-10 text-red-300 text-xs">{error}</p>}
        <p className="relative z-10 text-white/60 text-sm">{profile.email}</p>
      </div>

      {/* ===== البطاقات — تنزل مباشرة بعد الهيدر بدون طفو مشكل ===== */}
      <div className="mx-4 sm:mx-6 flex flex-col gap-4 py-5 pb-28 md:pb-8">
        {stats.length > 0 && (
          <div className="bg-white rounded-ruwad shadow-ruwad-lg p-6 grid grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <div key={i} className={`flex flex-col items-center gap-1 p-4 rounded-ruwad-sm ${STAT_BG[i % 3]}`}>
                <p className="text-2xl font-bold text-ruwad-navy">{s.value}</p>
                <p className="text-xs text-ruwad-navy/60 text-center">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-1">
          <h2 className="text-xs font-bold text-ruwad-navy/50 mb-3 uppercase tracking-wider">معلومات الحساب</h2>

          <div className="flex items-center justify-between py-3 border-b border-ruwad-gray/40">
            <span className="text-sm text-ruwad-navy/60">الاسم الكامل</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ruwad-navy">{savedName}</span>
              <button onClick={() => setEditing(true)} className={`${style.chipText} hover:opacity-70 transition`}><Pencil size={13} /></button>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-ruwad-gray/40">
            <span className="text-sm text-ruwad-navy/60">البريد الإلكتروني</span>
            <span className="text-sm font-medium text-ruwad-navy truncate max-w-[55%] text-left">{profile.email}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-ruwad-gray/40">
            <span className="text-sm text-ruwad-navy/60">الدور</span>
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${style.chipBg} ${style.chipText}`}>
              <RoleIcon size={12} /> {ROLE_LABELS[profile.role] ?? ''}
            </span>
          </div>

          {profile.user_code && (
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-ruwad-navy/60">كودك الشخصي</span>
              <span className="font-mono font-bold text-ruwad-blue tracking-widest">{profile.user_code}</span>
            </div>
          )}
        </div>

        {profile.role === 'trainer' && (
          <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-ruwad-navy/50 uppercase tracking-wider">السيرة الذاتية المختصرة</h2>
              <a href={`/t/${profile.id}`} className="text-xs font-semibold text-ruwad-blue hover:underline">عرض ملفي العلني</a>
            </div>
            {editingBio ? (
              <>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="اكتب نبذة مختصرة عن خبرتك وتخصصك يراها الطلاب والمعاهد في ملفك العلني..."
                  className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2.5 text-sm outline-none focus:border-ruwad-blue transition resize-none"
                />
                <div className="flex items-center gap-2 self-end">
                  <button onClick={() => { setBio(savedBio); setEditingBio(false) }} className="text-sm text-ruwad-navy/50 px-3 py-1.5">إلغاء</button>
                  <button onClick={saveBio} disabled={savingBio} className="bg-ruwad-blue text-white text-sm font-semibold px-4 py-1.5 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-50">
                    {savingBio ? 'جارٍ الحفظ...' : 'حفظ'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-ruwad-navy/70 leading-relaxed">{savedBio || 'لم تُضف سيرة ذاتية بعد — أضفها ليراها من يزور ملفك العلني.'}</p>
                <button onClick={() => setEditingBio(true)} className="text-ruwad-blue hover:opacity-70 transition shrink-0"><Pencil size={14} /></button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-ruwad shadow-card p-4 flex items-center justify-center gap-2 text-red-500 font-semibold hover:bg-red-50 transition"
        >
          <LogOut size={18} /> تسجيل الخروج
        </button>
      </div>
    </div>
  )
}
