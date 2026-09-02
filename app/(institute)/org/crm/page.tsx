import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { InquiriesManager } from '@/components/institute/InquiriesManager'

export default async function InstituteCrmPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: institute } = await supabase
    .from('institutes').select('id').eq('owner_id', session!.user.id).single()
  if (!institute) redirect('/org/dashboard')

  const { data: inquiries } = await supabase
    .from('institute_inquiries')
    .select('*, course:courses(title)')
    .eq('institute_id', institute.id)
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="المهتمون" />
      <main className="p-4 sm:p-6 max-w-4xl mx-auto">
        <InquiriesManager initial={(inquiries ?? []) as never} />
      </main>
    </div>
  )
}
