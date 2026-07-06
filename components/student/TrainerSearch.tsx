'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, UserPlus, UserCheck, GraduationCap, Building2 } from 'lucide-react'

interface TrainerResult { kind: 'trainer'; id: string; full_name: string; avatar_url: string | null; bio: string | null }
interface InstituteResult { kind: 'institute'; id: string; full_name: string; bio: string | null }
type SearchResult = TrainerResult | InstituteResult

export function TrainerSearch({ followedIds, followedInstituteIds = [] }: { followedIds: string[]; followedInstituteIds?: string[] }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [following, setFollowing] = useState(new Set(followedIds))
  const [followingInstitutes, setFollowingInstitutes] = useState(new Set(followedInstituteIds))
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const [{ data: trainers }, { data: institutes }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, avatar_url, bio').eq('role', 'trainer').ilike('full_name', `%${q}%`).limit(10),
        supabase.from('institutes').select('id, name, description').ilike('name', `%${q}%`).limit(10),
      ])
      setResults([
        ...(trainers ?? []).map((t): TrainerResult => ({ kind: 'trainer', id: t.id, full_name: t.full_name, avatar_url: t.avatar_url, bio: t.bio })),
        ...(institutes ?? []).map((i): InstituteResult => ({ kind: 'institute', id: i.id, full_name: i.name, bio: i.description })),
      ])
      setLoading(false)
    }, 350)
    return () => clearTimeout(timer)
  }, [query, supabase])

  async function toggleFollowTrainer(trainerId: string) {
    setBusyId(trainerId)
    const isFollowing = following.has(trainerId)
    if (isFollowing) {
      await supabase.from('trainer_follows').delete().eq('trainer_id', trainerId)
      setFollowing((prev) => { const next = new Set(prev); next.delete(trainerId); return next })
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('trainer_follows').insert({ student_id: user!.id, trainer_id: trainerId })
      setFollowing((prev) => new Set(prev).add(trainerId))
    }
    setBusyId(null)
    router.refresh()
  }

  async function toggleFollowInstitute(instituteId: string) {
    setBusyId(instituteId)
    const isFollowing = followingInstitutes.has(instituteId)
    if (isFollowing) {
      await supabase.from('trainer_follows').delete().eq('institute_id', instituteId)
      setFollowingInstitutes((prev) => { const next = new Set(prev); next.delete(instituteId); return next })
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('trainer_follows').insert({ student_id: user!.id, institute_id: instituteId })
      setFollowingInstitutes((prev) => new Set(prev).add(instituteId))
    }
    setBusyId(null)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-5 flex flex-col gap-3">
      <div className="relative">
        <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-ruwad-navy/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن مدرّب أو معهد بالاسم..."
          className="w-full border border-ruwad-gray rounded-ruwad-sm pr-10 pl-4 py-2.5 outline-none focus:border-ruwad-blue transition"
        />
      </div>

      {loading && <p className="text-xs text-ruwad-navy/40">جارٍ البحث...</p>}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((r) => {
            const isFollowing = r.kind === 'trainer' ? following.has(r.id) : followingInstitutes.has(r.id)
            return (
              <div key={`${r.kind}-${r.id}`} className="flex items-center justify-between gap-3 p-3 rounded-ruwad-sm bg-ruwad-gray/10">
                <Link href={`${r.kind === 'trainer' ? '/t' : '/i'}/${r.id}`} className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition">
                  <span className="w-9 h-9 rounded-full bg-ruwad-blue/10 text-ruwad-blue flex items-center justify-center shrink-0">
                    {r.kind === 'trainer' ? <GraduationCap size={16} /> : <Building2 size={16} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ruwad-navy truncate">{r.full_name}</p>
                    {r.bio && <p className="text-xs text-ruwad-navy/50 truncate">{r.bio}</p>}
                  </div>
                </Link>
                <button
                  onClick={() => (r.kind === 'trainer' ? toggleFollowTrainer(r.id) : toggleFollowInstitute(r.id))}
                  disabled={busyId === r.id}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition shrink-0 disabled:opacity-50 ${
                    isFollowing ? 'bg-ruwad-lime/30 text-ruwad-navy' : 'bg-ruwad-blue text-white hover:opacity-90'
                  }`}
                >
                  {isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />} {isFollowing ? 'متابَع' : 'متابعة'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

