import { Header } from '@/components/shared/Header'
import { SurveyForm } from '@/components/trainer/SurveyForm'

export default function NewSurveyPage() {
  return (
    <>
      <Header title="استبيان جديد" />
      <main className="p-6">
        <SurveyForm />
      </main>
    </>
  )
}
