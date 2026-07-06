import { EnrollButton } from '@/components/student/EnrollButton'
import { BookOpen, Clock, CheckCircle2 } from 'lucide-react'

interface CourseWithStatus {
  id: string
  title: string
  description: string | null
  myStatus: 'pending' | 'approved' | 'rejected' | null
}

export function CourseDiscoveryList({ courses, emptyText }: { courses: CourseWithStatus[]; emptyText: string }) {
  return (
    <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
      <h2 className="text-lg font-bold text-ruwad-navy flex items-center gap-2">
        <BookOpen size={20} className="text-ruwad-blue" /> الكورسات المتاحة ({courses.length})
      </h2>

      {courses.length === 0 ? (
        <p className="text-sm text-ruwad-navy/50 py-4 text-center">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {courses.map((c) => (
            <div key={c.id} className="border border-ruwad-gray/60 rounded-ruwad-sm p-4 flex flex-col gap-2.5">
              <div>
                <p className="font-bold text-ruwad-navy">{c.title}</p>
                {c.description && <p className="text-xs text-ruwad-navy/50 line-clamp-2 mt-1">{c.description}</p>}
              </div>
              {c.myStatus === 'approved' ? (
                <span className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ruwad-navy bg-ruwad-lime/30 rounded-ruwad-sm py-2 w-full">
                  <CheckCircle2 size={15} /> أنت ملتحق بهذا الكورس
                </span>
              ) : c.myStatus === 'pending' ? (
                <span className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ruwad-navy/60 bg-ruwad-gray/30 rounded-ruwad-sm py-2 w-full">
                  <Clock size={15} /> طلبك قيد المراجعة
                </span>
              ) : (
                <EnrollButton courseId={c.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
