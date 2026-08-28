import { Header } from '@/components/shared/Header'
import { SurveyForm } from '@/components/trainer/SurveyForm'

export default function NewSurveyPage() {
  return (
    <>
      <Header title="استبيان جديد" />
      <main className="p-6">
        <div className="max-w-3xl mx-auto w-full">
          <SurveyForm />
        </div>
      </main>
    </>
  )
}
