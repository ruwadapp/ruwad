import { Header } from '@/components/shared/Header'
import { PresentationCodeJoin } from '@/components/student/PresentationCodeJoin'

export default function MyPresentationsPage() {
  return (
    <>
      <Header title="العروض التقديمية" />
      <main className="p-6">
        <PresentationCodeJoin />
      </main>
    </>
  )
}
