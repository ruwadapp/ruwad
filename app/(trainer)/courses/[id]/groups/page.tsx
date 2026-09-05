import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { GroupsManager } from '@/components/trainer/GroupsManager'

export default async function CourseGroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: course } = await supabase.from('courses').select('id, title, trainer_id').eq('id', id).single()
  if (!course) notFound()
  const { data: canManage } = await supabase.rpc('can_manage_course_groups', { p_course_id: id })
  if (!canManage) redirect(`/courses/${id}`)

  const [{ data: groups }, { data: enrollments }] = await Promise.all([
    supabase.from('project_groups')
      .select('id, name, description, color, members:project_group_members(student:profiles!student_id(id, full_name, avatar_url)), tasks:project_group_tasks(id, title, description, due_date, is_completed)')
      .eq('course_id', id).order('created_at'),
    supabase.from('enrollments')
      .select('student:profiles!student_id(id, full_name, avatar_url)')
      .eq('course_id', id).eq('status', 'approved'),
  ])

  const roster = (enrollments ?? [])
    .map((e) => e.student as unknown as { id: string; full_name: string; avatar_url: string | null } | null)
    .filter((s): s is { id: string; full_name: string; avatar_url: string | null } => !!s)
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'))

  const initialGroups = (groups ?? []).map((g) => ({
    id: g.id, name: g.name, description: g.description, color: g.color,
    members: (g.members as unknown as { student: { id: string; full_name: string; avatar_url: string | null } | null }[])
      .map((m) => m.student).filter((s): s is { id: string; full_name: string; avatar_url: string | null } => !!s),
    tasks: (g.tasks as unknown as { id: string; title: string; description: string | null; due_date: string | null; is_completed: boolean }[])
      .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')),
  }))

  return (
    <>
      <Header title={`مجموعات — ${course.title}`} />
      <main className="p-4 sm:p-6 max-w-4xl mx-auto">
        <GroupsManager courseId={id} initialGroups={initialGroups as never} roster={roster} />
      </main>
    </>
  )
}
