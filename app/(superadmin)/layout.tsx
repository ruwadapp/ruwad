import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'
import { MobileBottomNav } from '@/components/shared/MobileBottomNav'
import { PageTransition } from '@/components/shared/PageTransition'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  // الجلسة من الكوكي محلياً — التحقق الفعلي من صحتها يتم في middleware على كل طلب،
  // فلا داعي لرحلة شبكة إضافية إلى خادم المصادقة عند كل تنقّل
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-[#F5F6FA]" dir="rtl">
      <Sidebar profile={profile} />
      <div className="flex-1 min-w-0 pb-24 md:pb-0"><PageTransition>{children}</PageTransition></div>
      <MobileBottomNav profile={profile} />
    </div>
  )
}
