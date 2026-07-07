'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileUploadZone, type UploadedFile } from '@/components/shared/FileUploadZone'
import { Send, CheckCircle2 } from 'lucide-react'

interface Props {
  challengeId: string
  challengeType: 'coding' | 'upload' | 'practical'
  totalMarks: number
  existing: { submission_text: string | null; submission_file_url: string | null; score: number | null; feedback: string | null; graded_at: string | null } | null
}

export function ChallengeSubmissionForm({ challengeId, challengeType, totalMarks, existing }: Props) {
  const [text, setText] = useState(existing?.submission_text ?? '')
  const [files, setFiles] = useState<UploadedFile[]>(existing?.submission_file_url ? [{ name: 'الملف المرفوع', url: existing.submission_file_url, type: '' }] : [])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(!!existing)
  const router = useRouter()
  const supabase = createClient()

  async function submit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload: Record<string, any> = {
      challenge_id: challengeId,
      student_id: user!.id,
      submitted_at: new Date().toISOString(),
    }
    if (challengeType === 'upload') payload.submission_file_url = files[0]?.url ?? null
    else payload.submission_text = text

    const { error } = await supabase.from('challenge_submissions').upsert(payload, { onConflict: 'challenge_id,student_id' })
    setLoading(false)
    if (!error) { setSubmitted(true); router.refresh() }
  }

  if (existing?.graded_at) {
    return (
      <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-ruwad-navy font-bold">
          <CheckCircle2 size={18} className="text-ruwad-lime" /> تم تصحيح تسليمك
        </div>
        <p className="text-2xl font-extrabold text-ruwad-navy">{existing.score} / {totalMarks}</p>
        {existing.feedback && <p className="text-sm text-ruwad-navy/70 bg-ruwad-gray/10 rounded-ruwad-sm p-3">{existing.feedback}</p>}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
      {submitted && (
        <div className="bg-ruwad-lime/20 text-ruwad-navy text-sm font-semibold rounded-ruwad-sm px-4 py-3">
          تم إرسال تسليمك، بانتظار تصحيح المدرب. يمكنك تعديله وإعادة الإرسال قبل التصحيح.
        </div>
      )}

      {challengeType === 'upload' ? (
        <FileUploadZone bucket="submissions" pathPrefix={challengeId} files={files} onChange={setFiles} maxFiles={1} />
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={challengeType === 'coding' ? 12 : 6}
          placeholder={challengeType === 'coding' ? 'اكتب كودك هنا...' : 'اكتب وصفاً لما أنجزته...'}
          className={`border border-ruwad-gray rounded-ruwad-sm px-4 py-3 outline-none focus:border-ruwad-blue transition resize-none ${challengeType === 'coding' ? 'font-mono text-sm' : ''}`}
        />
      )}

      <button
        onClick={submit}
        disabled={loading || (challengeType === 'upload' ? files.length === 0 : !text.trim())}
        className="self-end flex items-center gap-2 bg-ruwad-blue text-white px-6 py-2.5 rounded-ruwad-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
      >
        <Send size={16} /> {loading ? 'جارٍ الإرسال...' : submitted ? 'إعادة الإرسال' : 'إرسال التسليم'}
      </button>
    </div>
  )
}
