import Link from 'next/link'
import { FileText, FileCheck, Trophy, Plus } from 'lucide-react'

interface LinkedItem { id: string; title: string; count: number; countLabel: string }

/**
 * يعرض كل الامتحانات/الواجبات/التحديات المرتبطة بهذا الكورس تحديداً (course_id).
 * هذه العناصر تُشارك تلقائياً مع أي معهد شُورك معه الكورس نفسه (بلا حاجة لمشاركة كل عنصر
 * على حدة)، لذا هي قابلة للتعديل من نفس الجهات التي تستطيع تعديل الكورس بالضبط.
 */
export function RelatedCourseItems({
  courseId,
  exams,
  assignments,
  challenges,
}: {
  courseId: string
  exams: LinkedItem[]
  assignments: LinkedItem[]
  challenges: LinkedItem[]
}) {
  const hasAny = exams.length > 0 || assignments.length > 0 || challenges.length > 0

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ruwad-navy">محتوى هذا الكورس المرتبط</h2>
      </div>
      <p className="text-xs text-ruwad-navy/50 -mt-3">
        كل امتحان أو واجب أو تحدٍ مرتبط بهذا الكورس يُشارك تلقائياً مع أي معهد فعّلت مشاركة الكورس معه.
      </p>

      {!hasAny ? (
        <p className="text-sm text-ruwad-navy/50 py-2">لا يوجد امتحانات أو واجبات أو تحديات مرتبطة بهذا الكورس بعد.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {exams.length > 0 && (
            <Section title="الامتحانات" icon={FileText} items={exams} hrefBase="/exams" />
          )}
          {assignments.length > 0 && (
            <Section title="الواجبات" icon={FileCheck} items={assignments} hrefBase="/assignments" />
          )}
          {challenges.length > 0 && (
            <Section title="التحديات" icon={Trophy} items={challenges} hrefBase="/challenges" />
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-ruwad-gray/40">
        <Link href="/exams/new" className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-blue hover:bg-ruwad-blue/10 px-3 py-2 rounded-ruwad-sm transition">
          <Plus size={13} /> امتحان جديد لهذا الكورس
        </Link>
        <Link href="/assignments/new" className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-blue hover:bg-ruwad-blue/10 px-3 py-2 rounded-ruwad-sm transition">
          <Plus size={13} /> واجب جديد
        </Link>
        <Link href="/challenges/new" className="flex items-center gap-1.5 text-xs font-semibold text-ruwad-blue hover:bg-ruwad-blue/10 px-3 py-2 rounded-ruwad-sm transition">
          <Plus size={13} /> تحدٍ جديد
        </Link>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, items, hrefBase }: { title: string; icon: typeof FileText; items: LinkedItem[]; hrefBase: string }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-ruwad-navy/60 mb-2 flex items-center gap-1.5">
        <Icon size={14} /> {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`${hrefBase}/${item.id}`}
            className="flex items-center justify-between gap-2 border border-ruwad-gray/60 rounded-ruwad-sm px-3 py-2.5 hover:border-ruwad-blue/40 hover:bg-ruwad-blue/5 transition"
          >
            <span className="text-sm font-medium text-ruwad-navy truncate">{item.title}</span>
            <span className="text-[11px] text-ruwad-navy/40 shrink-0">{item.count} {item.countLabel}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
