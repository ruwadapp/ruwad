import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/shared/ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  let stats: { label: string; value: string | number }[] = []

  if (profile.role === 'trainer') {
    const [{ count: coursesCount }, { count: studentsCount }, { count: examsCount }] = await Promise.all([
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('trainer_id', user.id),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('exams').select('id', { count: 'exact', head: true }).eq('trainer_id', user.id),
    ])
    stats = [
      { label: 'الكورسات', value: coursesCount ?? 0 },
      { label: 'الطلاب', value: studentsCount ?? 0 },
      { label: 'الامتحانات', value: examsCount ?? 0 },
    ]
  } else if (profile.role === 'student') {
    const [{ count: coursesCount }, { count: badgesCount }, { data: submissions }] = await Promise.all([
      supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('student_id', user.id).eq('status', 'approved'),
      supabase.from('student_badges').select('id', { count: 'exact', head: true }).eq('student_id', user.id),
      supabase.from('exam_submissions').select('percentage').eq('student_id', user.id).not('graded_at', 'is', null),
    ])
    const avg = submissions && submissions.length > 0
      ? Math.round(submissions.reduce((s, r) => s + (r.percentage ?? 0), 0) / submissions.length)
      : null
    stats = [
      { label: 'التدريبات', value: coursesCount ?? 0 },
      { label: 'الشارات', value: badgesCount ?? 0 },
      { label: 'متوسط النتائج', value: avg !== null ? `${avg}%` : '—' },
    ]
  } else if (profile.role === 'institute_admin') {
    const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user.id).single()
    if (institute) {
      const [{ count: trainersCount }, { count: studentsCount }] = await Promise.all([
        supabase.from('institute_members').select('id', { count: 'exact', head: true }).eq('institute_id', institute.id).eq('member_role', 'trainer').eq('status', 'approved'),
        supabase.from('institute_members').select('id', { count: 'exact', head: true }).eq('institute_id', institute.id).eq('member_role', 'student').eq('status', 'approved'),
      ])
      stats = [
        { label: 'المدربون', value: trainersCount ?? 0 },
        { label: 'الطلاب', value: studentsCount ?? 0 },
      ]
    }
  }

  return <ProfileClient profile={profile} stats={stats} />
}
