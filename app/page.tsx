import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/marketing/LandingPage'
import { PLANS_SELECT, type PlatformPlan } from '@/lib/plans'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // الخطط تُدار من لوحة السوبر أدمن — الزائر يرى النشطة فقط بترتيبها
    const { data: plans } = await supabase
      .from('platform_plans')
      .select(PLANS_SELECT)
      .eq('is_active', true)
      .order('sort_order')
    return <LandingPage dbPlans={(plans ?? []) as PlatformPlan[]} />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const redirectMap: Record<string, string> = {
    trainer: '/dashboard', student: '/home', institute_admin: '/org/dashboard', super_admin: '/admin/dashboard',
  }
  redirect(redirectMap[profile?.role ?? 'student'] ?? '/home')
}
