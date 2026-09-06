import { InterestLeadForm } from '@/components/marketing/InterestLeadForm'

export const metadata = { title: 'أنا مهتم بتدريب — رُوّاد' }

// نموذج عام (بلا حساب) لأي زائر يريد التقاط اهتمامه بتدريب — يظهر للمدربين والمعاهد في "الرادار"
export default function InterestedPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4 sm:p-8">
      <InterestLeadForm />
    </main>
  )
}
