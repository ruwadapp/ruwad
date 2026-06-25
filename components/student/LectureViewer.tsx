'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2 } from 'lucide-react'
import type { Lecture } from '@/lib/types'
import { TextToSpeechButton } from './TextToSpeechButton'
import { AiSummaryButton } from './AiSummaryButton'

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export function LectureViewer({
  lecture,
  courseId,
  totalPublishedLectures,
  initiallyCompleted,
}: {
  lecture: Lecture
  courseId: string
  totalPublishedLectures: number
  initiallyCompleted: boolean
}) {
  const [completed, setCompleted] = useState(initiallyCompleted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function markComplete() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('lecture_progress').upsert(
      { student_id: user.id, lecture_id: lecture.id, completed: true, completed_at: new Date().toISOString() },
      { onConflict: 'student_id,lecture_id' }
    )

    // إعادة حساب نسبة التقدّم في الكورس
    const { count: completedCount } = await supabase
      .from('lecture_progress')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('completed', true)
      .in('lecture_id', (await supabase.from('lectures').select('id').eq('course_id', courseId)).data?.map((l) => l.id) ?? [])

    const progress = totalPublishedLectures > 0
      ? Math.round(((completedCount ?? 0) / totalPublishedLectures) * 100)
      : 0

    await supabase
      .from('enrollments')
      .update({ progress, completed_at: progress >= 100 ? new Date().toISOString() : null })
      .eq('student_id', user.id)
      .eq('course_id', courseId)

    setCompleted(true)
    setLoading(false)
    router.refresh()
  }

  const embedUrl = lecture.video_url ? getYouTubeEmbedUrl(lecture.video_url) : null

  return (
    <div className="flex flex-col gap-6">
      {embedUrl ? (
        <div className="bg-white rounded-ruwad shadow-card overflow-hidden aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            title={lecture.title}
          />
        </div>
      ) : lecture.video_url ? (
        <div className="bg-white rounded-ruwad shadow-card p-4">
          <a href={lecture.video_url} target="_blank" rel="noopener noreferrer" className="text-ruwad-blue font-medium">
            فتح رابط الفيديو ↗
          </a>
        </div>
      ) : null}

      {lecture.content && (
        <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-ruwad-navy">محتوى المحاضرة</h2>
            <TextToSpeechButton text={lecture.content} />
          </div>
          <p className="text-ruwad-navy/80 whitespace-pre-wrap leading-relaxed">{lecture.content}</p>
        </div>
      )}

      {lecture.content && (
        <AiSummaryButton lectureId={lecture.id} initialSummary={lecture.ai_summary} />
      )}

      <button
        onClick={markComplete}
        disabled={completed || loading}
        className={`px-6 py-3 rounded-ruwad-sm font-semibold transition shadow-ruwad flex items-center justify-center gap-2 w-fit ${
          completed ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-ruwad-blue text-white hover:opacity-90'
        } disabled:opacity-80`}
      >
        <CheckCircle2 size={18} />
        {completed ? 'تمت المحاضرة ✓' : loading ? 'جارٍ الحفظ...' : 'إتمام المحاضرة'}
      </button>
    </div>
  )
}
