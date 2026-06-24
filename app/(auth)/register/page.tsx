import { RegisterForm } from '@/components/auth/RegisterForm'

// لا تُجمَّد هذه الصفحة وقت البناء — تُعالَج عند كل طلب (Runtime)
export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  return <RegisterForm />
}
