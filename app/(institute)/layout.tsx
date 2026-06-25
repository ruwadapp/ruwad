import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'

export default async function InstituteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'institute_admin') redirect('/dashboard')

  const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user.id).single()
  if (institute) {
    const { data: hasAccess } = await supabase.rpc('institute_has_active_access', { p_institute_id: institute.id })
    if (!hasAccess) redirect('/subscription-required')
  }

  return (
    <div className="flex min-h-screen bg-[#F5F6FA]" dir="rtl">
      <Sidebar profile={profile} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
