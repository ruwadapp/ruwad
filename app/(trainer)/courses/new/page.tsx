import { Header } from '@/components/shared/Header'
import { CourseForm } from '@/components/trainer/CourseForm'

export default function NewCoursePage() {
  return (
    <>
      <Header title="كورس جديد" />
      <main className="p-6">
        <CourseForm />
      </main>
    </>
  )
}
