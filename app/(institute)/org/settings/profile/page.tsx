import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { InstituteProfileForm } from '@/components/institute/InstituteProfileForm'

export default async function InstituteProfileSettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('*').eq('owner_id', user!.id).single()
  if (!institute) redirect('/org/dashboard')

  return (
    <>
      <Header title="بيانات المعهد" />
      <main className="p-4 sm:p-6 max-w-xl mx-auto">
        <InstituteProfileForm institute={institute} />
      </main>
    </>
  )
}
