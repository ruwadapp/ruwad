'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle, ChevronRight, ChevronLeft, Video, FileText, PlayCircle } from 'lucide-react'
import type { Lecture } from '@/lib/types'

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export function LectureViewer({
  lecture,
  allLectures,
  completedIds,
  courseId,
  courseTitle,
  courseProgress,
  initiallyCompleted,
}: {
  lecture: Lecture
  allLectures: Lecture[]
  completedIds: string[]
  courseId: string
  courseTitle: string
  courseProgress: number
  initiallyCompleted: boolean
}) {
  const [completed, setCompleted] = useState(initiallyCompleted)
  const [loading, setLoading] = useState(false)
  const [sanitizedContent, setSanitizedContent] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!lecture.content) { setSanitizedContent(''); return }
    import('dompurify').then((mod) => {
      setSanitizedContent(mod.default.sanitize(lecture.content!))
    })
  }, [lecture.content])

  const currentIndex = allLectures.findIndex((l) => l.id === lecture.id)
  const prevLecture = currentIndex > 0 ? allLectures[currentIndex - 1] : null
  const nextLecture = currentIndex < allLectures.length - 1 ? allLectures[currentIndex + 1] : null

  async function markComplete() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('lecture_progress').upsert(
      { student_id: user.id, lecture_id: lecture.id, completed: true, completed_at: new Date().toISOString() },
      { onConflict: 'student_id,lecture_id' }
    )

    const newCompletedCount = new Set([...completedIds, lecture.id]).size
    const progress = allLectures.length > 0 ? Math.round((newCompletedCount / allLectures.length) * 100) : 0

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
  const completedSet = new Set(completedIds)

  return (
    <div className="flex flex-col">
      {/* ===== الهيدر البصري ===== */}
      <div className="relative overflow-hidden bg-ruwad-gradient px-6 py-8">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-14 -left-14 w-48 h-48 bg-ruwad-lime/20 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto">
          <p className="text-white/60 text-sm mb-1">{courseTitle}</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{lecture.title}</h1>
            {completed && (
              <span className="flex items-center gap-1.5 text-sm font-bold bg-ruwad-lime text-ruwad-navy px-3 py-1.5 rounded-full">
                <CheckCircle2 size={15} /> مكتملة
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
            <span>المحاضرة {currentIndex + 1} من {allLectures.length}</span>
            {lecture.duration_minutes && <span>· {lecture.duration_minutes} دقيقة</span>}
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5 mt-4 max-w-xs">
            <div className="bg-ruwad-lime h-1.5 rounded-full transition-all" style={{ width: `${courseProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 -mt-2">
        {/* ===== المحتوى الرئيسي ===== */}
        <div className="flex flex-col gap-5 min-w-0">
          {embedUrl ? (
            <div className="bg-white rounded-ruwad shadow-ruwad overflow-hidden aspect-video">
              <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={lecture.title} />
            </div>
          ) : lecture.video_url ? (
            <a href={lecture.video_url} target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-ruwad shadow-card p-6 flex items-center gap-3 text-ruwad-blue font-medium hover:shadow-ruwad transition">
              <PlayCircle size={24} /> فتح رابط الفيديو
            </a>
          ) : null}

          {lecture.stats && lecture.stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {lecture.stats.map((s, i) => (
                <div key={i} className={`rounded-ruwad p-4 text-center ${
                  i % 3 === 0 ? 'bg-ruwad-blue/10' : i % 3 === 1 ? 'bg-ruwad-lime/20' : 'bg-ruwad-navy/5'
                }`}>
                  <p className="text-xl font-bold text-ruwad-navy">{s.value}</p>
                  <p className="text-xs text-ruwad-navy/60 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {lecture.description && (
            <p className="text-ruwad-navy/60 text-sm bg-ruwad-blue/5 rounded-ruwad-sm px-4 py-3">{lecture.description}</p>
          )}

          {sanitizedContent && (
            <div className="bg-white rounded-ruwad shadow-card p-6">
              <div
                className="text-ruwad-navy leading-relaxed [&_h3]:font-bold [&_h3]:text-lg [&_h3]:text-ruwad-blue [&_h3]:mt-3 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5 [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-2">
            {prevLecture ? (
              <Link href={`/my-courses/${courseId}/lectures/${prevLecture.id}`}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-ruwad-sm font-semibold text-ruwad-navy border-2 border-ruwad-gray hover:bg-ruwad-gray/20 transition text-sm">
                <ChevronRight size={16} /> السابقة
              </Link>
            ) : <div />}

            {!completed ? (
              <button onClick={markComplete} disabled={loading}
                className="flex items-center gap-2 bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-bold hover:opacity-90 transition shadow-ruwad disabled:opacity-60">
                <CheckCircle2 size={18} /> {loading ? 'جارٍ الحفظ...' : 'إتمام المحاضرة'}
              </button>
            ) : nextLecture ? (
              <Link href={`/my-courses/${courseId}/lectures/${nextLecture.id}`}
                className="flex items-center gap-1.5 bg-ruwad-blue text-white px-6 py-3 rounded-ruwad-sm font-bold hover:opacity-90 transition shadow-ruwad">
                التالية <ChevronLeft size={18} />
              </Link>
            ) : (
              <Link href={`/my-courses/${courseId}`}
                className="flex items-center gap-1.5 bg-ruwad-lime text-ruwad-navy px-6 py-3 rounded-ruwad-sm font-bold hover:opacity-90 transition shadow-ruwad">
                إنهاء الكورس 🎉
              </Link>
            )}
          </div>
        </div>

        {/* ===== قائمة المحاضرات الجانبية ===== */}
        <div className="bg-white rounded-ruwad shadow-card p-4 h-fit lg:sticky lg:top-6 order-first lg:order-last">
          <h2 className="text-sm font-bold text-ruwad-navy mb-3 px-1">محاضرات الكورس</h2>
          <div className="flex flex-col gap-1 max-h-[480px] overflow-y-auto">
            {allLectures.map((l, idx) => {
              const isCurrent = l.id === lecture.id
              const isDone = completedSet.has(l.id)
              return (
                <Link
                  key={l.id}
                  href={`/my-courses/${courseId}/lectures/${l.id}`}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-ruwad-sm text-sm transition ${
                    isCurrent ? 'bg-ruwad-blue text-white font-semibold' : 'hover:bg-ruwad-gray/20 text-ruwad-navy'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={16} className={isCurrent ? 'text-white' : 'text-ruwad-blue'} />
                  ) : (
                    <Circle size={16} className={isCurrent ? 'text-white/70' : 'text-ruwad-navy/30'} />
                  )}
                  {l.video_url ? <Video size={13} className="shrink-0 opacity-60" /> : <FileText size={13} className="shrink-0 opacity-60" />}
                  <span className="truncate flex-1">{idx + 1}. {l.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
