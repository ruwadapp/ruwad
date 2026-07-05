import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { AuthHero } from '@/components/shared/AuthHero'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen" dir="rtl">
      <ForgotPasswordForm />
      <AuthHero />
    </div>
  )
}
