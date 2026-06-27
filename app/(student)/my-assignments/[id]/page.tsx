import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { AssignmentSubmitForm } from '@/components/student/AssignmentSubmitForm'
import { SanitizedHtml } from '@/components/shared/SanitizedHtml'
import { CheckCircle2, Clock, AlertTriangle, FileText, Image as ImageIcon, File as FileIcon, Award, TrendingUp } from 'lucide-react'

function iconFor(type: string) {
  if (type?.startsWith('image/')) return ImageIcon
  if (type === 'application/pdf') return FileText
  return FileIcon
}

export default async function StudentAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignment } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!assignment) notFound()

  const { data: submission } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', id)
    .eq('student_id', user!.id)
    .maybeSingle()

  const now = new Date()
  const due = assignment.due_date ? new Date(assignment.due_date) : null
  const hoursLeft = due ? (due.getTime() - now.getTime()) / 3600000 : null
  const wasLate = submission && due && new Date(submission.submitted_at) > due

  let classAverage: number | null = null
  if (submission?.graded_at) {
    const { data: allGraded } = await supabase
      .from('assignment_submissions').select('score').eq('assignment_id', id).not('graded_at', 'is', null)
    const scores = (allGraded ?? []).map((s) => s.score ?? 0)
    if (scores.length > 1) classAverage = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
  }

  return (
    <>
      <Header title={assignment.title} />
      <main className="p-6 flex flex-col gap-6 max-w-3xl mx-auto w-full">
        {/* ===== هيدر متدرّج بالموعد والدرجة ===== */}
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-7">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />
          <h1 className="relative text-xl font-bold text-white">{assignment.title}</h1>
          {assignment.description && <p className="relative text-white/70 text-sm mt-1">{assignment.description}</p>}

          <div className="relative flex items-center gap-3 mt-4 flex-wrap">
            <span className="bg-white/15 backdrop-blur text-white text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Award size={14} /> {assignment.total_marks} درجة
            </span>
            {due && (
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                submission ? 'bg-white/15 text-white backdrop-blur' :
                hoursLeft! < 0 ? 'bg-red-500 text-white' :
                hoursLeft! < 48 ? 'bg-amber-400 text-ruwad-navy' : 'bg-ruwad-lime text-ruwad-navy'
              }`}>
                <Clock size={14} /> {hoursLeft! < 0 ? 'انتهى الموعد' : `الموعد: ${due.toLocaleDateString('ar')}`}
              </span>
            )}
          </div>
        </div>

        {assignment.instructions && (
          <div className="bg-white rounded-ruwad shadow-card p-6">
            <h2 className="text-sm font-bold text-ruwad-navy/60 mb-2">التعليمات</h2>
            <SanitizedHtml html={assignment.instructions} />
          </div>
        )}

        {submission ? (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-ruwad shadow-card p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-2 text-ruwad-blue font-semibold">
                  <CheckCircle2 size={20} /> تم تسليم الواجب
                </span>
                {wasLate && (
                  <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                    <AlertTriangle size={12} /> تسليم متأخر
                  </span>
                )}
              </div>
              {submission.content && <SanitizedHtml html={submission.content} />}
              {submission.file_urls && submission.file_urls.length > 0 && (
                <div className="flex flex-col gap-2">
                  {submission.file_urls.map((f: { name: string; url: string; type: string }, i: number) => {
                    const Icon = iconFor(f.type)
                    return (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 rounded-ruwad-sm bg-ruwad-gray/10 text-sm text-ruwad-navy hover:underline">
                        <Icon size={16} className="text-ruwad-blue shrink-0" /> {f.name}
                      </a>
                    )
                  })}
                </div>
              )}
            </div>

            {submission.graded_at ? (
              <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-8 flex flex-col items-center gap-3 text-center">
                <div className="absolute -top-14 -right-14 w-44 h-44 bg-white/10 rounded-full blur-3xl" />
                <Award size={40} className="relative text-ruwad-lime" />
                <p className="relative text-4xl font-extrabold text-white">{submission.score}<span className="text-lg opacity-70">/{assignment.total_marks}</span></p>
                {submission.feedback && (
                  <p className="relative text-white/80 text-sm bg-white/10 backdrop-blur rounded-ruwad-sm px-4 py-3 max-w-md">{submission.feedback}</p>
                )}
                {classAverage !== null && (
                  <p className="relative flex items-center gap-1.5 text-xs text-white/60 mt-1">
                    <TrendingUp size={13} /> متوسط الصف: {classAverage}/{assignment.total_marks}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-ruwad shadow-card p-6 text-center">
                <p className="text-sm text-ruwad-navy/50">بانتظار تصحيح المدرب.</p>
              </div>
            )}
          </div>
        ) : (
          <AssignmentSubmitForm assignmentId={id} dueDate={assignment.due_date} />
        )}
      </main>
    </>
  )
}
