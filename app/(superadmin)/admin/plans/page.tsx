import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { PlansManager } from '@/components/superadmin/PlansManager'
import { PLANS_SELECT, type PlatformPlan } from '@/lib/plans'

export default async function SuperAdminPlansPage() {
  const supabase = await createServerSupabaseClient()

  // السوبر أدمن يرى كل الخطط بما فيها المخفية (سياسة plans_read_admin)
  const { data: plans } = await supabase
    .from('platform_plans')
    .select(PLANS_SELECT)
    .order('sort_order')

  return (
    <>
      <Header title="الخطط والأسعار" />
      <main className="p-4 sm:p-6">
        <PlansManager initial={(plans ?? []) as PlatformPlan[]} />
      </main>
    </>
  )
}
