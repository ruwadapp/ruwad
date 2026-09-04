'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getCachedRole, setCachedRole, type CachedRole } from '@/lib/role-cache'
import { InviteToCourseButton } from './InviteToCourseButton'
import {
  Search, X, Loader2, Building2, GraduationCap, UserRound, MapPin,
  Check, Clock, ArrowLeft,
} from 'lucide-react'

/* ================================================================
   البحث الشامل — أنيق وحسب الدور:
   الطالب يبحث عن المدربين والمعاهد (انضمام بضغطة + فتح الملف)
   المدرب والمعهد يبحثان عن الطلاب (فتح الملف + إضافة لتدريب بدعوة)
   ================================================================ */

interface Results {
  role: CachedRole
  trainers: { id: string; name: string; avatar: string | null; bio: string | null }[]
  institutes: { id: string; name: string; logo: string | null; address: string | null; membership: 'pending' | 'approved' | null }[]
  students: { id: string; name: string; avatar: string | null; code: string | null }[]
}

export function GlobalSearch() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<Results | null>(null)
  const [myCourses, setMyCourses] = useState<{ id: string; title: string }[]>([])
  const [joinStates, setJoinStates] = useState<Record<string, 'busy' | 'pending' | undefined>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const role = getCachedRole()

  // فتح النافذة: تركيز فوري + تحميل كورسات الداعي (للمدرب/المعهد) مرة واحدة
  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 60)
    let cancelled = false
    async function loadCourses() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || cancelled) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (cancelled) return
      setCachedRole(profile?.role)
      if (profile?.role === 'trainer') {
        const { data } = await supabase.from('courses').select('id, title')
          .eq('trainer_id', session.user.id).eq('status', 'published').order('title')
        if (!cancelled) setMyCourses(data ?? [])
      } else if (profile?.role === 'institute_admin') {
        const { data: inst } = await supabase.from('institutes').select('id').eq('owner_id', session.user.id).single()
        if (!inst || cancelled) return
        const { data: shares } = await supabase.from('resource_institute_shares')
          .select('resource_id').eq('resource_type', 'courses').eq('institute_id', inst.id)
        const ids = (shares ?? []).map((s) => s.resource_id)
        if (ids.length === 0 || cancelled) return
        const { data } = await supabase.from('courses').select('id, title').in('id', ids).eq('status', 'published').order('title')
        if (!cancelled) setMyCourses(data ?? [])
      }
    }
    loadCourses()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // بحث مؤجّل أثناء الكتابة
  useEffect(() => {
    if (!open) return
    if (debounce.current) clearTimeout(debounce.current)
    const term = q.trim()
    if (term.length < 2) { setResults(null); setBusy(false); return }
    setBusy(true)
    debounce.current = setTimeout(async () => {
      const { data } = await supabase.rpc('search_directory', { p_query: term })
      setResults(data as Results | null)
      setBusy(false)
    }, 350)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open])

  async function requestJoin(instId: string) {
    setJoinStates((s) => ({ ...s, [instId]: 'busy' }))
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('institute_members').insert({
      institute_id: instId, user_id: session!.user.id, member_role: 'student', invited_by: 'self',
    })
    setJoinStates((s) => ({ ...s, [instId]: error ? undefined : 'pending' }))
  }

  function close() { setOpen(false); setQ(''); setResults(null) }

  const isStudent = (results?.role ?? role) === 'student'
  const empty = results && results.trainers.length === 0 && results.institutes.length === 0 && results.students.length === 0

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="بحث"
        className="w-10 h-10 rounded-full bg-ruwad-gray/40 text-ruwad-navy flex items-center justify-center hover:bg-ruwad-gray transition">
        <Search size={19} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] bg-ruwad-navy/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 pt-[8vh] sm:pt-[12vh]" dir="rtl" onClick={close}>
          <div className="w-full max-w-xl flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            {/* حقل البحث الأنيق */}
            <div className="bg-white rounded-full shadow-ruwad-lg flex items-center gap-2 pr-5 pl-2 py-2 ring-4 ring-white/20">
              <Search size={20} className="text-ruwad-blue shrink-0" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={isStudent ? 'ابحث عن مدرب أو معهد...' : 'ابحث عن طالب باسمه...'}
                className="flex-1 min-w-0 bg-transparent text-sm sm:text-base font-bold text-ruwad-navy placeholder:text-ruwad-navy/35 outline-none py-1.5" />
              {busy && <Loader2 size={17} className="animate-spin text-ruwad-navy/30 shrink-0" />}
              <button onClick={close} aria-label="إغلاق"
                className="shrink-0 w-9 h-9 rounded-full bg-ruwad-gray/40 text-ruwad-navy/60 hover:bg-ruwad-gray flex items-center justify-center transition">
                <X size={17} />
              </button>
            </div>

            {/* النتائج */}
            {(results || q.trim().length >= 2) && (
              <div className="bg-white rounded-ruwad shadow-ruwad-lg max-h-[62vh] overflow-y-auto p-3 flex flex-col gap-3">
                {empty && !busy && (
                  <p className="text-sm text-ruwad-navy/45 text-center py-8">لا نتائج لـ«{q.trim()}» — جرّب اسماً آخر.</p>
                )}

                {/* المعاهد (للطالب) */}
                {(results?.institutes.length ?? 0) > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-extrabold text-ruwad-navy/40 px-1 flex items-center gap-1"><Building2 size={11} /> المعاهد</p>
                    {results!.institutes.map((i) => {
                      const st: 'busy' | 'pending' | 'member' | null = joinStates[i.id] ?? (i.membership === 'approved' ? 'member' : i.membership === 'pending' ? 'pending' : null)
                      return (
                        <div key={i.id} className="flex items-center gap-3 rounded-ruwad-sm hover:bg-[#F5F6FA] px-2.5 py-2.5 transition group">
                          <Link href={`/i/${i.id}`} onClick={close} className="flex items-center gap-3 min-w-0 flex-1">
                            {i.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={i.logo} alt="" className="w-11 h-11 rounded-xl bg-white object-contain p-1 ring-2 ring-ruwad-gray/50 shrink-0" />
                            ) : (
                              <span className="w-11 h-11 rounded-xl bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center shrink-0"><Building2 size={18} /></span>
                            )}
                            <span className="min-w-0">
                              <span className="block text-sm font-extrabold text-ruwad-navy truncate group-hover:text-ruwad-blue transition-colors">{i.name}</span>
                              {i.address && <span className="block text-[11px] font-bold text-ruwad-navy/45 truncate"><MapPin size={9} className="inline ml-0.5" />{i.address}</span>}
                            </span>
                          </Link>
                          {st === 'member' ? (
                            <span className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold text-green-600 bg-green-50 rounded-full px-2.5 py-1.5"><Check size={11} /> عضو</span>
                          ) : st === 'pending' ? (
                            <span className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold text-amber-600 bg-amber-50 rounded-full px-2.5 py-1.5"><Clock size={11} /> بالانتظار</span>
                          ) : st === 'busy' ? (
                            <Loader2 size={14} className="animate-spin text-ruwad-navy/30 shrink-0" />
                          ) : (
                            <button onClick={() => requestJoin(i.id)}
                              className="shrink-0 text-[11px] font-extrabold text-white bg-ruwad-blue hover:opacity-90 rounded-full px-3.5 py-1.5 transition">
                              انضمام
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* المدربون (للطالب) */}
                {(results?.trainers.length ?? 0) > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-extrabold text-ruwad-navy/40 px-1 flex items-center gap-1"><GraduationCap size={11} /> المدربون</p>
                    {results!.trainers.map((t) => (
                      <Link key={t.id} href={`/t/${t.id}`} onClick={close}
                        className="flex items-center gap-3 rounded-ruwad-sm hover:bg-[#F5F6FA] px-2.5 py-2.5 transition group">
                        {t.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-ruwad-gray/50 shrink-0" />
                        ) : (
                          <span className="w-11 h-11 rounded-full bg-ruwad-gradient text-white font-black flex items-center justify-center shrink-0">{t.name.charAt(0)}</span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold text-ruwad-navy truncate group-hover:text-ruwad-blue transition-colors">{t.name}</span>
                          {t.bio && <span className="block text-[11px] font-bold text-ruwad-navy/45 truncate">{t.bio}</span>}
                        </span>
                        <ArrowLeft size={15} className="text-ruwad-navy/25 group-hover:text-ruwad-blue group-hover:-translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* الطلاب (للمدرب والمعهد) */}
                {(results?.students.length ?? 0) > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-extrabold text-ruwad-navy/40 px-1 flex items-center gap-1"><UserRound size={11} /> الطلاب</p>
                    {results!.students.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 rounded-ruwad-sm hover:bg-[#F5F6FA] px-2.5 py-2.5 transition group">
                        <Link href={`/s/${s.id}`} onClick={close} className="flex items-center gap-3 min-w-0 flex-1">
                          {s.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-ruwad-gray/50 shrink-0" />
                          ) : (
                            <span className="w-11 h-11 rounded-full bg-ruwad-gradient text-white font-black flex items-center justify-center shrink-0">{s.name.charAt(0)}</span>
                          )}
                          <span className="min-w-0">
                            <span className="block text-sm font-extrabold text-ruwad-navy truncate group-hover:text-ruwad-blue transition-colors">{s.name}</span>
                            {s.code && <span className="block text-[11px] font-bold text-ruwad-navy/40" dir="ltr">{s.code}</span>}
                          </span>
                        </Link>
                        <InviteToCourseButton studentId={s.id} courses={myCourses} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
