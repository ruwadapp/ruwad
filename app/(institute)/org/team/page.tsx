import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { TeamManager } from '@/components/institute/TeamManager'

export default async function InstituteTeamPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: institute } = await supabase
    .from('institutes').select('id').eq('owner_id', session!.user.id).single()
  if (!institute) redirect('/org/dashboard')

  const { data: overview } = await supabase.rpc('institute_team_overview', { p_institute_id: institute.id })
  const o = (overview ?? { trainers: [], staff: [], pending_invites: [], join_requests: [] }) as {
    trainers: unknown[]; staff: unknown[]; pending_invites: unknown[]; join_requests: unknown[]
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="الفريق" />
      <main className="p-4 sm:p-6 max-w-4xl mx-auto">
        <TeamManager
          instituteId={institute.id}
          trainers={o.trainers as never}
          staff={o.staff as never}
          pendingInvites={o.pending_invites as never}
          joinRequests={o.join_requests as never}
        />
      </main>
    </div>
  )
}
