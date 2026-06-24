'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Enrollment } from '@/lib/types'
import { UserCheck, UserX, Clock, Users, RefreshCw } from 'lucide-react'

export function EnrollmentRequests({ courseIds, initial }: { courseIds: string[]; initial: Enrollment[] }) {
  const [items, setItems] = useState<Enrollment[]>(initial)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    if (courseIds.length === 0) return
    const { data } = await supabase
      .from('enrollments')
      .select('*, student:profiles(full_name, avatar_url), course:courses(title)')
      .in('course_id', courseIds)
      .order('enrolled_at', { ascending: false })
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
      .select('*, student:profiles(full_name, avatar_url), course:courses(title)')
      .eq('id', enrollmentId)
      .single()
    return data
  }, [supabase])

  // Realtime كخط أول — يحدّث فوراً لحظة وصول طلب جديد
  useEffect(() => {
    if (courseIds.length === 0) return
    const channel = supabase
      .channel('enrollments-requests')
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

  // خط ثانٍ احتياطي — تحديث دوري كل 10 ثوانٍ في حال تعطّل الاتصال اللحظي خلف بعض الشبكات
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

  const pending = items.filter((e) => e.status === 'pending')
  const approved = items.filter((e) => e.status === 'approved')

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-ruwad shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ruwad-navy flex items-center gap-2">
            <Clock size={20} className="text-ruwad-blue" /> طلبات الالتحاق ({pending.length})
          </h2>
          <button
            onClick={manualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-blue disabled:opacity-50"
          >
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

      <div className="bg-white rounded-ruwad shadow-card p-6">
        <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
          <Users size={20} className="text-ruwad-blue" /> الطلاب المقبولون ({approved.length})
        </h2>

        {approved.length === 0 ? (
          <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا يوجد طلاب مقبولون بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-ruwad-navy/50 border-b border-ruwad-gray/60">
                  <th className="py-2">الطالب</th>
                  <th className="py-2">الكورس</th>
                  <th className="py-2">التقدّم</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((e) => (
                  <tr key={e.id} className="border-b border-ruwad-gray/30">
                    <td className="py-3 text-ruwad-navy">{e.student?.full_name ?? '—'}</td>
                    <td className="py-3 text-ruwad-navy/70">{e.course?.title}</td>
                    <td className="py-3 text-ruwad-navy">{e.progress ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
