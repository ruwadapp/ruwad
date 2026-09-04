'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getCachedRole, setCachedRole, type CachedRole } from '@/lib/role-cache'
import { InviteToCourseButton } from './InviteToCourseButton'
import {
  Search, X, Loader2, Building2, MapPin,
  Check, Clock, ArrowLeft,
} from 'lucide-react'

/* ================================================================
   البحث الشامل — شريط حقيقي بجانب أزرار الترويسة، يتوسع عند الضغط
   والنتائج قائمة منسدلة أسفله (بنمط نافذة الإشعارات)
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
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const role = getCachedRole()
  const isStudent = (results?.role ?? role) === 'student'

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close()
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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
  function onResultClick() { close() }

  const showPanel = open && (results !== null || q.trim().length >= 2 || busy)
  const empty = results && results.trainers.length === 0 && results.institutes.length === 0 && results.students.length === 0

  return (
    <div className="relative flex items-center" ref={containerRef} dir="rtl">
      <div
        className={`flex items-center h-10 bg-ruwad-gray/40 rounded-full transition-[width] duration-200 ease-out overflow-hidden ${
          open ? 'w-44 sm:w-64' : 'w-10'}`}
      >
        <button
          onClick={() => (open ? close() : setOpen(true))}
          aria-label="بحث"
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-ruwad-navy hover:bg-ruwad-gray transition"
        >
          <Search size={18} />
        </button>
        {open && (
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={isStudent ? 'مدرب أو معهد...' : 'اسم الطالب...'}
            className="flex-1 min-w-0 bg-transparent text-sm font-bold text-ruwad-navy placeholder:text-ruwad-navy/40 outline-none pl-1 pr-0.5"
          />
        )}
        {open && q && (
          <button onClick={() => setQ('')} aria-label="مسح" className="shrink-0 w-7 h-7 mr-1 rounded-full flex items-center justify-center text-ruwad-navy/40 hover:text-ruwad-navy hover:bg-ruwad-gray transition">
            <X size={14} />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-ruwad shadow-ruwad-lg border border-ruwad-gray/40 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ruwad-gray/40 bg-ruwad-gray/10">
            <h3 className="font-bold text-ruwad-navy text-sm">
              {isStudent ? 'المدربون والمعاهد' : 'الطلاب'}
            </h3>
            {busy && <Loader2 size={14} className="animate-spin text-ruwad-navy/30" />}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {q.trim().length < 2 ? (
              <p className="text-ruwad-navy/40 text-sm py-10 text-center px-4">اكتب حرفين على الأقل للبحث.</p>
            ) : empty && !busy ? (
              <p className="text-ruwad-navy/40 text-sm py-10 text-center px-4">لا نتائج لـ«{q.trim()}».</p>
            ) : (
              <div className="p-2 flex flex-col gap-1">
                {results?.institutes.map((i) => {
                  const st: 'busy' | 'pending' | 'member' | null = joinStates[i.id] ?? (i.membership === 'approved' ? 'member' : i.membership === 'pending' ? 'pending' : null)
                  return (
                    <div key={i.id} className="flex items-center gap-2.5 rounded-ruwad-sm hover:bg-ruwad-gray/20 px-2.5 py-2.5 transition group">
                      <Link href={`/i/${i.id}`} onClick={onResultClick} className="flex items-center gap-2.5 min-w-0 flex-1">
                        {i.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={i.logo} alt="" className="w-10 h-10 rounded-xl bg-white object-contain p-1 ring-1 ring-ruwad-gray/50 shrink-0" />
                        ) : (
                          <span className="w-10 h-10 rounded-xl bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center shrink-0"><Building2 size={16} /></span>
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-ruwad-navy truncate group-hover:text-ruwad-blue transition-colors">{i.name}</span>
                          {i.address && <span className="block text-[11px] font-semibold text-ruwad-navy/45 truncate"><MapPin size={9} className="inline ml-0.5" />{i.address}</span>}
                        </span>
                      </Link>
                      {st === 'member' ? (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 rounded-full px-2.5 py-1.5"><Check size={11} /> عضو</span>
                      ) : st === 'pending' ? (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full px-2.5 py-1.5"><Clock size={11} /> بالانتظار</span>
                      ) : st === 'busy' ? (
                        <Loader2 size={14} className="animate-spin text-ruwad-navy/30 shrink-0" />
                      ) : (
                        <button onClick={() => requestJoin(i.id)}
                          className="shrink-0 text-[11px] font-bold text-white bg-ruwad-blue hover:opacity-90 rounded-full px-3 py-1.5 transition">
                          انضمام
                        </button>
                      )}
                    </div>
                  )
                })}

                {results?.trainers.map((t) => (
                  <Link key={t.id} href={`/t/${t.id}`} onClick={onResultClick}
                    className="flex items-center gap-2.5 rounded-ruwad-sm hover:bg-ruwad-gray/20 px-2.5 py-2.5 transition group">
                    {t.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.avatar} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-ruwad-gray/50 shrink-0" />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-ruwad-gradient text-white text-sm font-black flex items-center justify-center shrink-0">{t.name.charAt(0)}</span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ruwad-navy truncate group-hover:text-ruwad-blue transition-colors">{t.name}</span>
                      {t.bio && <span className="block text-[11px] font-semibold text-ruwad-navy/45 truncate">{t.bio}</span>}
                    </span>
                    <ArrowLeft size={14} className="text-ruwad-navy/25 group-hover:text-ruwad-blue group-hover:-translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}

                {results?.students.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 rounded-ruwad-sm hover:bg-ruwad-gray/20 px-2.5 py-2.5 transition group">
                    <Link href={`/s/${s.id}`} onClick={onResultClick} className="flex items-center gap-2.5 min-w-0 flex-1">
                      {s.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.avatar} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-ruwad-gray/50 shrink-0" />
                      ) : (
                        <span className="w-10 h-10 rounded-full bg-ruwad-gradient text-white text-sm font-black flex items-center justify-center shrink-0">{s.name.charAt(0)}</span>
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-ruwad-navy truncate group-hover:text-ruwad-blue transition-colors">{s.name}</span>
                        {s.code && <span className="block text-[11px] font-semibold text-ruwad-navy/40" dir="ltr">{s.code}</span>}
                      </span>
                    </Link>
                    <InviteToCourseButton studentId={s.id} courses={myCourses} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
