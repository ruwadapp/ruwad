import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AccountsApprovalManager } from '@/components/superadmin/AccountsApprovalManager'

export default async function SuperAdminAccountsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: accounts } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, account_status, created_at, is_frozen, subscription_ends_at')
    .neq('role', 'super_admin')
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="الحسابات" />
      <main className="p-6">
        <AccountsApprovalManager initial={accounts ?? []} />
      </main>
    </>
  )
}
