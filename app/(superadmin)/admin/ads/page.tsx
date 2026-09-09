import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AdsManager } from '@/components/superadmin/AdsManager'

export const dynamic = 'force-dynamic'

export default async function AdsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: ads } = await supabase
    .from('platform_ads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="الإعلانات" />
      <main className="p-6 max-w-4xl mx-auto w-full">
        <AdsManager initial={ads ?? []} />
      </main>
    </>
  )
}
