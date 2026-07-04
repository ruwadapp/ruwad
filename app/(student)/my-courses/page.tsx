import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CourseCodeJoin } from '@/components/student/CourseCodeJoin'
import { BookOpen, Clock, XCircle, GraduationCap, TrendingUp } from 'lucide-react'

export default async function MyCoursesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, course:courses(*, lectures(count))')
    .eq('student_id', user!.id)
    .order('enrolled_at', { ascending: false })

  const approved = (enrollments ?? []).filter((e) => e.status === 'approved')
  const pending = (enrollments ?? []).filter((e) => e.status === 'pending')
  const rejected = (enrollments ?? []).filter((e) => e.status === 'rejected')

  const completedCount = approved.filter((e) => (e.progress ?? 0) >= 100).length
  const avgProgress = approved.length
    ? Math.round(approved.reduce((sum, e) => sum + (e.progress ?? 0), 0) / approved.length)
    : 0

  return (
    <>
      <Header title="التدريبات" />
      <main className="p-6 flex flex-col gap-8">
        {/* ===== هيدر إحصائي ===== */}
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-7">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />
          <h1 className="relative text-xl font-bold text-white">رحلتك التدريبية</h1>
          <div className="relative grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-3 text-center">
              <GraduationCap size={18} className="text-white mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{approved.length}</p>
              <p className="text-[11px] text-white/70">تدريب نشط</p>
            </div>
            <div className="bg-ruwad-lime rounded-ruwad-sm p-3 text-center">
              <BookOpen size={18} className="text-ruwad-navy mx-auto mb-1" />
              <p className="text-xl font-bold text-ruwad-navy">{completedCount}</p>
              <p className="text-[11px] text-ruwad-navy/70">مكتمل</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-3 text-center">
              <TrendingUp size={18} className="text-white mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{avgProgress}%</p>
              <p className="text-[11px] text-white/70">متوسط التقدّم</p>
            </div>
          </div>
        </div>

        <CourseCodeJoin />

        {/* ===== التدريبات الحالية ===== */}
        <section>
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">التدريبات الحالية</h2>
          {approved.length === 0 ? (
            <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
              <BookOpen className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
              <p className="text-ruwad-navy/60">لم تنضمّ لأي تدريب بعد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {approved.map((enrollment, idx) => {
                const progress = enrollment.progress ?? 0
                const isDone = progress >= 100
                const lectureCount = enrollment.course?.lectures?.[0]?.count ?? 0
                return (
                  <Link
                    key={enrollment.id}
                    href={`/my-courses/${enrollment.course_id}`}
                    className={`bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad-lg hover:-translate-y-0.5 transition-all border-t-4 ${
                      isDone ? 'border-ruwad-lime' : ['border-ruwad-blue', 'border-ruwad-navy', 'border-ruwad-lime'][idx % 3]
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{enrollment.course?.title}</h3>
                      {isDone && <span className="text-xs font-bold bg-ruwad-lime text-ruwad-navy px-2.5 py-1 rounded-full shrink-0">مكتمل 🎉</span>}
                    </div>
                    <p className="text-xs text-ruwad-navy/50 flex items-center gap-1">
                      <BookOpen size={13} /> {lectureCount} محاضرة
                    </p>
                    <div className="w-full bg-ruwad-gray/40 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full transition-all ${isDone ? 'bg-ruwad-lime' : 'bg-ruwad-blue'}`} style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-ruwad-navy/50">{progress}% مكتمل</p>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {pending.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-ruwad-navy mb-4">طلبات قيد المراجعة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((enrollment) => (
                <div key={enrollment.id} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-2">
                  <h3 className="font-bold text-ruwad-navy line-clamp-1">{enrollment.course?.title}</h3>
                  <span className="flex items-center gap-1.5 text-sm text-ruwad-navy/60 w-fit bg-ruwad-gray/30 px-3 py-1 rounded-full">
                    <Clock size={14} /> بانتظار موافقة المدرب
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {rejected.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-ruwad-navy mb-4">طلبات مرفوضة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rejected.map((enrollment) => (
                <div key={enrollment.id} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-2 opacity-70">
                  <h3 className="font-bold text-ruwad-navy line-clamp-1">{enrollment.course?.title}</h3>
                  <span className="flex items-center gap-1.5 text-sm text-red-500 w-fit bg-red-50 px-3 py-1 rounded-full">
                    <XCircle size={14} /> تم رفض الطلب
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== الانضمام عبر كود فقط ===== */}
        <div className="bg-ruwad-navy/5 rounded-ruwad p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-ruwad-blue/10 flex items-center justify-center shrink-0">
            <BookOpen size={20} className="text-ruwad-blue" />
          </div>
          <div>
            <p className="font-semibold text-ruwad-navy text-sm">للانضمام لتدريب جديد</p>
            <p className="text-xs text-ruwad-navy/60 mt-0.5">اطلب كود الانضمام أو رابط QR من مدربك مباشرة، أو استخدم زر "إضافة" في شريط التنقّل لمسح الكود.</p>
          </div>
        </div>
      </main>
    </>
  )
}
