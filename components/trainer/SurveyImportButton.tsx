'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload } from 'lucide-react'

interface ImportedQuestion {
  question_text: string
  question_type: string
  options?: string[]
  is_required?: boolean
  text_format?: string | null
  section_title?: string | null
  condition_question_index?: number | null
  condition_value?: string | null
}

interface SurveyImportFile {
  ruwad_survey_export?: number
  title?: string
  description?: string | null
  is_anonymous?: boolean
  sections?: { title: string }[]
  questions?: ImportedQuestion[]
}

export function SurveyImportButton({ instituteId, redirectBase = '/surveys' }: { instituteId?: string; redirectBase?: string } = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleFile(file: File) {
    setError(null)
    setLoading(true)
    try {
      const content = await file.text()
      let data: SurveyImportFile
      try {
        data = JSON.parse(content)
      } catch {
        throw new Error('الملف ليس بصيغة JSON صالحة')
      }

      if (!data.ruwad_survey_export || !Array.isArray(data.questions)) {
        throw new Error('هذا الملف ليس تصدير استبيان من رُوّاد، أو أنه تالف')
      }
      if (!data.title?.trim()) throw new Error('الملف لا يحتوي على عنوان للاستبيان')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('يجب تسجيل الدخول')

      // 1) إنشاء الاستبيان
      const { data: newSurvey, error: surveyErr } = await supabase
        .from('surveys')
        .insert(
          instituteId
            ? {
                institute_id: instituteId,
                title: data.title.trim(),
                description: data.description ?? null,
                is_anonymous: data.is_anonymous ?? false,
              }
            : {
                trainer_id: user.id,
                title: data.title.trim(),
                description: data.description ?? null,
                is_anonymous: data.is_anonymous ?? false,
              }
        )
        .select()
        .single()
      if (surveyErr || !newSurvey) throw new Error('تعذّر إنشاء الاستبيان')

      // 2) إنشاء الأقسام وربط العناوين بالمعرّفات الجديدة
      const sectionTitleToId = new Map<string, string>()
      if (data.sections && data.sections.length > 0) {
        const { data: insertedSections, error: sectionsErr } = await supabase
          .from('survey_sections')
          .insert(data.sections.map((s, i) => ({ survey_id: newSurvey.id, title: s.title, order_index: i })))
          .select()
        if (sectionsErr) throw new Error('تعذّر إنشاء أقسام الاستبيان')
        for (const s of insertedSections ?? []) sectionTitleToId.set(s.title, s.id)
      }

      // 3) إنشاء الأسئلة (بدون الشرط أولاً) بنفس ترتيب الملف، لضمان مطابقة الفهارس (index) للسؤال الشرطي لاحقاً
      const questionsPayload = data.questions.map((q, i) => ({
        survey_id: newSurvey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options ?? [],
        is_required: q.is_required ?? true,
        text_format: q.text_format ?? 'text',
        section_id: q.section_title ? sectionTitleToId.get(q.section_title) ?? null : null,
        order_index: i,
      }))

      const { data: insertedQuestions, error: questionsErr } = await supabase
        .from('survey_questions')
        .insert(questionsPayload)
        .select()
        .order('order_index', { ascending: true })
      if (questionsErr || !insertedQuestions) throw new Error('تعذّر إنشاء أسئلة الاستبيان')

      // 4) الآن نربط الأسئلة الشرطية بأرقام الأسئلة الفعلية الجديدة
      const conditionUpdates = data.questions
        .map((q, i) => ({ index: i, condition_question_index: q.condition_question_index, condition_value: q.condition_value }))
        .filter((u) => u.condition_question_index !== null && u.condition_question_index !== undefined)

      for (const u of conditionUpdates) {
        const targetQuestion = insertedQuestions[u.index]
        const conditionQuestion = insertedQuestions[u.condition_question_index!]
        if (targetQuestion && conditionQuestion) {
          await supabase
            .from('survey_questions')
            .update({ condition_question_id: conditionQuestion.id, condition_value: u.condition_value ?? null })
            .eq('id', targetQuestion.id)
        }
      }

      router.push(`${redirectBase}/${newSurvey.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع أثناء الاستيراد')
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 bg-white border-2 border-ruwad-blue text-ruwad-blue px-5 py-2.5 rounded-ruwad-sm font-semibold hover:bg-ruwad-blue hover:text-white transition disabled:opacity-50"
      >
        <Upload size={17} /> {loading ? 'جارٍ الاستيراد...' : 'استيراد استبيان'}
      </button>
      {error && <p className="text-xs text-red-500 max-w-xs text-right">{error}</p>}
    </div>
  )
}
