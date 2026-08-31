import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { GroupsList } from '@/components/shared/GroupsList'
import { loadGroupCards } from '@/lib/groups'

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const groups = await loadGroupCards(supabase, user!.id)
  const courses: { id: string; title: string }[] = []
  return (
    <>
      <Header title="الدردشات" />
      <main className="p-6 max-w-3xl mx-auto w-full">
        <GroupsList groups={groups} canCreate={false} courses={courses} groupBasePath="/my-groups" />
      </main>
    </>
  )
}
