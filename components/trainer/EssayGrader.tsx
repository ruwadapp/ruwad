'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2 } from 'lucide-react'

interface EssayQuestion {
  id: string
  question_text: string
  marks: number
}

interface SubmissionRow {
  id: string
  student_id: string
  student_name: string
  answers: Record<string, string | string[]>
  essay_scores: Record<string, number>
  graded_at: string | null
  total_marks: number
  passing_marks: number
}

export function EssayGrader({
  essayQuestions,
  autoGradedScore,
  initial,
}: {
  essayQuestions: EssayQuestion[]
  autoGradedScore: Record<string, number>
  initial: SubmissionRow[]
}) {
  const [submissions, setSubmissions] = useState(initial)
  const [scores, setScores] = useState<Record<string, Record<string, string>>>(
    Object.fromEntries(
      initial.map((s) => [
        s.id,
        Object.fromEntries(essayQuestions.map((q) => [q.id, (s.essay_scores[q.id] ?? '').toString()])),
      ])
    )
  )
  const [saving, setSaving] = useState<string | null>(null)
  const supabase = createClient()

  function setScore(submissionId: string, questionId: string, value: string) {
    setScores((prev) => ({ ...prev, [submissionId]: { ...prev[submissionId], [questionId]: value } }))
  }

  async function saveGrading(submission: SubmissionRow) {
    setSaving(submission.id)
    const essayScoresEntries = essayQuestions.map((q) => {
      const raw = Number(scores[submission.id]?.[q.id] ?? 0) || 0
      return [q.id, Math.min(q.marks, Math.max(0, raw))] as [string, number]
    })
    const essayScores = Object.fromEntries(essayScoresEntries)
    const essayTotal = essayScoresEntries.reduce((sum, [, v]) => sum + v, 0)
    const autoScore = autoGradedScore[submission.id] ?? 0
    const finalScore = autoScore + essayTotal
    const percentage = submission.total_marks > 0 ? Math.round((finalScore / submission.total_marks) * 100) : 0
    const passed = percentage >= submission.passing_marks

    const { error } = await supabase
      .from('exam_submissions')
      .update({ essay_scores: essayScores, score: finalScore, percentage, passed, graded_at: new Date().toISOString() })
      .eq('id', submission.id)

    if (!error) {
      setSubmissions((prev) => prev.map((s) => (s.id === submission.id ? { ...s, essay_scores: essayScores, graded_at: new Date().toISOString() } : s)))
    }
    setSaving(null)
  }

  const pending = submissions.filter((s) => !s.graded_at)
  const graded = submissions.filter((s) => s.graded_at)

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-lg font-bold text-ruwad-navy mb-4">بانتظار التصحيح ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-ruwad-navy/50 text-sm py-6 text-center bg-white rounded-ruwad shadow-card">لا توجد إجابات بانتظار التصحيح. 🎉</p>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((s) => (
              <div key={s.id} className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
                <p className="font-bold text-ruwad-navy">{s.student_name}</p>
                {essayQuestions.map((q) => (
                  <div key={q.id} className="border-t border-ruwad-gray/40 pt-3 flex flex-col gap-2">
                    <p className="text-sm font-medium text-ruwad-navy">{q.question_text}</p>
                    <p className="bg-ruwad-gray/10 rounded-ruwad-sm px-4 py-3 text-sm text-ruwad-navy/80 whitespace-pre-wrap">
                      {(s.answers[q.id] as string) || '(لم يُجب)'}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={0} max={q.marks}
                        value={scores[s.id]?.[q.id] ?? ''}
                        onChange={(e) => setScore(s.id, q.id, e.target.value)}
                        className="w-24 border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue"
                      />
                      <span className="text-sm text-ruwad-navy/50">من {q.marks} درجة</span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => saveGrading(s)}
                  disabled={saving === s.id}
                  className="bg-ruwad-blue text-white px-5 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition disabled:opacity-50 w-fit mt-1"
                >
                  {saving === s.id ? 'جارٍ الحفظ...' : 'حفظ التصحيح وإنهاء'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {graded.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-ruwad-navy mb-4">مُصحَّحة ({graded.length})</h2>
          <div className="flex flex-col gap-2">
            {graded.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-ruwad-sm border border-ruwad-gray/60 bg-white">
                <CheckCircle2 size={18} className="text-ruwad-lime shrink-0" />
                <span className="flex-1 text-sm font-medium text-ruwad-navy">{s.student_name}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
