'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface QuestionStat {
  id: string
  text: string
  type: string
  average?: number
  distribution?: { label: string; count: number }[]
  textAnswers?: string[]
}

export function SurveyResultsCharts({ stats, totalResponses }: { stats: QuestionStat[]; totalResponses: number }) {
  return (
    <div className="flex flex-col gap-6">
      {stats.map((q, idx) => (
        <div key={q.id} className="bg-white rounded-ruwad shadow-card p-6">
          <p className="font-medium text-ruwad-navy mb-1">
            سؤال {idx + 1}: {q.text}
          </p>
          {q.average !== undefined && (
            <p className="text-sm text-ruwad-navy/60 mb-4">
              المتوسط: <span className="font-bold text-ruwad-blue">{q.average.toFixed(1)}</span> من {totalResponses} رد
            </p>
          )}

          {q.distribution && q.distribution.length > 0 && (
            <div className="h-56" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={q.distribution} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="label" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3A4EFB" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {q.textAnswers && (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {q.textAnswers.length === 0 ? (
                <p className="text-ruwad-navy/50 text-sm">لا توجد ردود نصية بعد.</p>
              ) : (
                q.textAnswers.map((a, i) => (
                  <p key={i} className="text-sm text-ruwad-navy bg-ruwad-gray/20 rounded-ruwad-sm px-3 py-2">
                    {a}
                  </p>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
