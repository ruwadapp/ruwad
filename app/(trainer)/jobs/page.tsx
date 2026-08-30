import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { JobsManager } from '@/components/shared/JobsManager'

export const dynamic = 'force-dynamic'

export default async function JobsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: jobs } = await supabase
    .from('job_opportunities')
    .select('*')
    .eq('publisher_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="فرص العمل" />
      <main className="p-6 max-w-3xl mx-auto w-full">
        <JobsManager initialJobs={jobs ?? []} />
      </main>
    </>
  )
}
