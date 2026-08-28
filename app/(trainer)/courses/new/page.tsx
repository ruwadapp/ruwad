import { Header } from '@/components/shared/Header'
import { CourseForm } from '@/components/trainer/CourseForm'

export default function NewCoursePage() {
  return (
    <>
      <Header title="كورس جديد" />
      <main className="p-6">
        <div className="max-w-3xl mx-auto w-full">
          <CourseForm />
        </div>
      </main>
    </>
  )
}
