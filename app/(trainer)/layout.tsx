import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'
import { MobileBottomNav } from '@/components/shared/MobileBottomNav'
import { PageTransition } from '@/components/shared/PageTransition'

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  // مدير المعهد مسموح له بالدخول أيضاً كي يستطيع فتح وتعديل صفحات التفاصيل
  // (كورس/امتحان/واجب/تحدٍ) التي شاركها معه أحد المدربين المنضمين له. صلاحية
  // التعديل الفعلية محكومة بـ RLS داخل كل صفحة، وليس بهذا الحارس فقط.
  if (profile?.role !== 'trainer' && profile?.role !== 'institute_admin') redirect('/home')

  return (
    <div className="flex min-h-screen bg-[#F5F6FA]" dir="rtl">
      <Sidebar profile={profile} />
      <div className="flex-1 min-w-0 pb-24 md:pb-0"><PageTransition>{children}</PageTransition></div>
      <MobileBottomNav profile={profile} />
    </div>
  )
}
