import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { AuthHero } from '@/components/shared/AuthHero'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen" dir="rtl">
      <ResetPasswordForm hasValidSession={!!user} />
      <AuthHero />
    </div>
  )
}
