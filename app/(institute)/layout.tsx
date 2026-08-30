import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'
import { MobileBottomNav } from '@/components/shared/MobileBottomNav'
import { PageTransition } from '@/components/shared/PageTransition'
import { OnboardingPermissions } from '@/components/shared/OnboardingPermissions'

export default async function InstituteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'institute_admin') redirect('/dashboard')

  const { data: myInstitute } = await supabase.from('institutes').select('id, latitude').eq('owner_id', user.id).maybeSingle()

  return (
    <div className="flex min-h-screen bg-[#F5F6FA]" dir="rtl">
      <Sidebar profile={profile} />
      <div className="flex-1 min-w-0 pb-24 md:pb-0"><PageTransition>{children}</PageTransition></div>
      <MobileBottomNav profile={profile} />
      <OnboardingPermissions locationMode="institute" instituteId={myInstitute?.id} hasLocation={myInstitute?.latitude != null} />
    </div>
  )
}
