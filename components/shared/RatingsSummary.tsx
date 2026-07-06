import { StarRatingDisplay } from './StarRating'

/**
 * يعرض المعدل العام وعدد التقييمات فقط — لا قائمة تقييمات فردية، ولا أي إشارة لهوية
 * المُقيِّم، بحيث يبقى تقييم كل شخص خاصاً ولا يظهر إلا كرقم ضمن المعدل العام.
 */
export function RatingsSummary({
  avg,
  count,
  byRole,
  roleLabels,
}: {
  avg: number
  count: number
  byRole?: Record<string, { avg: number; count: number }>
  roleLabels?: Record<string, string>
}) {
  return (
    <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-extrabold text-ruwad-navy">{avg.toFixed(1)}</span>
          <div className="flex flex-col">
            <StarRatingDisplay value={avg} />
            <span className="text-xs text-ruwad-navy/50">{count} تقييم</span>
          </div>
        </div>
        {byRole && roleLabels && Object.entries(byRole).map(([role, data]) => (
          data.count > 0 && (
            <span key={role} className="text-xs font-semibold bg-ruwad-blue/10 text-ruwad-blue px-3 py-1.5 rounded-full">
              {roleLabels[role] ?? role}: {data.avg.toFixed(1)} ({data.count})
            </span>
          )
        ))}
      </div>
      {count === 0 && <p className="text-sm text-ruwad-navy/50">لا توجد تقييمات بعد.</p>}
    </div>
  )
}
