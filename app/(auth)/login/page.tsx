import { LoginForm } from '@/components/auth/LoginForm'
import { AuthHero } from '@/components/shared/AuthHero'

// لا تُجمَّد هذه الصفحة وقت البناء — تُعالَج عند كل طلب (Runtime)
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen" dir="rtl">
      <LoginForm />
      <AuthHero />
    </div>
  )
}
