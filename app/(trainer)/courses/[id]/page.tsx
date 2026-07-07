import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CourseForm } from '@/components/trainer/CourseForm'
import { LectureManager } from '@/components/trainer/LectureManager'
import { CourseStudentPerformance } from '@/components/trainer/CourseStudentPerformance'
import { RelatedCourseItems } from '@/components/shared/RelatedCourseItems'
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
  const [institutes, sharedInstituteIds, { data: lectures }, { data: exams }, { data: assignments }, { data: challenges }] = await Promise.all([
    actingAsInstituteAdmin ? Promise.resolve([]) : getTrainerInstitutes(supabase, user!.id),
    actingAsInstituteAdmin ? Promise.resolve([]) : getResourceShares(supabase, 'courses', id),
    supabase.from('lectures').select('*').eq('course_id', id).order('order_index', { ascending: true }),
    supabase.from('exams').select('id, title, questions(count)').eq('course_id', id),
    supabase.from('assignments').select('id, title, assignment_submissions(count)').eq('course_id', id),
    supabase.from('challenges').select('id, title, challenge_questions(count)').eq('course_id', id),
  ])

  return (
    <>
      <Header title={course.title} />
      <main className="p-6 flex flex-col gap-6">
        {actingAsInstituteAdmin && (
          <div className="bg-ruwad-blue/10 text-ruwad-blue text-sm font-semibold rounded-ruwad-sm px-4 py-3 flex items-center gap-2">
            <Building2 size={16} /> تُعدّل هذا الكورس بصفتك مدير المعهد، بما أن المدرب فعّل مشاركته مع معهدك. أي
            امتحان أو واجب أو تحدٍ مرتبط به قابل للتعديل أيضاً.
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 [&>*]:w-full sm:[&>*]:w-auto [&>*]:flex [&>*]:justify-center">
          {institutes.length > 0 && (
            <ShareManager resourceType="courses" resourceId={id} institutes={institutes} initialSharedInstituteIds={sharedInstituteIds} />
          )}
          <DeleteButton table="courses" id={id} redirectTo="/courses" label="حذف الكورس" />
        </div>
        <CourseForm initialCourse={course} />
        <LectureManager courseId={id} lectures={lectures ?? []} />
        <RelatedCourseItems
          courseId={id}
          exams={(exams ?? []).map((e) => ({ id: e.id, title: e.title, count: e.questions?.[0]?.count ?? 0, countLabel: 'سؤال' }))}
          assignments={(assignments ?? []).map((a) => ({ id: a.id, title: a.title, count: a.assignment_submissions?.[0]?.count ?? 0, countLabel: 'تسليم' }))}
          challenges={(challenges ?? []).map((c) => ({ id: c.id, title: c.title, count: c.challenge_questions?.[0]?.count ?? 0, countLabel: 'سؤال' }))}
        />
        <CourseStudentPerformance courseId={id} />
      </main>
    </>
  )
}



