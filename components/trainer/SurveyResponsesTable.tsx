'use client'
import type { SurveyQuestion, SurveyResponse } from '@/lib/types'
import { UserCircle2 } from 'lucide-react'

function formatAnswer(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—'
  if (Array.isArray(value)) return value.join('، ')
  return String(value)
}

export function SurveyResponsesTable({
  questions,
  responses,
  isAnonymous,
}: {
  questions: SurveyQuestion[]
  responses: (SurveyResponse & { respondent?: { full_name: string } | null })[]
  isAnonymous: boolean
}) {
  return (
    <div className="bg-white rounded-ruwad shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="bg-ruwad-navy text-white text-right">
              <th className="py-3 px-4 font-semibold sticky right-0 bg-ruwad-navy z-10 whitespace-nowrap">
                <span className="flex items-center gap-1.5"><UserCircle2 size={14} /> المستجيب</span>
              </th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">التاريخ</th>
              {questions.map((q, i) => (
                <th key={q.id} className="py-3 px-4 font-semibold whitespace-nowrap max-w-[220px]">
                  {i + 1}. {q.question_text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responses.map((r, idx) => (
              <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-ruwad-gray/10'}>
                <td className="py-3 px-4 font-medium text-ruwad-navy sticky right-0 z-10 whitespace-nowrap" style={{ background: idx % 2 === 0 ? 'white' : '#F5F6FA' }}>
                  {isAnonymous || !r.respondent ? `مستجيب #${responses.length - idx}` : r.respondent.full_name}
                </td>
                <td className="py-3 px-4 text-ruwad-navy/60 whitespace-nowrap">
                  {new Date(r.submitted_at).toLocaleDateString('ar')}
                </td>
                {questions.map((q) => (
                  <td key={q.id} className="py-3 px-4 text-ruwad-navy max-w-[220px] truncate" title={formatAnswer(r.answers[q.id])}>
                    {formatAnswer(r.answers[q.id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
