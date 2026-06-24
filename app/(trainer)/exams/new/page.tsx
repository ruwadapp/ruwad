import { Header } from '@/components/shared/Header'
import { ExamForm } from '@/components/trainer/ExamForm'

export default function NewExamPage() {
  return (
    <>
      <Header title="امتحان جديد" />
      <main className="p-6">
        <ExamForm />
      </main>
    </>
  )
}
