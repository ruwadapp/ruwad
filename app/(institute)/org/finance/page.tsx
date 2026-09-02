import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { FinanceManager } from '@/components/institute/FinanceManager'
import { FinanceTabs } from '@/components/institute/FinanceTabs'
import { ExpensesPanel } from '@/components/institute/ExpensesPanel'

export default async function InstituteFinancePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session!.user

  const { data: institute } = await supabase
    .from('institutes').select('id, name').eq('owner_id', user.id).single()
  if (!institute) redirect('/org/dashboard')

  const monthStart = new Date(); monthStart.setDate(1)
  const monthStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-01`
  const [{ data: overviewArr }, { data: plans }, { data: shares }, { data: monthlySummary }, { data: expenses }, { data: compensations }, { data: instTrainers }] = await Promise.all([
    supabase.rpc('institute_finance_overview', { p_institute_id: institute.id }),
    supabase.from('payment_plans')
      .select(`*, installments:payment_installments(id, seq, amount, due_date),
               records:payment_records(id, amount, method, paid_at, receipt_code, note),
               enrollment:enrollments(id, student:profiles!student_id(id, full_name), course:courses(id, title))`)
      .eq('institute_id', institute.id)
      .order('created_at', { ascending: false }),
    supabase.from('resource_institute_shares').select('resource_id')
      .eq('resource_type', 'courses').eq('institute_id', institute.id),
    supabase.rpc('institute_monthly_summary', { p_institute_id: institute.id, p_month: monthStr }),
    supabase.from('institute_expenses')
      .select('*, trainer:profiles!trainer_id(full_name)')
      .eq('institute_id', institute.id).order('spent_at', { ascending: false }).limit(200),
    supabase.from('trainer_compensations')
      .select('*, trainer:profiles!trainer_id(full_name)')
      .eq('institute_id', institute.id),
    supabase.from('institute_members')
      .select('user_id, profile:profiles!user_id(full_name)')
      .eq('institute_id', institute.id).eq('member_role', 'trainer').eq('status', 'approved'),
  ])

  // التسجيلات القابلة لإنشاء خطة (على كورسات المعهد، بلا خطة بعد)
  const courseIds = (shares ?? []).map((s) => s.resource_id)
  const plannedEnrollmentIds = new Set((plans ?? []).map((p) => p.enrollment_id))
  const { data: enrollments } = courseIds.length
    ? await supabase.from('enrollments')
        .select('id, student:profiles!student_id(full_name), course:courses(title)')
        .in('course_id', courseIds).eq('status', 'approved')
    : { data: [] }
  const plannable = (enrollments ?? []).filter((e) => !plannedEnrollmentIds.has(e.id))

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="المالية" />
      <main className="p-4 sm:p-6 max-w-6xl mx-auto">
        <FinanceTabs
          plans={
            <FinanceManager
              instituteId={institute.id}
              overview={overviewArr?.[0] ?? null}
              initialPlans={(plans ?? []) as never}
              plannable={plannable as never}
            />
          }
          expenses={
            <ExpensesPanel
              instituteId={institute.id}
              initialSummary={monthlySummary as never}
              initialExpenses={(expenses ?? []) as never}
              compensations={(compensations ?? []) as never}
              trainers={(instTrainers ?? []) as never}
            />
          }
        />
      </main>
    </div>
  )
}
