import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { EntityCard } from '@/components/shared/EntityCard'
import { getTrainerInstitute } from '@/lib/utils/getTrainerInstitute'
import { Plus, BookOpen } from 'lucide-react'

export default async function CoursesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const institute = await getTrainerInstitute(supabase, user!.id)

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {courses.map((course, idx) => (
              <EntityCard
                key={course.id}
                href={`/courses/${course.id}`}
                gradient={(['blue', 'navy', 'lime', 'blueReverse'] as const)[idx % 4]}
                title={course.title}
                description={course.description}
                badge={{
                  text: course.status === 'published' ? 'منشور' : course.status === 'archived' ? 'منتهي 🏁' : 'مسودة',
                  active: course.status === 'published',
                }}
                stats={[
                  { icon: 'book', label: `${course.lectures?.[0]?.count ?? 0} محاضرة` },
                  { icon: 'users', label: `${course.enrollments?.[0]?.count ?? 0} طالب` },
                ]}
                shareCode={course.course_code}
                deleteTable="courses"
                deleteId={course.id}
                deleteConfirmText="حذف الكورس سيحذف معه كل محاضراته وتسجيلات الطلاب فيه نهائياً. متابعة؟"
                instituteShare={institute ? { table: 'courses', shared: course.shared_with_institute ?? false, instituteName: institute.name } : undefined}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
