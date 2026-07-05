'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AttendanceSession, AttendanceRecord } from '@/lib/types'
import { Copy, Check, Play, Square, UserCheck, UserX, CheckCheck, Link2 } from 'lucide-react'
import { CodeQrImage } from '@/components/shared/CodeQrImage'

export function AttendancePanel({
  session,
  initialRecords,
}: {
  session: AttendanceSession
  initialRecords: AttendanceRecord[]
}) {
  const [isActive, setIsActive] = useState(session.is_active)
  const [closed, setClosed] = useState(!!session.closed_at)
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const fetchStudentName = useCallback(async (studentId: string) => {
    const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', studentId).single()
    return data
  }, [supabase])

  useEffect(() => {
    const channel = supabase
      .channel(`attendance:${session.id}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_records', filter: `session_id=eq.${session.id}` },
        async (payload) => {
          const newRecord = payload.new as AttendanceRecord
          const student = await fetchStudentName(newRecord.student_id)
          setRecords((prev) => [...prev, { ...newRecord, student: (student as AttendanceRecord['student']) ?? undefined }])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.id, supabase, fetchStudentName])

  async function activateSession() {
    await supabase
      .from('attendance_sessions')
      .update({ is_active: true, activated_at: new Date().toISOString() })
      .eq('id', session.id)
    setIsActive(true)
    router.refresh()
  }

  async function closeSession() {
    await supabase
      .from('attendance_sessions')
      .update({ is_active: false, closed_at: new Date().toISOString() })
      .eq('id', session.id)
    setIsActive(false)
    setClosed(true)
    router.refresh()
  }

  async function updateStatus(recordId: string, status: 'approved' | 'rejected') {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('attendance_records')
      .update({ status, approved_at: new Date().toISOString(), approved_by: user?.id })
      .eq('id', recordId)
    setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, status } : r)))
  }

  async function acceptAll() {
    const pendingIds = records.filter((r) => r.status === 'pending').map((r) => r.id)
    if (pendingIds.length === 0) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('attendance_records')
      .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: user?.id })
      .in('id', pendingIds)
    setRecords((prev) => prev.map((r) => (pendingIds.includes(r.id) ? { ...r, status: 'approved' } : r)))
  }

  function copyCode() {
    navigator.clipboard.writeText(session.session_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyLink() {
    const url = `${window.location.origin}/qr/${session.session_code}`
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const pending = records.filter((r) => r.status === 'pending')
  const approved = records.filter((r) => r.status === 'approved')
  const rejected = records.filter((r) => r.status === 'rejected')

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-ruwad-gradient rounded-ruwad shadow-ruwad p-8 flex flex-col items-center gap-3 text-white">
        <p className="text-sm opacity-80">كود الجلسة</p>
        <div className="flex items-center gap-3">
          <p className="text-5xl font-mono font-bold tracking-[0.3em]">{session.session_code}</p>
          <button onClick={copyCode} aria-label="نسخ الكود" className="hover:opacity-80 transition">
            {copied ? <Check size={24} /> : <Copy size={24} />}
          </button>
        </div>
        <CodeQrImage code={session.session_code} size={130} className="mt-1" />
        <button onClick={copyLink} className="flex items-center gap-1.5 text-sm font-semibold bg-white/15 px-4 py-2 rounded-full hover:bg-white/25 transition mt-1">
          <Link2 size={15} /> {linkCopied ? 'تم النسخ ✓' : 'نسخ رابط تسجيل الحضور'}
        </button>
        <div className="flex items-center gap-2 mt-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-ruwad-lime' : 'bg-white/40'}`} />
          <span className="text-sm">{closed ? 'مغلقة' : isActive ? 'نشطة الآن' : 'لم تُفعَّل بعد'}</span>
        </div>

        <div className="flex gap-3 mt-4">
          {!isActive && !closed && (
            <button
              onClick={activateSession}
              className="bg-white text-ruwad-blue px-6 py-2.5 rounded-ruwad-sm font-semibold flex items-center gap-2 hover:opacity-90 transition"
            >
              <Play size={18} /> تفعيل الجلسة
            </button>
          )}
          {isActive && (
            <button
              onClick={closeSession}
              className="bg-ruwad-navy text-white px-6 py-2.5 rounded-ruwad-sm font-semibold flex items-center gap-2 hover:opacity-90 transition"
            >
              <Square size={18} /> إغلاق الجلسة
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-ruwad shadow-card p-5 text-center">
          <p className="text-2xl font-bold text-ruwad-navy">{approved.length}</p>
          <p className="text-xs text-ruwad-navy/50 mt-1">الحاضرون</p>
        </div>
        <div className="bg-white rounded-ruwad shadow-card p-5 text-center">
          <p className="text-2xl font-bold text-ruwad-navy">{pending.length}</p>
          <p className="text-xs text-ruwad-navy/50 mt-1">في الانتظار</p>
        </div>
        <div className="bg-white rounded-ruwad shadow-card p-5 text-center">
          <p className="text-2xl font-bold text-ruwad-navy">{rejected.length}</p>
          <p className="text-xs text-ruwad-navy/50 mt-1">مرفوضون</p>
        </div>
      </div>

      <div className="bg-white rounded-ruwad shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ruwad-navy">قائمة الانتظار</h2>
          {pending.length > 0 && (
            <button
              onClick={acceptAll}
              className="flex items-center gap-1.5 text-sm font-semibold text-ruwad-blue"
            >
              <CheckCheck size={16} /> قبول الكل
            </button>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا يوجد طلاب في الانتظار حالياً.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((record) => (
              <div key={record.id} className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60">
                <div className="w-9 h-9 rounded-full bg-ruwad-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {record.student?.full_name?.charAt(0) ?? '؟'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ruwad-navy truncate">{record.student?.full_name ?? 'طالب'}</p>
                  <p className="text-xs text-ruwad-navy/50">
                    {new Date(record.checked_in_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => updateStatus(record.id, 'approved')}
                  aria-label="قبول"
                  className="bg-ruwad-lime text-ruwad-navy p-2 rounded-ruwad-sm hover:opacity-80 transition"
                >
                  <UserCheck size={18} />
                </button>
                <button
                  onClick={() => updateStatus(record.id, 'rejected')}
                  aria-label="رفض"
                  className="bg-red-100 text-red-600 p-2 rounded-ruwad-sm hover:opacity-80 transition"
                >
                  <UserX size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {approved.length > 0 && (
        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">الحاضرون ({approved.length})</h2>
          <div className="flex flex-wrap gap-2">
            {approved.map((r) => (
              <span key={r.id} className="text-sm bg-ruwad-lime/30 text-ruwad-navy px-3 py-1.5 rounded-full">
                {r.student?.full_name ?? 'طالب'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
