import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AccountsApprovalManager } from '@/components/superadmin/AccountsApprovalManager'

export default async function SuperAdminAccountsPage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: accounts }, { data: plans }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, role, account_status, created_at, is_frozen, subscription_ends_at, plan_name, plan_price, billing_cycle')
      .neq('role', 'super_admin')
      .order('created_at', { ascending: false }),
    supabase
      .from('platform_plans')
      .select('name, monthly_price, yearly_price')
      .eq('is_active', true)
      .order('sort_order'),
  ])

  return (
    <>
      <Header title="الحسابات" />
      <main className="p-4 sm:p-6">
        <AccountsApprovalManager initial={accounts ?? []} plans={plans ?? []} />
      </main>
    </>
  )
}
