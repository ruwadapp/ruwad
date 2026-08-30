import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'
import { MobileBottomNav } from '@/components/shared/MobileBottomNav'
import { PointsToast } from '@/components/student/PointsToast'
import { PageTransition } from '@/components/shared/PageTransition'
import { OnboardingPermissions } from '@/components/shared/OnboardingPermissions'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'student') redirect('/dashboard')

  const { data: myLoc } = await supabase.from('user_locations').select('visible').eq('user_id', user.id).maybeSingle()

  return (
    <div className="flex min-h-screen bg-[#F5F6FA]" dir="rtl">
      <Sidebar profile={profile} />
      <div className="flex-1 min-w-0 pb-24 md:pb-0"><PageTransition>{children}</PageTransition></div>
      <MobileBottomNav profile={profile} />
      <OnboardingPermissions locationMode="user" hasLocation={!!myLoc} locationVisible={myLoc?.visible ?? true} />
      <PointsToast />
    </div>
  )
}
