import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthHero } from '@/components/shared/AuthHero'

// لا تُجمَّد هذه الصفحة وقت البناء — تُعالَج عند كل طلب (Runtime)
export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen" dir="rtl">
      <RegisterForm />
      <AuthHero />
    </div>
  )
}
