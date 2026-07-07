'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Code2, FileUp, ClipboardCheck, Save, CheckCircle2, ExternalLink } from 'lucide-react'

interface ChallengeSubmission {
  id: string
  student_id: string
  submission_text: string | null
  submission_file_url: string | null
  score: number | null
  feedback: string | null
  graded_at: string | null
  submitted_at: string
  student?: { full_name: string } | null
}

const TYPE_ICON = { coding: Code2, upload: FileUp, practical: ClipboardCheck } as const

export function ChallengeSubmissionsGrader({
  submissions,
  challengeType,
  totalMarks,
}: {
  submissions: ChallengeSubmission[]
  challengeType: 'coding' | 'upload' | 'practical'
  totalMarks: number
}) {
  const Icon = TYPE_ICON[challengeType]

  if (submissions.length === 0) {
    return <p className="text-ruwad-navy/50 text-sm py-6 text-center">لا توجد تسليمات بعد.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {submissions.map((s) => (
        <Row key={s.id} submission={s} Icon={Icon} challengeType={challengeType} totalMarks={totalMarks} />
      ))}
    </div>
  )
}

function Row({
  submission,
  Icon,
  challengeType,
  totalMarks,
}: {
  submission: ChallengeSubmission
  Icon: typeof Code2
  challengeType: 'coding' | 'upload' | 'practical'
  totalMarks: number
}) {
  const [score, setScore] = useState(submission.score?.toString() ?? '')
  const [feedback, setFeedback] = useState(submission.feedback ?? '')
  const [saving, setSaving] = useState(false)
  const [graded, setGraded] = useState(!!submission.graded_at)
  const supabase = createClient()

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('challenge_submissions')
      .update({
        score: Math.min(totalMarks, Math.max(0, Number(score) || 0)),
        percentage: totalMarks ? (Math.min(totalMarks, Math.max(0, Number(score) || 0)) / totalMarks) * 100 : 0,
        feedback: feedback.trim() || null,
        graded_at: new Date().toISOString(),
      })
      .eq('id', submission.id)
    setSaving(false)
    if (!error) setGraded(true)
  }

  return (
    <div className="border border-ruwad-gray/60 rounded-ruwad-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="font-semibold text-ruwad-navy">{submission.student?.full_name ?? 'طالب'}</p>
        {graded ? (
          <span className="flex items-center gap-1 text-xs font-semibold bg-ruwad-lime/30 text-ruwad-navy px-2.5 py-1 rounded-full">
            <CheckCircle2 size={12} /> مُصحَّح
          </span>
        ) : (
          <span className="text-xs font-semibold bg-ruwad-gray/30 text-ruwad-navy/60 px-2.5 py-1 rounded-full">بانتظار التصحيح</span>
        )}
      </div>

      <div className="bg-ruwad-gray/10 rounded-ruwad-sm p-3 flex items-start gap-2">
        <Icon size={16} className="text-ruwad-navy/40 mt-0.5 shrink-0" />
        {challengeType === 'upload' ? (
          submission.submission_file_url ? (
            <a href={submission.submission_file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-ruwad-blue font-semibold flex items-center gap-1 hover:underline">
              فتح الملف المرفوع <ExternalLink size={13} />
            </a>
          ) : (
            <p className="text-sm text-ruwad-navy/40">لم يرفع الطالب ملفاً بعد.</p>
          )
        ) : (
          <pre className="text-sm text-ruwad-navy whitespace-pre-wrap break-words font-mono flex-1">{submission.submission_text || 'لا يوجد محتوى.'}</pre>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="number"
          min={0}
          max={totalMarks}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="الدرجة"
          className="w-24 border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue transition"
        />
        <span className="text-xs text-ruwad-navy/40">من {totalMarks}</span>
        <input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="ملاحظات (اختياري)"
          className="flex-1 min-w-[140px] border border-ruwad-gray rounded-ruwad-sm px-3 py-2 text-sm outline-none focus:border-ruwad-blue transition"
        />
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 bg-ruwad-blue text-white text-sm font-semibold px-4 py-2 rounded-ruwad-sm hover:opacity-90 transition disabled:opacity-50">
          <Save size={14} /> {saving ? 'جارٍ الحفظ...' : 'حفظ'}
        </button>
      </div>
    </div>
  )
}
