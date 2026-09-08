import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { RevenueManager, type PaymentRow } from '@/components/superadmin/RevenueManager'

export default async function SuperAdminRevenuePage() {
  const supabase = await createServerSupabaseClient()

  const { data: payments } = await supabase
    .from('platform_payments')
    .select('id, subscriber_id, subscriber_name, amount, billing_cycle, plan_name, paid_at, notes')
    .order('paid_at', { ascending: false })

  return (
    <>
      <Header title="الإيرادات" />
      <main className="p-4 sm:p-6">
        <RevenueManager initial={(payments ?? []) as PaymentRow[]} />
      </main>
    </>
  )
}
