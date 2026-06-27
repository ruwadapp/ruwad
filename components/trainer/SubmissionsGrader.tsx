'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AssignmentSubmission } from '@/lib/types'
import { FileText, Image as ImageIcon, File as FileIcon, Save, CheckCircle2, AlertTriangle, TrendingUp, Users } from 'lucide-react'
import { SanitizedHtml } from '@/components/shared/SanitizedHtml'

function iconFor(type: string) {
  if (type?.startsWith('image/')) return ImageIcon
  if (type === 'application/pdf') return FileText
  return FileIcon
}

export function SubmissionsGrader({
  submissions,
  totalMarks,
  dueDate,
}: {
  submissions: AssignmentSubmission[]
  totalMarks: number
  dueDate: string | null
}) {
  const graded = submissions.filter((s) => s.graded_at)
  const avgScore = graded.length
    ? Math.round((graded.reduce((sum, s) => sum + (s.score ?? 0), 0) / graded.length) * 10) / 10
    : null

  return (
    <div className="flex flex-col gap-4">
      {submissions.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-ruwad-blue/5 rounded-ruwad-sm p-4 text-center">
            <Users size={16} className="text-ruwad-blue mx-auto mb-1" />
            <p className="text-lg font-bold text-ruwad-navy">{submissions.length}</p>
            <p className="text-[11px] text-ruwad-navy/50">تسليم</p>
          </div>
          <div className="bg-ruwad-lime/15 rounded-ruwad-sm p-4 text-center">
            <CheckCircle2 size={16} className="text-ruwad-navy mx-auto mb-1" />
            <p className="text-lg font-bold text-ruwad-navy">{graded.length}</p>
            <p className="text-[11px] text-ruwad-navy/50">مُصحَّح</p>
          </div>
          <div className="bg-ruwad-navy/5 rounded-ruwad-sm p-4 text-center">
            <TrendingUp size={16} className="text-ruwad-navy mx-auto mb-1" />
            <p className="text-lg font-bold text-ruwad-navy">{avgScore !== null ? avgScore : '—'}</p>
            <p className="text-[11px] text-ruwad-navy/50">متوسط الدرجة</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {submissions.length === 0 ? (
          <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد تسليمات بعد.</p>
        ) : (
          submissions.map((sub) => <SubmissionRow key={sub.id} submission={sub} totalMarks={totalMarks} dueDate={dueDate} />)
        )}
      </div>
    </div>
  )
}

function SubmissionRow({ submission, totalMarks, dueDate }: { submission: AssignmentSubmission; totalMarks: number; dueDate: string | null }) {
  const [expanded, setExpanded] = useState(false)
  const [score, setScore] = useState(submission.score?.toString() ?? '')
  const [feedback, setFeedback] = useState(submission.feedback ?? '')
  const [saving, setSaving] = useState(false)
  const [graded, setGraded] = useState(submission.score !== null)
  const supabase = createClient()

  const isLate = dueDate && new Date(submission.submitted_at) > new Date(dueDate)

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
    <div className={`border rounded-ruwad-sm overflow-hidden ${graded ? 'border-ruwad-lime/50' : 'border-ruwad-gray/60'}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-right hover:bg-ruwad-gray/10 transition"
      >
        <div className="w-9 h-9 rounded-full bg-ruwad-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
          {submission.student?.full_name?.charAt(0) ?? '؟'}
        </div>
        <div className="flex-1 text-right">
          <p className="font-medium text-ruwad-navy">{submission.student?.full_name ?? 'طالب'}</p>
          <p className="text-xs text-ruwad-navy/50 flex items-center gap-1.5">
            {new Date(submission.submitted_at).toLocaleDateString('ar')}
            {isLate && <span className="flex items-center gap-1 text-amber-600 font-semibold"><AlertTriangle size={11} /> متأخر</span>}
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
            <div className="bg-ruwad-gray/10 rounded-ruwad-sm p-3">
              <p className="text-xs text-ruwad-navy/50 mb-1">نص الإجابة:</p>
              <SanitizedHtml html={submission.content} />
            </div>
          )}
          {submission.file_urls && submission.file_urls.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {submission.file_urls.map((f, i) => {
                const Icon = iconFor(f.type)
                return (
                  <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-ruwad-sm bg-ruwad-gray/10 text-sm text-ruwad-navy hover:underline">
                    <Icon size={15} className="text-ruwad-blue shrink-0" /> {f.name}
                  </a>
                )
              })}
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
