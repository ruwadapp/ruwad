import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CourseForm } from '@/components/trainer/CourseForm'
import { LectureManager } from '@/components/trainer/LectureManager'
import { CourseStudentPerformance } from '@/components/trainer/CourseStudentPerformance'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { ShareManager } from '@/components/shared/ShareManager'
import { getTrainerInstitutes, getResourceShares } from '@/lib/utils/getTrainerInstitutes'
import { Building2 } from 'lucide-react'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: course } = await supabase.from('courses').select('*').eq('id', id).single()
  if (!course) notFound()

  const actingAsInstituteAdmin = course.trainer_id !== user!.id
  const [institutes, sharedInstituteIds] = await Promise.all([
    actingAsInstituteAdmin ? Promise.resolve([]) : getTrainerInstitutes(supabase, user!.id),
    actingAsInstituteAdmin ? Promise.resolve([]) : getResourceShares(supabase, 'courses', id),
  ])

  const { data: lectures } = await supabase
    .from('lectures')
    .select('*')
    .eq('course_id', id)
    .order('order_index', { ascending: true })

  return (
    <>
      <Header title={course.title} />
      <main className="p-6 flex flex-col gap-6">
        {actingAsInstituteAdmin && (
          <div className="bg-ruwad-blue/10 text-ruwad-blue text-sm font-semibold rounded-ruwad-sm px-4 py-3 flex items-center gap-2">
            <Building2 size={16} /> تُعدّل هذا الكورس بصفتك مدير المعهد، بما أن المدرب فعّل مشاركته مع معهدك.
          </div>
        )}
        <div className="flex justify-end gap-3 flex-wrap">
          {institutes.length > 0 && (
            <ShareManager resourceType="courses" resourceId={id} institutes={institutes} initialSharedInstituteIds={sharedInstituteIds} />
          )}
          <DeleteButton table="courses" id={id} redirectTo="/courses" label="حذف الكورس" />
        </div>
        <CourseForm initialCourse={course} />
        <LectureManager courseId={id} lectures={lectures ?? []} />
        <CourseStudentPerformance courseId={id} />
      </main>
    </>
  )
}


