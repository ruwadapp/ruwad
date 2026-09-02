import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { PortalsManager } from '@/components/superadmin/PortalsManager'

export default async function SuperAdminPortalsPage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: portals }, { data: institutes }, { data: signupCounts }] = await Promise.all([
    supabase.from('institute_portals')
      .select('*, institute:institutes(name)')
      .order('created_at', { ascending: false }),
    supabase.from('institutes').select('id, name').order('name'),
    supabase.from('profiles').select('signup_portal_id').not('signup_portal_id', 'is', null),
  ])

  const counts: Record<string, number> = {}
  for (const r of signupCounts ?? []) counts[r.signup_portal_id] = (counts[r.signup_portal_id] ?? 0) + 1

  return (
    <>
      <Header title="بوابات المعاهد" />
      <main className="p-6">
        <PortalsManager
          initial={(portals ?? []) as never}
          institutes={institutes ?? []}
          signupCounts={counts}
        />
      </main>
    </>
  )
}
