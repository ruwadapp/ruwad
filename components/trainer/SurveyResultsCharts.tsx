'use client'
import { useMemo } from 'react'
import { Star, ListChecks, CheckSquare, ToggleLeft, MessageSquare, Hash, Calendar, Layers } from 'lucide-react'
import type { SurveyQuestion, SurveySection } from '@/lib/types'

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

const TYPE_ICON: Record<string, typeof Star> = {
  rating: Star,
  scale: Hash,
  multiple_choice: ListChecks,
  checkbox: CheckSquare,
  yes_no: ToggleLeft,
  text: MessageSquare,
}

export function SurveyResultsCharts({
  stats,
  totalResponses,
  questions,
  sections,
}: {
  stats: QuestionStat[]
  totalResponses: number
  questions: SurveyQuestion[]
  sections: SurveySection[]
}) {
  const questionMap = new Map(questions.map((q) => [q.id, q]))

  const groups = useMemo(() => {
    const bySection = new Map<string, QuestionStat[]>()
    const noSection: QuestionStat[] = []
    for (const s of stats) {
      const q = questionMap.get(s.id)
      if (q?.section_id) {
        if (!bySection.has(q.section_id)) bySection.set(q.section_id, [])
        bySection.get(q.section_id)!.push(s)
      } else {
        noSection.push(s)
      }
    }
    const ordered: { title: string | null; stats: QuestionStat[] }[] = []
    for (const sec of sections) {
      const arr = bySection.get(sec.id)
      if (arr && arr.length > 0) ordered.push({ title: sec.title, stats: arr })
    }
    if (noSection.length > 0) ordered.push({ title: null, stats: noSection })
    return ordered
  }, [stats, sections, questionMap])

  let globalIdx = 0

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-5">
          {group.title && (
            <div className="flex items-center gap-2 px-1">
              <Layers size={16} className="text-ruwad-blue" />
              <h2 className="font-bold text-ruwad-navy">{group.title}</h2>
            </div>
          )}

          {group.stats.map((q) => {
            globalIdx += 1
            const Icon = TYPE_ICON[q.type] ?? MessageSquare
            const responseRate = totalResponses > 0 ? Math.round((q.answeredCount / totalResponses) * 100) : 0
            const maxCount = q.distribution?.length ? Math.max(...q.distribution.map((d) => d.count), 1) : 1

            return (
              <div key={q.id} className="bg-white rounded-ruwad shadow-card overflow-hidden">
                {/* هيدر السؤال */}
                <div className="bg-ruwad-navy px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-white min-w-0">
                    <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold shrink-0">
                      {globalIdx}
                    </span>
                    <Icon size={15} className="shrink-0 text-ruwad-lime" />
                    <p className="font-medium truncate">{q.text}</p>
                  </div>
                  <span className="text-xs font-semibold bg-white/15 text-white px-2.5 py-1 rounded-full shrink-0">
                    {q.answeredCount} / {totalResponses} أجابوا ({responseRate}%)
                  </span>
                </div>

                <div className="p-5">
                  {/* تقييم / مقياس: متوسط بارز + توزيع */}
                  {(q.type === 'rating' || q.type === 'scale') && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-ruwad-gradient text-white rounded-ruwad px-5 py-3 text-center shrink-0">
                          <p className="text-2xl font-bold">{(q.average ?? 0).toFixed(1)}</p>
                          <p className="text-[11px] opacity-80">المتوسط</p>
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                          {q.distribution?.slice().reverse().map((d) => {
                            const pct = q.answeredCount > 0 ? Math.round((d.count / q.answeredCount) * 100) : 0
                            return (
                              <div key={d.label} className="flex items-center gap-2 text-xs">
                                <span className="w-4 text-ruwad-navy/60 font-semibold shrink-0">{d.label}</span>
                                <div className="flex-1 bg-ruwad-gray/30 rounded-full h-2.5 overflow-hidden">
                                  <div className="bg-ruwad-blue h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-14 text-ruwad-navy/60 shrink-0">{d.count} ({pct}%)</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* اختيار واحد / متعدد / نعم-لا: أشرطة نسبية بألوان الهوية */}
                  {(q.type === 'multiple_choice' || q.type === 'checkbox' || q.type === 'yes_no') && q.distribution && (
                    <div className="flex flex-col gap-2.5">
                      {q.distribution.map((d, i) => {
                        const pct = q.answeredCount > 0 ? Math.round((d.count / q.answeredCount) * 100) : 0
                        const isTop = d.count === maxCount && d.count > 0
                        return (
                          <div key={d.label} className="flex items-center gap-3">
                            <span className={`text-sm flex-[0_0_120px] truncate ${isTop ? 'font-bold text-ruwad-navy' : 'text-ruwad-navy/70'}`}>{d.label}</span>
                            <div className="flex-1 bg-ruwad-gray/30 rounded-full h-6 overflow-hidden relative">
                              <div
                                className={`h-6 rounded-full transition-all flex items-center px-2.5 ${isTop ? 'bg-ruwad-lime' : 'bg-ruwad-blue'}`}
                                style={{ width: `${Math.max(pct, d.count > 0 ? 8 : 0)}%` }}
                              >
                                {pct > 12 && (
                                  <span className={`text-[11px] font-bold whitespace-nowrap ${isTop ? 'text-ruwad-navy' : 'text-white'}`}>{pct}%</span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-ruwad-navy/50 w-16 text-left shrink-0">{d.count} رد{pct <= 12 && ` (${pct}%)`}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* نص حر / تاريخ */}
                  {q.type === 'text' && (!q.textFormat || q.textFormat === 'text' || q.textFormat === 'date') && (
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                      {!q.textAnswers || q.textAnswers.length === 0 ? (
                        <p className="text-ruwad-navy/50 text-sm">لا توجد ردود بعد.</p>
                      ) : (
                        q.textAnswers.map((a, i) => (
                          <p key={i} className="text-sm text-ruwad-navy bg-ruwad-gray/20 rounded-ruwad-sm px-3 py-2 flex items-center gap-2">
                            {q.textFormat === 'date' && <Calendar size={13} className="text-ruwad-blue shrink-0" />}
                            {q.textFormat === 'date' ? new Date(a).toLocaleDateString('ar') : a}
                          </p>
                        ))
                      )}
                    </div>
                  )}

                  {/* نص من نوع رقم: متوسط + أدنى + أعلى */}
                  {q.type === 'text' && q.textFormat === 'number' && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-ruwad-blue/10 rounded-ruwad-sm p-3 text-center">
                        <p className="text-lg font-bold text-ruwad-blue">{(q.average ?? 0).toFixed(1)}</p>
                        <p className="text-[11px] text-ruwad-navy/50">المتوسط</p>
                      </div>
                      <div className="bg-ruwad-gray/20 rounded-ruwad-sm p-3 text-center">
                        <p className="text-lg font-bold text-ruwad-navy">{q.min ?? 0}</p>
                        <p className="text-[11px] text-ruwad-navy/50">الأدنى</p>
                      </div>
                      <div className="bg-ruwad-gray/20 rounded-ruwad-sm p-3 text-center">
                        <p className="text-lg font-bold text-ruwad-navy">{q.max ?? 0}</p>
                        <p className="text-[11px] text-ruwad-navy/50">الأعلى</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
