import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { TrainerFinanceHub } from '@/components/trainer/TrainerFinanceHub'

export default async function TrainerFinancePage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: overview }, { data: ownLedger }] = await Promise.all([
    supabase.rpc('trainer_finance_overview'),
    supabase.from('trainer_ledger').select('*').order('occurred_at', { ascending: false }).limit(300),
  ])

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="المالية" />
      <main className="p-4 sm:p-6 max-w-5xl mx-auto">
        <TrainerFinanceHub overview={overview as never} ownLedger={(ownLedger ?? []) as never} />
      </main>
    </div>
  )
}
