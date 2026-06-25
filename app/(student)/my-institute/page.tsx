import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { InstituteMembership } from '@/components/shared/InstituteMembership'

export default async function StudentInstitutePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('user_code').eq('id', user!.id).single()

  return (
    <>
      <Header title="المعهد" />
      <main className="p-6">
        <InstituteMembership memberRole="student" userCode={profile?.user_code ?? ''} />
      </main>
    </>
  )
}
