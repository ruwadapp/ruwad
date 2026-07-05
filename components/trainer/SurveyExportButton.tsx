'use client'
import { Download } from 'lucide-react'
import type { Survey, SurveyQuestion, SurveySection } from '@/lib/types'

// صيغة تصدير الاستبيان: تُشير للقسم بعنوانه وللسؤال الشرطي بترتيبه (index) بدل الاعتماد على IDs
// التي لن تكون موجودة أو صحيحة عند الاستيراد لدى مدرب آخر
interface ExportedQuestion {
  question_text: string
  question_type: string
  options: string[]
  is_required: boolean
  text_format: string | null
  section_title: string | null
  condition_question_index: number | null
  condition_value: string | null
}

interface SurveyExportFile {
  ruwad_survey_export: 1
  title: string
  description: string | null
  is_anonymous: boolean
  sections: { title: string }[]
  questions: ExportedQuestion[]
}

export function SurveyExportButton({
  survey,
  questions,
  sections,
}: {
  survey: Survey
  questions: SurveyQuestion[]
  sections: SurveySection[]
}) {
  function handleExport() {
    const sectionIdToTitle = new Map(sections.map((s) => [s.id, s.title]))
    const questionIdToIndex = new Map(questions.map((q, i) => [q.id, i]))

    const payload: SurveyExportFile = {
      ruwad_survey_export: 1,
      title: survey.title,
      description: survey.description,
      is_anonymous: survey.is_anonymous,
      sections: sections.map((s) => ({ title: s.title })),
      questions: questions.map((q) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        is_required: q.is_required,
        text_format: q.text_format,
        section_title: q.section_id ? sectionIdToTitle.get(q.section_id) ?? null : null,
        condition_question_index: q.condition_question_id ? questionIdToIndex.get(q.condition_question_id) ?? null : null,
        condition_value: q.condition_value,
      })),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `استبيان-${survey.title.replace(/[^\w\u0600-\u06FF ]/g, '').trim() || 'ruwad'}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-white border-2 border-ruwad-navy text-ruwad-navy px-5 py-2.5 rounded-ruwad-sm font-semibold hover:bg-ruwad-navy hover:text-white transition"
    >
      <Download size={17} /> تصدير الاستبيان
    </button>
  )
}
