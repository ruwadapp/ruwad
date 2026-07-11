'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Course } from '@/lib/types'
import { ExportCsvButton } from '@/components/shared/ExportCsvButton'
import { Award, AlertTriangle, Minus, TrendingUp, TrendingDown } from 'lucide-react'

interface StudentStat {
  student_id: string
  full_name: string
  avatar_url: string | null
  total_sessions: number
  attended: number
  absent: number
  rate: number
}

const CERT_THRESHOLD = 75
const RISK_THRESHOLD = 50

function statusFor(rate: number) {
  if (rate >= CERT_THRESHOLD) {
    return { label: 'يستحق الشهادة', className: 'bg-ruwad-lime text-ruwad-navy', Icon: Award }
  }
  if (rate < RISK_THRESHOLD) {
    return { label: 'في خطر عدم الإتمام', className: 'bg-red-100 text-red-600', Icon: AlertTriangle }
  }
  return { label: 'متوسط', className: 'bg-ruwad-gray/50 text-ruwad-navy/70', Icon: Minus }
}

export function AttendanceAnalytics({ courses }: { courses: Course[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [stats, setStats] = useState<StudentStat[]>([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadStats = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    const { data, error } = await supabase.rpc('get_course_attendance_stats', { p_course_id: id })
    if (!error && data) {
      setStats(data)
      setTotalSessions(data[0]?.total_sessions ?? 0)
    } else {
      setStats([])
      setTotalSessions(0)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (courseId) loadStats(courseId)
  }, [courseId, loadStats])

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/60">
        أنشئ كورساً أولاً لعرض إحصاءات الحضور الخاصة به.
      </div>
    )
  }

  const sorted = [...stats].sort((a, b) => b.rate - a.rate)
  const topAttendance = sorted.slice(0, 3)
  const bottomAttendance = [...stats].sort((a, b) => a.rate - b.rate).slice(0, 3)
  const certCount = stats.filter((s) => s.rate >= CERT_THRESHOLD).length
  const riskCount = stats.filter((s) => s.rate < RISK_THRESHOLD).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 max-w-xs">
        <label className="text-sm font-medium text-ruwad-navy">الكورس</label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="border border-ruwad-gray rounded-ruwad-sm px-4 py-2.5 outline-none focus:border-ruwad-blue transition bg-white"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-ruwad-navy/50 text-sm py-6 text-center">جارٍ التحميل...</p>
      ) : totalSessions === 0 ? (
        <div className="bg-white rounded-ruwad shadow-card p-10 text-center text-ruwad-navy/60">
          لم تُفعَّل أي جلسة حضور لهذا الكورس بعد.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-ruwad shadow-card p-5">
              <p className="text-sm text-ruwad-navy/60">إجمالي الجلسات المنعقدة</p>
              <p className="text-2xl font-bold text-ruwad-navy mt-1">{totalSessions}</p>
            </div>
            <div className="bg-ruwad-lime/20 rounded-ruwad shadow-card p-5">
              <p className="text-sm text-ruwad-navy/60">يستحقون الشهادة (≥{CERT_THRESHOLD}%)</p>
              <p className="text-2xl font-bold text-ruwad-navy mt-1">{certCount}</p>
            </div>
            <div className="bg-red-50 rounded-ruwad shadow-card p-5">
              <p className="text-sm text-ruwad-navy/60">في خطر عدم الإتمام (&lt;{RISK_THRESHOLD}%)</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{riskCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-ruwad shadow-card p-6">
              <h3 className="font-bold text-ruwad-navy mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-ruwad-blue" /> الأكثر حضوراً
              </h3>
              <div className="flex flex-col gap-2">
                {topAttendance.map((s) => (
                  <div key={s.student_id} className="flex items-center gap-3">
                    <span className="text-sm text-ruwad-navy flex-1 truncate">{s.full_name}</span>
                    <div className="flex-1 bg-ruwad-gray/30 rounded-full h-2">
                      <div className="bg-ruwad-blue h-2 rounded-full" style={{ width: `${s.rate}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-ruwad-navy w-12 text-left">{s.rate}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-ruwad shadow-card p-6">
              <h3 className="font-bold text-ruwad-navy mb-3 flex items-center gap-2">
                <TrendingDown size={18} className="text-red-500" /> الأكثر غياباً
              </h3>
              <div className="flex flex-col gap-2">
                {bottomAttendance.map((s) => (
                  <div key={s.student_id} className="flex items-center gap-3">
                    <span className="text-sm text-ruwad-navy flex-1 truncate">{s.full_name}</span>
                    <div className="flex-1 bg-ruwad-gray/30 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: `${s.rate}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-ruwad-navy w-12 text-left">{s.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-ruwad shadow-card p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="font-bold text-ruwad-navy">جدول تفصيلي</h3>
              <ExportCsvButton
                fileName={`حضور-${courses.find((c) => c.id === courseId)?.title ?? 'كورس'}`}
                headers={['الطالب', 'حاضر', 'غائب', 'النسبة', 'التقييم']}
                rows={sorted.map((s) => [s.full_name, s.attended, s.absent, `${s.rate}%`, statusFor(s.rate).label])}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-ruwad-navy/50 border-b border-ruwad-gray/60">
                    <th className="py-2">الطالب</th>
                    <th className="py-2">حاضر</th>
                    <th className="py-2">غائب</th>
                    <th className="py-2">النسبة</th>
                    <th className="py-2">التقييم</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => {
                    const status = statusFor(s.rate)
                    return (
                      <tr key={s.student_id} className="border-b border-ruwad-gray/30">
                        <td className="py-3 text-ruwad-navy">{s.full_name}</td>
                        <td className="py-3 text-ruwad-navy">{s.attended}</td>
                        <td className="py-3 text-ruwad-navy">{s.absent}</td>
                        <td className="py-3 text-ruwad-navy font-semibold">{s.rate}%</td>
                        <td className="py-3">
                          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${status.className}`}>
                            <status.Icon size={13} /> {status.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
