import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { EnrollButton } from '@/components/student/EnrollButton'
import { BookOpen } from 'lucide-react'

export default async function MyCoursesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, course:courses(*)')
    .eq('student_id', user!.id)

  const enrolledIds = (enrollments ?? []).map((e) => e.course_id)

  const { data: availableCourses } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .not('id', 'in', `(${enrolledIds.length ? enrolledIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)

  return (
    <>
      <Header title="كورساتي" />
      <main className="p-6 flex flex-col gap-8">
        <section>
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">كورساتي الحالية</h2>
          {!enrollments || enrollments.length === 0 ? (
            <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
              <BookOpen className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
              <p className="text-ruwad-navy/60">لم تسجّل في أي كورس بعد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/my-courses/${enrollment.course_id}`}
                  className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad transition"
                >
                  <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">
                    {enrollment.course?.title}
                  </h3>
                  <div className="w-full bg-ruwad-gray/40 rounded-full h-2">
                    <div
                      className="bg-ruwad-blue h-2 rounded-full"
                      style={{ width: `${enrollment.progress ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-ruwad-navy/50">{enrollment.progress ?? 0}% مكتمل</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">كورسات متاحة للتسجيل</h2>
          {!availableCourses || availableCourses.length === 0 ? (
            <p className="text-ruwad-navy/50 text-sm">لا توجد كورسات جديدة متاحة حالياً.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3">
                  <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">
                    {course.description || 'بلا وصف'}
                  </p>
                  <EnrollButton courseId={course.id} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
