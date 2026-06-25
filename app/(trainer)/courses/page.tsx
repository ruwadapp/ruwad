import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { Plus, BookOpen, Users, Pencil } from 'lucide-react'

export default async function CoursesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: courses } = await supabase
    .from('courses')
    .select('*, lectures(count), enrollments(count)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="الكورسات" />
      <main className="p-6 flex flex-col gap-6">
        <div className="flex justify-end">
          <Link
            href="/courses/new"
            className="bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition shadow-ruwad flex items-center gap-2"
          >
            <Plus size={18} />
            كورس جديد
          </Link>
        </div>

        {!courses || courses.length === 0 ? (
          <div className="bg-white rounded-ruwad shadow-card p-10 text-center">
            <BookOpen className="mx-auto text-ruwad-navy/30 mb-3" size={40} />
            <p className="text-ruwad-navy/60">لا توجد كورسات حتى الآن. أنشئ أول كورس لك.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course, idx) => (
              <div
                key={course.id}
                className={`bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3 hover:shadow-ruwad transition border-t-4 ${
                  ['border-ruwad-blue', 'border-ruwad-lime', 'border-ruwad-navy'][idx % 3]
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-ruwad-navy text-lg line-clamp-1">{course.title}</h3>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      course.status === 'published'
                        ? 'bg-ruwad-lime text-ruwad-navy'
                        : 'bg-ruwad-gray/50 text-ruwad-navy/60'
                    }`}
                  >
                    {course.status === 'published' ? 'منشور' : 'مسودة'}
                  </span>
                </div>
                <p className="text-sm text-ruwad-navy/60 line-clamp-2 min-h-[2.5rem]">
                  {course.description || 'بلا وصف'}
                </p>
                <div className="flex items-center gap-4 text-sm text-ruwad-navy/50">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={16} /> {course.lectures?.[0]?.count ?? 0} محاضرة
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={16} /> {course.enrollments?.[0]?.count ?? 0} طالب
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-ruwad-gray/40">
                  <Link
                    href={`/courses/${course.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-ruwad-blue hover:bg-ruwad-blue/10 px-3 py-2 rounded-ruwad-sm transition"
                  >
                    <Pencil size={15} /> تعديل
                  </Link>
                  <DeleteButton table="courses" id={course.id} label="حذف" confirmText="حذف الكورس سيحذف معه كل محاضراته وتسجيلات الطلاب فيه نهائياً. متابعة؟" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
