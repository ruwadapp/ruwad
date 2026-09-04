import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { InstituteMembership } from '@/components/shared/InstituteMembership'
import { InstituteBrowser } from '@/components/student/InstituteBrowser'
import { TeamInvitations } from '@/components/trainer/TeamInvitations'

// المعهد (للمدرب): دعوات فِرَق بانتظار الرد، تصفح وانضمام بضغطة، وعضوياته الحالية
export default async function TrainerInstitutePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: institutes }, { data: memberships }, { data: invites }] = await Promise.all([
    supabase.from('profiles').select('user_code').eq('id', user!.id).single(),
    supabase.from('institutes').select('id, name, description, logo_url, address').order('name'),
    supabase.from('institute_members').select('institute_id, status').eq('user_id', user!.id).eq('member_role', 'trainer'),
    supabase.from('institute_members')
      .select('id, created_at, institute:institutes(id, name, logo_url)')
      .eq('user_id', user!.id).eq('member_role', 'trainer').eq('status', 'pending').eq('invited_by', 'admin'),
  ])

  return (
    <>
      <Header title="المعهد" />
      <main className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-6">
        <TeamInvitations invites={(invites ?? []) as never} />
        <InstituteBrowser
          institutes={(institutes ?? []) as never}
          memberships={(memberships ?? []) as never}
          memberRole="trainer"
        />
        <InstituteMembership memberRole="trainer" userCode={profile?.user_code ?? ''} />
      </main>
    </>
  )
}
