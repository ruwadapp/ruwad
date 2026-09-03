import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { FinanceHub } from '@/components/institute/FinanceHub'

export default async function InstituteFinancePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: institute } = await supabase
    .from('institutes').select('id, name').eq('owner_id', session!.user.id).single()
  if (!institute) redirect('/org/dashboard')

  const [{ data: stats }, { data: ledger }, { data: studentMembers }, { data: shares }, { data: trainerMembers }, { data: compensations }] = await Promise.all([
    supabase.rpc('finance_stats', { p_institute_id: institute.id }),
    supabase.from('finance_ledger')
      .select('*, student:profiles!student_id(full_name), trainer:profiles!trainer_id(full_name), course:courses(title)')
      .eq('institute_id', institute.id)
      .order('occurred_at', { ascending: false })
      .limit(300),
    supabase.from('institute_members')
      .select('user_id, profile:profiles!user_id(full_name)')
      .eq('institute_id', institute.id).eq('member_role', 'student').eq('status', 'approved'),
    supabase.from('resource_institute_shares').select('resource_id, course:courses(id, title)')
      .eq('resource_type', 'courses').eq('institute_id', institute.id),
    supabase.from('institute_members')
      .select('user_id, profile:profiles!user_id(full_name)')
      .eq('institute_id', institute.id).eq('member_role', 'trainer').eq('status', 'approved'),
    supabase.from('trainer_compensations')
      .select('*, trainer:profiles!trainer_id(full_name)')
      .eq('institute_id', institute.id),
  ])

  const courses = (shares ?? [])
    .map((s) => s.course as never as { id: string; title: string } | null)
    .filter((c): c is { id: string; title: string } => !!c)

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="المالية" />
      <main className="p-4 sm:p-6 max-w-5xl mx-auto">
        <FinanceHub
          instituteId={institute.id}
          stats={stats as never}
          ledger={(ledger ?? []) as never}
          students={(studentMembers ?? []) as never}
          courses={courses}
          trainers={(trainerMembers ?? []) as never}
          compensations={(compensations ?? []) as never}
        />
      </main>
    </div>
  )
}
