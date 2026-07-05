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
        {/* table-fixed + عرض ثابت لكل عمود سؤال يجعل النص الطويل يلتف داخل الخلية (كخاصية "Wrap Text" في إكسل)
            بدل أن يفيض بصرياً فوق العمود المجاور */}
        <table className="text-sm table-fixed" style={{ width: `${280 + questions.length * 200}px` }}>
          <thead>
            <tr className="bg-ruwad-navy text-white text-right">
              <th className="py-3 px-4 font-semibold sticky right-0 bg-ruwad-navy z-10 align-top w-[160px]">
                <span className="flex items-center gap-1.5 whitespace-nowrap"><UserCircle2 size={14} /> المستجيب</span>
              </th>
              <th className="py-3 px-4 font-semibold align-top w-[120px] whitespace-nowrap">التاريخ</th>
              {questions.map((q, i) => (
                <th key={q.id} className="py-3 px-4 font-semibold align-top w-[200px] whitespace-normal break-words leading-relaxed">
                  {i + 1}. {q.question_text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responses.map((r, idx) => (
              <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-ruwad-gray/10'}>
                <td
                  className="py-3 px-4 font-medium text-ruwad-navy sticky right-0 z-10 align-top whitespace-normal break-words"
                  style={{ background: idx % 2 === 0 ? 'white' : '#F5F6FA' }}
                >
                  {isAnonymous || !r.respondent ? `مستجيب #${responses.length - idx}` : r.respondent.full_name}
                </td>
                <td className="py-3 px-4 text-ruwad-navy/60 align-top whitespace-nowrap">
                  {new Date(r.submitted_at).toLocaleDateString('ar')}
                </td>
                {questions.map((q) => (
                  <td key={q.id} className="py-3 px-4 text-ruwad-navy align-top whitespace-normal break-words leading-relaxed">
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
