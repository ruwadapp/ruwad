import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { InstituteMembership } from '@/components/shared/InstituteMembership'
import { InstituteBrowser } from '@/components/student/InstituteBrowser'

// معهدي (للطالب): عضوياته الحالية + انضمام بالكود + تصفح المعاهد والانضمام بضغطة
export default async function StudentInstitutesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: profile }, { data: institutes }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('user_code').eq('id', session!.user.id).single(),
    supabase.from('institutes').select('id, name, description, logo_url, address').order('name'),
    supabase.from('institute_members').select('institute_id, status').eq('user_id', session!.user.id),
  ])

  return (
    <>
      <Header title="معهدي" />
      <main className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-6">
        {/* تصفح المعاهد — الانضمام بضغطة */}
        <InstituteBrowser
          institutes={(institutes ?? []) as never}
          memberships={(memberships ?? []) as never}
        />
        {/* العضويات + الانضمام بالكود (نفس تجربة المدرب) */}
        <InstituteMembership memberRole="student" userCode={profile?.user_code ?? ''} />
      </main>
    </>
  )
}
