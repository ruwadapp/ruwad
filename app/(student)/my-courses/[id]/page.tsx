import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CheckCircle2, Circle, Video, FileText } from 'lucide-react'

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

  return (
    <>
      <Header title={enrollment.course.title} />
      <main className="p-6 flex flex-col gap-6">
        <div className="bg-white rounded-ruwad shadow-card p-6">
          <p className="text-ruwad-navy/70 mb-4">{enrollment.course.description}</p>
          <div className="w-full bg-ruwad-gray/40 rounded-full h-2">
            <div className="bg-ruwad-blue h-2 rounded-full" style={{ width: `${enrollment.progress ?? 0}%` }} />
          </div>
          <p className="text-xs text-ruwad-navy/50 mt-1.5">{enrollment.progress ?? 0}% مكتمل</p>
        </div>

        <div className="bg-white rounded-ruwad shadow-card p-6">
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">المحاضرات</h2>
          {!lectures || lectures.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm py-4 text-center">لا توجد محاضرات منشورة حالياً.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {lectures.map((lecture, idx) => {
                const done = completedIds.has(lecture.id)
                return (
                  <Link
                    key={lecture.id}
                    href={`/my-courses/${id}/lectures/${lecture.id}`}
                    className="flex items-center gap-3 p-4 rounded-ruwad-sm border border-ruwad-gray/60 hover:bg-ruwad-gray/10 transition"
                  >
                    {done ? (
                      <CheckCircle2 size={20} className="text-ruwad-blue shrink-0" />
                    ) : (
                      <Circle size={20} className="text-ruwad-navy/30 shrink-0" />
                    )}
                    <span className="w-6 h-6 rounded-full bg-ruwad-gray/40 text-ruwad-navy text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    {lecture.video_url ? (
                      <Video size={18} className="text-ruwad-blue shrink-0" />
                    ) : (
                      <FileText size={18} className="text-ruwad-blue shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ruwad-navy truncate">{lecture.title}</p>
                      {lecture.duration_minutes && (
                        <p className="text-xs text-ruwad-navy/50">{lecture.duration_minutes} دقيقة</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
