import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AnnouncementComposer } from '@/components/shared/AnnouncementComposer'

export const dynamic = 'force-dynamic'

export default async function InstituteNotifPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase
    .from('institutes').select('id').eq('owner_id', user!.id).single()

  const { data: shares } = institute
    ? await supabase.from('resource_institute_shares')
        .select('resource_id').eq('institute_id', institute.id).eq('resource_type', 'courses')
    : { data: [] }

  const ids = (shares ?? []).map((s) => s.resource_id)
  const { data: courses } = ids.length
    ? await supabase.from('courses').select('id, title').in('id', ids)
    : { data: [] }

  return (
    <>
      <Header title="إرسال إشعار" />
      <main className="p-6 flex flex-col gap-6">
        <AnnouncementComposer courses={courses ?? []} rpcName="send_institute_announcement" />
      </main>
    </>
  )
}
