import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { GroupsList } from '@/components/shared/GroupsList'
import { loadGroupCards } from '@/lib/groups'

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const groups = await loadGroupCards(supabase, user!.id)
  const { data: inst } = await supabase.from('institutes').select('id').eq('owner_id', user!.id).single()
  const { data: shares } = inst ? await supabase.from('resource_institute_shares').select('resource_id').eq('institute_id', inst.id).eq('resource_type', 'courses') : { data: [] }
  const ids = (shares ?? []).map((s) => s.resource_id)
  const { data: shared } = ids.length ? await supabase.from('courses').select('id, title').in('id', ids) : { data: [] }
  const courses = shared ?? []
  return (
    <>
      <Header title="الدردشات" />
      <main className="p-6 max-w-3xl mx-auto w-full">
        <GroupsList groups={groups} canCreate={true} courses={courses} groupBasePath="/org/groups" />
      </main>
    </>
  )
}
