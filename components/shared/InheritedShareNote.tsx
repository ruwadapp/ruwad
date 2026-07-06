import Link from 'next/link'
import { Building2 } from 'lucide-react'

/** يظهر بدل زر المشاركة المستقل عندما يكون العنصر مرتبطاً بكورس — لتفادي أي تعارض بين مشاركتين منفصلتين لنفس المحتوى. */
export function InheritedShareNote({ courseId }: { courseId: string }) {
  return (
    <Link
      href={`/courses/${courseId}`}
      className="flex items-center gap-2 text-sm font-semibold text-ruwad-navy/60 bg-ruwad-gray/20 hover:bg-ruwad-gray/30 transition px-4 py-2.5 rounded-ruwad-sm"
    >
      <Building2 size={16} /> مرتبط بكورس — تتبع مشاركته مع المعاهد تلقائياً
    </Link>
  )
}
