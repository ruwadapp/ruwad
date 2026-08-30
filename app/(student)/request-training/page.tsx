import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { TrainingRequestManager } from '@/components/student/TrainingRequestManager'
import { Megaphone } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RequestTrainingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: requests } = await supabase
    .from('training_requests')
    .select('*, training_offers(count)')
    .eq('student_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="اطلب تدريباً" />
      <main className="p-6 max-w-3xl mx-auto w-full flex flex-col gap-5">
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-6 text-white">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-ruwad-lime/25 rounded-full blur-2xl" />
          <h1 className="relative text-xl font-extrabold flex items-center gap-2"><Megaphone size={20} className="text-ruwad-lime" /> ماذا تريد أن تتعلم؟</h1>
          <p className="relative text-sm text-white/80 mt-1.5">انشر طلبك وسيصلك عرض من أقدر مدربي ومعاهد رُوّاد على تدريبك.</p>
        </div>
        <TrainingRequestManager
          initial={(requests ?? []).map((r) => ({
            id: r.id, topic: r.topic, details: r.details, city: r.city, mode: r.mode,
            status: r.status, created_at: r.created_at,
            offersCount: r.training_offers?.[0]?.count ?? 0,
          }))}
        />
      </main>
    </>
  )
}
