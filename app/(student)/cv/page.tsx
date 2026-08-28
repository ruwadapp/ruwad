import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CVBuilder } from '@/components/student/CVBuilder'
import type { CVData } from '@/lib/cv'
import { Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CVBuilderPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { count: certsCount }] = await Promise.all([
    supabase.from('profiles').select('cv_data, skills, email, phone').eq('id', user!.id).single(),
    supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('student_id', user!.id),
  ])

  const cv = (profile?.cv_data ?? {}) as CVData
  if (!cv.email && profile?.email) cv.email = profile.email
  if (!cv.phone && profile?.phone) cv.phone = profile.phone

  return (
    <>
      <Header title="سيرتي الذاتية" />
      <main className="p-6 max-w-3xl mx-auto w-full flex flex-col gap-5">
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-6 text-white">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-ruwad-lime/20 rounded-full blur-3xl" />
          <h1 className="relative text-xl font-extrabold flex items-center gap-2"><Sparkles size={20} className="text-ruwad-lime" /> ابنِ سيرتك الذاتية الاحترافية</h1>
          <p className="relative text-sm text-white/80 mt-1.5 leading-relaxed">
            عبّئ الأقسام التالية وحمّل سيرتك بصيغة PDF بتصميم رُوّاد الأنيق.
            {(certsCount ?? 0) > 0 && ` لديك ${certsCount} ${certsCount === 1 ? 'شهادة موثّقة' : 'شهادات موثّقة'} من رُوّاد ستُضاف تلقائياً مع رموز QR للتحقق ✨`}
          </p>
        </div>
        <CVBuilder initial={cv} initialSkills={(profile?.skills ?? []) as string[]} />
      </main>
    </>
  )
}
