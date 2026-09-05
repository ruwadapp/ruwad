import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { MyGroupsView } from '@/components/student/MyGroupsView'

export default async function StudentCourseGroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: enrollment } = await supabase
    .from('enrollments').select('id, course:courses(title)')
    .eq('course_id', id).eq('student_id', user!.id).eq('status', 'approved').single()
  if (!enrollment) redirect('/my-courses')

  const { data: groups } = await supabase
    .from('project_groups')
    .select('id, name, description, color, members:project_group_members(student:profiles!student_id(id, full_name, avatar_url)), tasks:project_group_tasks(id, title, description, due_date, is_completed)')
    .eq('course_id', id).order('created_at')

  const list = (groups ?? []).map((g) => ({
    id: g.id, name: g.name, description: g.description, color: g.color,
    members: (g.members as unknown as { student: { id: string; full_name: string; avatar_url: string | null } | null }[])
      .map((m) => m.student).filter((s): s is { id: string; full_name: string; avatar_url: string | null } => !!s),
    tasks: (g.tasks as unknown as { id: string; title: string; description: string | null; due_date: string | null; is_completed: boolean }[])
      .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')),
  }))

  const courseTitle = (enrollment.course as unknown as { title?: string })?.title ?? 'التدريب'

  return (
    <>
      <Header title={`مجموعات — ${courseTitle}`} />
      <main className="p-4 sm:p-6 max-w-3xl mx-auto">
        <MyGroupsView groups={list as never} myStudentId={user!.id} />
      </main>
    </>
  )
}
