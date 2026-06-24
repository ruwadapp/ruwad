import { Header } from '@/components/shared/Header'
import { PresentationForm } from '@/components/trainer/PresentationForm'

export default function NewPresentationPage() {
  return (
    <>
      <Header title="عرض تقديمي جديد" />
      <main className="p-6">
        <PresentationForm />
      </main>
    </>
  )
}
