import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CheckCircle2, Circle, Video, FileText, Clock, XCircle, PlayCircle } from 'lucide-react'

export default async function StudentCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*, course:courses(*)')
    .eq('course_id', id)
    .eq('student_id', user!.id)
    .single()

  if (!enrollment || !enrollment.course) redirect('/my-courses')

  if (enrollment.status !== 'approved') {
    return (
      <>
        <Header title={enrollment.course.title} />
        <main className="p-6">
          <div className="bg-white rounded-ruwad shadow-card p-10 flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
            {enrollment.status === 'pending' ? (
              <>
                <Clock size={48} className="text-ruwad-navy/40" />
                <h2 className="font-bold text-ruwad-navy">طلبك بانتظار موافقة المدرب</h2>
                <p className="text-sm text-ruwad-navy/60">ستظهر محتويات الكورس بعد قبول طلب التحاقك.</p>
              </>
            ) : (
              <>
                <XCircle size={48} className="text-red-400" />
                <h2 className="font-bold text-ruwad-navy">تم رفض طلب التحاقك بهذا الكورس</h2>
              </>
            )}
            <Link href="/my-courses" className="text-ruwad-blue text-sm font-semibold mt-2">رجوع لكورساتي</Link>
          </div>
        </main>
      </>
    )
  }

  const { data: lectures } = await supabase
    .from('lectures')
    .select('*')
    .eq('course_id', id)
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  const { data: progress } = await supabase
    .from('lecture_progress')
    .select('lecture_id, completed')
    .eq('student_id', user!.id)

  const completedIds = new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lecture_id))
  const firstIncompleteIdx = (lectures ?? []).findIndex((l) => !completedIds.has(l.id))
  const courseProgress = enrollment.progress ?? 0

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden bg-ruwad-gradient px-6 py-10">
        <div className="absolute -top-16 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-ruwad-lime/20 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto flex flex-col items-center text-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{enrollment.course.title}</h1>
          {enrollment.course.description && (
            <p className="text-white/70 text-sm max-w-lg">{enrollment.course.description}</p>
          )}

          <div className="w-full max-w-sm flex items-center gap-3 mt-2">
            <div className="flex-1 bg-white/20 rounded-full h-2.5">
              <div className="bg-ruwad-lime h-2.5 rounded-full transition-all" style={{ width: `${courseProgress}%` }} />
            </div>
            <span className="text-white font-bold text-sm shrink-0">{courseProgress}%</span>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-3xl mx-auto w-full -mt-2">
        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">المحاضرات</h2>
          {!lectures || lectures.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-4 text-center">لا توجد محاضرات منشورة حالياً.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {lectures.map((lecture, idx) => {
                const done = completedIds.has(lecture.id)
                const isUpNext = idx === firstIncompleteIdx
                return (
                  <Link
                    key={lecture.id}
                    href={`/my-courses/${id}/lectures/${lecture.id}`}
                    className={`flex items-center gap-3 p-4 rounded-ruwad-sm border-2 transition hover:shadow-card ${
                      done ? 'border-ruwad-lime/50 bg-ruwad-lime/5' :
                      isUpNext ? 'border-ruwad-blue bg-ruwad-blue/5' :
                      'border-ruwad-gray/50 hover:border-ruwad-gray'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 size={22} className="text-ruwad-blue shrink-0" />
                    ) : (
                      <Circle size={22} className="text-ruwad-navy/25 shrink-0" />
                    )}
                    <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      done ? 'bg-ruwad-lime text-ruwad-navy' : isUpNext ? 'bg-ruwad-blue text-white' : 'bg-ruwad-gray/40 text-ruwad-navy'
                    }`}>
                      {idx + 1}
                    </span>
                    {lecture.video_url ? (
                      <Video size={18} className="text-ruwad-blue/70 shrink-0" />
                    ) : (
                      <FileText size={18} className="text-ruwad-blue/70 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ruwad-navy truncate">{lecture.title}</p>
                      {lecture.duration_minutes && (
                        <p className="text-xs text-ruwad-navy/50">{lecture.duration_minutes} دقيقة</p>
                      )}
                    </div>
                    {isUpNext && !done && (
                      <span className="flex items-center gap-1 text-xs font-bold text-ruwad-blue shrink-0">
                        <PlayCircle size={14} /> التالية
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
