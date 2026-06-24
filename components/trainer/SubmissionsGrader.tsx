'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AssignmentSubmission } from '@/lib/types'
import { FileText, Save, CheckCircle2 } from 'lucide-react'

export function SubmissionsGrader({
  submissions,
  totalMarks,
}: {
  submissions: AssignmentSubmission[]
  totalMarks: number
}) {
  return (
    <div className="flex flex-col gap-3">
      {submissions.length === 0 ? (
        <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد تسليمات بعد.</p>
      ) : (
        submissions.map((sub) => <SubmissionRow key={sub.id} submission={sub} totalMarks={totalMarks} />)
      )}
    </div>
  )
}

function SubmissionRow({ submission, totalMarks }: { submission: AssignmentSubmission; totalMarks: number }) {
  const [expanded, setExpanded] = useState(false)
  const [score, setScore] = useState(submission.score?.toString() ?? '')
  const [feedback, setFeedback] = useState(submission.feedback ?? '')
  const [saving, setSaving] = useState(false)
  const [graded, setGraded] = useState(submission.score !== null)
  const supabase = createClient()

  async function saveGrade() {
    setSaving(true)
    const { error } = await supabase
      .from('assignment_submissions')
      .update({ score: Number(score) || 0, feedback: feedback || null, graded_at: new Date().toISOString() })
      .eq('id', submission.id)
    if (!error) setGraded(true)
    setSaving(false)
  }

  return (
    <div className="border border-ruwad-gray/60 rounded-ruwad-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-right hover:bg-ruwad-gray/10 transition"
      >
        <div className="w-9 h-9 rounded-full bg-ruwad-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
          {submission.student?.full_name?.charAt(0) ?? '؟'}
        </div>
        <div className="flex-1 text-right">
          <p className="font-medium text-ruwad-navy">{submission.student?.full_name ?? 'طالب'}</p>
          <p className="text-xs text-ruwad-navy/50">
            {new Date(submission.submitted_at).toLocaleDateString('ar')}
          </p>
        </div>
        {graded ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-ruwad-lime text-ruwad-navy px-3 py-1.5 rounded-full">
            <CheckCircle2 size={14} /> {submission.score}/{totalMarks}
          </span>
        ) : (
          <span className="text-xs font-semibold bg-ruwad-gray/40 text-ruwad-navy/60 px-3 py-1.5 rounded-full">
            غير مُصحَّح
          </span>
        )}
      </button>

      {expanded && (
        <div className="p-4 border-t border-ruwad-gray/40 flex flex-col gap-4">
          {submission.content && (
            <div className="bg-ruwad-gray/20 rounded-ruwad-sm p-3">
              <p className="text-xs text-ruwad-navy/50 mb-1">نص الإجابة:</p>
              <p className="text-sm text-ruwad-navy whitespace-pre-wrap">{submission.content}</p>
            </div>
          )}
          {submission.file_urls && submission.file_urls.length > 0 && (
            <div className="flex flex-col gap-1">
              {submission.file_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-ruwad-blue flex items-center gap-1.5">
                  <FileText size={14} /> ملف مرفق {i + 1}
                </a>
              ))}
            </div>
          )}

          <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
            <input
              type="number"
              min={0}
              max={totalMarks}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder={`من ${totalMarks}`}
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue text-sm"
            />
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              placeholder="ملاحظات للطالب (اختياري)"
              className="border border-ruwad-gray rounded-ruwad-sm px-3 py-2 outline-none focus:border-ruwad-blue text-sm resize-none"
            />
          </div>

          <button
            onClick={saveGrade}
            disabled={saving}
            className="bg-ruwad-blue text-white px-5 py-2 rounded-ruwad-sm text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 w-fit"
          >
            <Save size={15} /> {saving ? 'جارٍ الحفظ...' : 'حفظ الدرجة'}
          </button>
        </div>
      )}
    </div>
  )
}
