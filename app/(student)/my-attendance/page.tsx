import { Header } from '@/components/shared/Header'
import { AttendanceCheckIn } from '@/components/student/AttendanceCheckIn'

export default function StudentAttendancePage() {
  return (
    <>
      <Header title="تسجيل الحضور" />
      <main className="p-6">
        <AttendanceCheckIn />
      </main>
    </>
  )
}
