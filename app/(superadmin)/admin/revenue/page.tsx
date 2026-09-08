import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { RevenueManager, type SubscriptionRow } from '@/components/superadmin/RevenueManager'

export default async function SuperAdminRevenuePage() {
  const supabase = await createServerSupabaseClient()

  const { data: subscriptions } = await supabase
    .from('platform_subscriptions')
    .select('id, subscriber_id, subscriber_name, amount, billing_cycle, plan_name, started_at, is_active, cancelled_at, notes')
    .order('started_at', { ascending: false })

  return (
    <>
      <Header title="الإيرادات" />
      <main className="p-4 sm:p-6">
        <RevenueManager initial={(subscriptions ?? []) as SubscriptionRow[]} />
      </main>
    </>
  )
}
