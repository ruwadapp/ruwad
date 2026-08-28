import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { EnrollmentRequests } from '@/components/trainer/EnrollmentRequests'
import { AwardBadgePanel } from '@/components/shared/AwardBadgePanel'

export default async function InstituteStudentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user!.id).single()
  if (!institute) redirect('/org/dashboard')

  const { data: shares } = await supabase
    .from('resource_institute_shares')
    .select('resource_id')
    .eq('institute_id', institute.id)
    .eq('resource_type', 'courses')

  const courseIds = (shares ?? []).map((s) => s.resource_id)
  const { data: courses } = courseIds.length
    ? await supabase.from('courses').select('id, title').in('id', courseIds)
    : { data: [] }

  const { data: members } = await supabase
    .from('institute_members')
    .select('user_id')
    .eq('institute_id', institute.id)
    .eq('status', 'approved')
  const trainerIds = (members ?? []).map((m) => m.user_id)

  // شارات قابلة للمنح: شارات المنصة العامة + شارات مدربي المعهد
  const { data: awardableBadges } = await supabase
    .from('badges')
    .select('id, name, icon, trainer_id')
    .or(trainerIds.length ? `trainer_id.is.null,trainer_id.in.(${trainerIds.join(',')})` : 'trainer_id.is.null')

  const { data: enrollments } = courseIds.length
    ? await supabase
        .from('enrollments')
        .select('*, student:profiles!student_id(full_name, avatar_url), course:courses(title)')
        .in('course_id', courseIds)
        .order('enrolled_at', { ascending: false })
    : { data: [] }

  return (
    <>
      <Header title="الطلاب" />
      <main className="p-6 flex flex-col gap-6">
        <p className="text-sm text-ruwad-navy/60 -mt-2">
          طلاب الكورسات التي شاركها معهدك المدربون تحديداً؛ يمكنك قبول أو رفض طلبات الالتحاق تماماً
          كما يفعل المدرب — أيّكما يوافق أولاً يُلتحق الطالب فوراً.
        </p>
        <AwardBadgePanel
          students={(() => {
            const m = new Map<string, string>()
            for (const e of enrollments ?? []) {
              if (e.status !== 'approved') continue
              const name = (e.student as unknown as { full_name?: string })?.full_name
              if (name && !m.has(e.student_id)) m.set(e.student_id, name)
            }
            return [...m.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'ar'))
          })()}
          badges={(awardableBadges ?? []).map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
        />

        <EnrollmentRequests courses={courses ?? []} initial={enrollments ?? []} />
      </main>
    </>
  )
}
