import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { InstituteMembersManager } from '@/components/institute/InstituteMembersManager'

export default async function InstituteMembersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user!.id).single()

  if (!institute) {
    return (
      <>
        <Header title="الأعضاء" />
        <main className="p-6">
          <div className="bg-red-50 text-red-600 text-sm rounded-ruwad-sm px-4 py-3">
            لم يتم العثور على معهد مرتبط بحسابك.
          </div>
        </main>
      </>
    )
  }

  const { data: members } = await supabase
    .from('institute_members')
    .select('*, member:profiles!user_id(full_name, user_code)')
    .eq('institute_id', institute.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="الأعضاء" />
      <main className="p-6">
        <InstituteMembersManager instituteId={institute.id} initial={members ?? []} />
      </main>
    </>
  )
}
