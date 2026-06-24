import { LoginForm } from '@/components/auth/LoginForm'

// لا تُجمَّد هذه الصفحة وقت البناء — تُعالَج عند كل طلب (Runtime)
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return <LoginForm />
}
