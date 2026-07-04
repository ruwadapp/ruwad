import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AttendanceCheckIn } from '@/components/student/AttendanceCheckIn'
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; error?: string }>
}) {
  const { session: sessionId, error } = await searchParams

  // ===== حالة خاصة: وصل الطالب من مسح QR مع session_id =====
  if (sessionId) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: record } = await supabase
      .from('attendance_records')
      .select('status')
      .eq('session_id', sessionId)
      .eq('student_id', user!.id)
      .maybeSingle()

    const { data: session } = await supabase
      .from('attendance_sessions')
      .select('title')
      .eq('id', sessionId)
      .single()

    return (
      <>
        <Header title="تسجيل الحضور" />
        <main className="p-6 flex flex-col gap-4">
          <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
            {record?.status === 'approved' ? (
              <>
                <CheckCircle2 size={52} className="text-ruwad-blue" />
                <h2 className="text-xl font-bold text-ruwad-navy">تم تأكيد حضورك ✅</h2>
                <p className="text-sm text-ruwad-navy/60">{session?.title}</p>
              </>
            ) : record?.status === 'rejected' ? (
              <>
                <XCircle size={52} className="text-red-400" />
                <h2 className="text-xl font-bold text-ruwad-navy">تم رفض طلب حضورك</h2>
                <p className="text-sm text-ruwad-navy/60">تواصل مع مدربك للاستفسار.</p>
              </>
            ) : (
              <>
                <Clock size={52} className="text-amber-500 animate-pulse" />
                <h2 className="text-xl font-bold text-ruwad-navy">تم تسجيل طلب حضورك 🎉</h2>
                <p className="text-sm text-ruwad-navy/60">{session?.title}</p>
                <p className="text-xs text-ruwad-navy/40 mt-1">بانتظار موافقة المدرب...</p>
              </>
            )}
          </div>
          <div className="max-w-sm mx-auto w-full">
            <AttendanceCheckIn />
          </div>
        </main>
      </>
    )
  }

  // ===== حالة خطأ: جلسة مغلقة =====
  if (error === 'session_closed') {
    return (
      <>
        <Header title="تسجيل الحضور" />
        <main className="p-6">
          <div className="bg-white rounded-ruwad shadow-card p-8 flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
            <AlertTriangle size={48} className="text-amber-500" />
            <h2 className="font-bold text-ruwad-navy">هذه الجلسة مغلقة</h2>
            <p className="text-sm text-ruwad-navy/60">انتهت جلسة الحضور أو لم تُفعَّل بعد. تواصل مع مدربك.</p>
          </div>
        </main>
      </>
    )
  }

  // ===== الحالة العادية: إدخال كود يدوياً =====
  return (
    <>
      <Header title="تسجيل الحضور" />
      <main className="p-6">
        <AttendanceCheckIn />
      </main>
    </>
  )
}
