import { StarRatingDisplay } from './StarRating'
import { MessageCircle } from 'lucide-react'

interface RatingRow {
  id: string
  score: number
  comment: string | null
  rater_role: string
  created_at: string
  rater_name: string
}

const RATER_LABELS: Record<string, string> = {
  student: 'طالب', trainer: 'مدرب', institute: 'معهد',
}

export function RatingsSummary({ ratings, roleFilterLabels }: { ratings: RatingRow[]; roleFilterLabels?: Record<string, string> }) {
  const count = ratings.length
  const avg = count ? ratings.reduce((s, r) => s + r.score, 0) / count : 0
  const labels = roleFilterLabels ?? RATER_LABELS

  const byRole: Record<string, RatingRow[]> = {}
  for (const r of ratings) {
    if (!byRole[r.rater_role]) byRole[r.rater_role] = []
    byRole[r.rater_role].push(r)
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-5">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-extrabold text-ruwad-navy">{avg.toFixed(1)}</span>
          <div className="flex flex-col">
            <StarRatingDisplay value={avg} />
            <span className="text-xs text-ruwad-navy/50">{count} تقييم</span>
          </div>
        </div>
        {Object.entries(byRole).map(([role, rows]) => (
          <span key={role} className="text-xs font-semibold bg-ruwad-blue/10 text-ruwad-blue px-3 py-1.5 rounded-full">
            {labels[role] ?? role}: {(rows.reduce((s, r) => s + r.score, 0) / rows.length).toFixed(1)} ({rows.length})
          </span>
        ))}
      </div>

      {count === 0 ? (
        <p className="text-sm text-ruwad-navy/50 py-2">لا توجد تقييمات بعد.</p>
      ) : (
        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
          {ratings.map((r) => (
            <div key={r.id} className="border border-ruwad-gray/50 rounded-ruwad-sm p-3.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ruwad-navy">{r.rater_name}</span>
                  <span className="text-[10px] font-semibold bg-ruwad-gray/30 text-ruwad-navy/60 px-2 py-0.5 rounded-full">{labels[r.rater_role] ?? r.rater_role}</span>
                </div>
                <StarRatingDisplay value={r.score} size={13} />
              </div>
              {r.comment && (
                <p className="text-sm text-ruwad-navy/70 flex items-start gap-1.5">
                  <MessageCircle size={13} className="mt-0.5 shrink-0 text-ruwad-navy/30" /> {r.comment}
                </p>
              )}
              <span className="text-[11px] text-ruwad-navy/35">{new Date(r.created_at).toLocaleDateString('ar')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
