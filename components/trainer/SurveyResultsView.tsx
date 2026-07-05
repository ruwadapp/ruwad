'use client'
import { useState } from 'react'
import { BarChart3, Table2 } from 'lucide-react'
import { SurveyResultsCharts } from './SurveyResultsCharts'
import { SurveyResponsesTable } from './SurveyResponsesTable'
import type { SurveyQuestion, SurveySection, SurveyResponse } from '@/lib/types'

interface QuestionStat {
  id: string
  text: string
  type: string
  average?: number
  min?: number
  max?: number
  distribution?: { label: string; count: number }[]
  textAnswers?: string[]
  textFormat?: string
  answeredCount: number
}

export function SurveyResultsView({
  stats,
  totalResponses,
  questions,
  sections,
  responses,
  isAnonymous,
}: {
  stats: QuestionStat[]
  totalResponses: number
  questions: SurveyQuestion[]
  sections: SurveySection[]
  responses: (SurveyResponse & { respondent?: { full_name: string } | null })[]
  isAnonymous: boolean
}) {
  const [tab, setTab] = useState<'stats' | 'table'>('stats')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 bg-white rounded-ruwad shadow-card p-1.5 w-fit">
        <button
          onClick={() => setTab('stats')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-ruwad-sm text-sm font-semibold transition ${
            tab === 'stats' ? 'bg-ruwad-blue text-white shadow-ruwad' : 'text-ruwad-navy/60 hover:bg-ruwad-gray/20'
          }`}
        >
          <BarChart3 size={15} /> الإحصائيات
        </button>
        <button
          onClick={() => setTab('table')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-ruwad-sm text-sm font-semibold transition ${
            tab === 'table' ? 'bg-ruwad-blue text-white shadow-ruwad' : 'text-ruwad-navy/60 hover:bg-ruwad-gray/20'
          }`}
        >
          <Table2 size={15} /> جدول الردود ({totalResponses})
        </button>
      </div>

      {tab === 'stats' ? (
        <SurveyResultsCharts stats={stats} totalResponses={totalResponses} questions={questions} sections={sections} />
      ) : (
        <SurveyResponsesTable questions={questions} responses={responses} isAnonymous={isAnonymous} />
      )}
    </div>
  )
}
