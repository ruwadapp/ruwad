'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Enrollment } from '@/lib/types'
import {
  UserCheck, UserX, Clock, Users, RefreshCw, Search,
  ChevronDown, ChevronUp, Download, UserMinus, BookOpen,
} from 'lucide-react'

interface CourseLite { id: string; title: string }

export function EnrollmentRequests({ courses, initial }: { courses: CourseLite[]; initial: Enrollment[] }) {
  const [items, setItems] = useState<Enrollment[]>(initial)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const supabase = createClient()
  const courseIds = useMemo(() => courses.map((c) => c.id), [courses])

  const fetchAll = useCallback(async () => {
    if (courseIds.length === 0) return
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, student:profiles!student_id(full_name, avatar_url), course:courses(title)')
      .in('course_id', courseIds)
      .order('enrolled_at', { ascending: false })
    if (error) { setFetchError(error.message); return }
    setFetchError(null)
    if (data) setItems(data)
  }, [courseIds, supabase])

  async function manualRefresh() {
    setRefreshing(true)
    await fetchAll()
    setRefreshing(false)
  }

  const fetchJoined = useCallback(async (enrollmentId: string) => {
    const { data } = await supabase
      .from('enrollments')
      .select('*, student:profiles!student_id(full_name, avatar_url), course:courses(title)')
      .eq('id', enrollmentId)
      .single()
    return data
  }, [supabase])

  useEffect(() => {
    if (courseIds.length === 0) return
    const channel = supabase
      .channel(`enrollments-requests:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'enrollments' },
        async (payload) => {
          const newRow = payload.new as Enrollment
          if (!courseIds.includes(newRow.course_id)) return
          const joined = await fetchJoined(newRow.id)
          if (joined) setItems((prev) => (prev.some((p) => p.id === joined.id) ? prev : [joined, ...prev]))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [courseIds, supabase, fetchJoined])

  useEffect(() => {
    const interval = setInterval(fetchAll, 10000)
    return () => clearInterval(interval)
  }, [fetchAll])

  async function respond(id: string, status: 'approved' | 'rejected') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('enrollments')
      .update({ status, responded_at: new Date().toISOString(), responded_by: user?.id })
      .eq('id', id)
    setItems((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
  }

  async function removeFromCourse(id: string, studentName: string) {
    if (!confirm(`إزالة "${studentName}" من هذا الكورس؟ سيفقد الوصول لمحتواه فوراً (يمكنه إعادة طلب الالتحاق لاحقاً).`)) return
    const { error } = await supabase.from('enrollments').delete().eq('id', id)
    if (!error) setItems((prev) => prev.filter((e) => e.id !== id))
  }

  function toggleCollapse(courseId: string) {
    setCollapsed((prev) => ({ ...prev, [courseId]: !prev[courseId] }))
  }

  function exportCsv(courseTitle: string, students: Enrollment[]) {
    const rows = [
      ['الاسم', 'تاريخ الالتحاق', 'نسبة التقدّم'],
      ...students.map((s) => [
        s.student?.full_name ?? '—',
        new Date(s.enrolled_at).toLocaleDateString('ar'),
        `${s.progress ?? 0}%`,
      ]),
    ]
    const csv = '\uFEFF' + rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `طلاب-${courseTitle}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pending = items.filter((e) => e.status === 'pending')
  const approved = items.filter((e) => e.status === 'approved')

  const searchLower = search.trim().toLowerCase()
  const matchesSearch = (e: Enrollment) =>
    !searchLower || (e.student?.full_name ?? '').toLowerCase().includes(searchLower)

  return (
    <div className="flex flex-col gap-6">
      {fetchError && (
        <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">
          تعذّر تحميل الطلاب: {fetchError}
        </div>
      )}

      {/* ===== طلبات الالتحاق ===== */}
      <div className="bg-white rounded-ruwad shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ruwad-navy flex items-center gap-2">
            <Clock size={20} className="text-ruwad-blue" /> طلبات الالتحاق ({pending.length})
          </h2>
          <button onClick={manualRefresh} disabled={refreshing} className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-blue disabled:opacity-50">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> تحديث
          </button>
        </div>

        {pending.length === 0 ? (
          <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد طلبات جديدة حالياً.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60">
                <div className="w-9 h-9 rounded-full bg-ruwad-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {e.student?.full_name?.charAt(0) ?? '؟'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ruwad-navy truncate">{e.student?.full_name ?? 'طالب'}</p>
                  <p className="text-xs text-ruwad-navy/50 truncate">{e.course?.title}</p>
                </div>
                <button onClick={() => respond(e.id, 'approved')} aria-label="قبول" className="bg-ruwad-lime text-ruwad-navy p-2 rounded-ruwad-sm hover:opacity-80 transition">
                  <UserCheck size={18} />
                </button>
                <button onClick={() => respond(e.id, 'rejected')} aria-label="رفض" className="bg-red-100 text-red-600 p-2 rounded-ruwad-sm hover:opacity-80 transition">
                  <UserX size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== الطلاب المقبولون — مجمّعون حسب الكورس ===== */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-ruwad-navy flex items-center gap-2">
            <Users size={20} className="text-ruwad-blue" /> الطلاب المقبولون ({approved.length})
          </h2>
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ruwad-navy/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم..."
              className="border border-ruwad-gray rounded-ruwad-sm pr-9 pl-3 py-2 text-sm outline-none focus:border-ruwad-blue transition w-56"
            />
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/60">
            أنشئ كورساً أولاً لتظهر هنا قوائم طلابه.
          </div>
        ) : (
          courses.map((course) => {
            const courseStudents = approved.filter((e) => e.course_id === course.id)
            const filtered = courseStudents.filter(matchesSearch)
            if (searchLower && filtered.length === 0) return null
            const isCollapsed = collapsed[course.id]

            return (
              <div key={course.id} className="bg-white rounded-ruwad shadow-card overflow-hidden">
                <button
                  onClick={() => toggleCollapse(course.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-ruwad-gray/10 transition text-right"
                >
                  <span className="flex items-center gap-2 font-bold text-ruwad-navy">
                    <BookOpen size={18} className="text-ruwad-blue" /> {course.title}
                    <span className="text-sm font-normal text-ruwad-navy/50">({courseStudents.length} طالب)</span>
                  </span>
                  {isCollapsed ? <ChevronDown size={18} className="text-ruwad-navy/40" /> : <ChevronUp size={18} className="text-ruwad-navy/40" />}
                </button>

                {!isCollapsed && (
                  <div className="px-5 pb-5">
                    {courseStudents.length === 0 ? (
                      <p className="text-ruwad-navy/50 text-sm py-4 text-center">لا يوجد طلاب مقبولون في هذا الكورس بعد.</p>
                    ) : (
                      <>
                        <div className="flex justify-end mb-3">
                          <button
                            onClick={() => exportCsv(course.title, courseStudents)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-navy/60 hover:text-ruwad-blue transition"
                          >
                            <Download size={14} /> تصدير CSV
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-right text-ruwad-navy/50 border-b border-ruwad-gray/60">
                                <th className="py-2">الطالب</th>
                                <th className="py-2">تاريخ الالتحاق</th>
                                <th className="py-2">التقدّم</th>
                                <th className="py-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((e) => (
                                <tr key={e.id} className="border-b border-ruwad-gray/30">
                                  <td className="py-3 text-ruwad-navy">{e.student?.full_name ?? '—'}</td>
                                  <td className="py-3 text-ruwad-navy/60">{new Date(e.enrolled_at).toLocaleDateString('ar')}</td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-20 bg-ruwad-gray/30 rounded-full h-2">
                                        <div className="bg-ruwad-blue h-2 rounded-full" style={{ width: `${e.progress ?? 0}%` }} />
                                      </div>
                                      <span className="text-xs text-ruwad-navy/60">{e.progress ?? 0}%</span>
                                    </div>
                                  </td>
                                  <td className="py-3 text-left">
                                    <button
                                      onClick={() => removeFromCourse(e.id, e.student?.full_name ?? 'الطالب')}
                                      aria-label="إزالة من الكورس"
                                      className="text-red-400 hover:bg-red-50 p-1.5 rounded-ruwad-sm transition"
                                    >
                                      <UserMinus size={15} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
