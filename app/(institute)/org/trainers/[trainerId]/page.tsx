import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import {
  BookOpen, FileText, ClipboardList, Trophy, FileCheck, Users, Calendar, Building2,
} from 'lucide-react'

export default async function InstituteTrainerDetailPage({ params }: { params: Promise<{ trainerId: string }> }) {
  const { trainerId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user!.id).single()
  if (!institute) notFound()

  const { data: membership } = await supabase
    .from('institute_members')
    .select('id, member:profiles!user_id(full_name, created_at)')
    .eq('institute_id', institute.id)
    .eq('user_id', trainerId)
    .eq('status', 'approved')
    .single()

  if (!membership) notFound()

  const trainerName = (membership.member as unknown as { full_name?: string })?.full_name ?? 'مدرب'
  const joinedAt = (membership.member as unknown as { created_at?: string })?.created_at

  const [
    { data: courses },
    { data: exams },
    { data: surveys },
    { data: challenges },
    { data: assignments },
    { data: shares },
  ] = await Promise.all([
    supabase.from('courses').select('*, lectures(count), enrollments(count)').eq('trainer_id', trainerId).order('created_at', { ascending: false }),
    supabase.from('exams').select('*, questions(count), exam_submissions(count)').eq('trainer_id', trainerId).order('created_at', { ascending: false }),
    supabase.from('surveys').select('*, survey_questions(count), survey_responses(count)').eq('trainer_id', trainerId).order('created_at', { ascending: false }),
    supabase.from('challenges').select('*, challenge_questions(count), challenge_submissions(count)').eq('trainer_id', trainerId).order('created_at', { ascending: false }),
    supabase.from('assignments').select('*, assignment_submissions(count)').eq('trainer_id', trainerId).order('created_at', { ascending: false }),
    supabase.from('resource_institute_shares').select('resource_type, resource_id').eq('institute_id', institute.id).eq('trainer_id', trainerId),
  ])

  const sharedIdsByType: Record<string, Set<string>> = { courses: new Set(), exams: new Set(), assignments: new Set(), challenges: new Set() }
  for (const s of shares ?? []) sharedIdsByType[s.resource_type]?.add(s.resource_id)

  const courseIds = (courses ?? []).map((c) => c.id)
  const { data: enrollments } = courseIds.length
    ? await supabase
        .from('enrollments')
        .select('student_id, course_id, progress, status, student:profiles!student_id(full_name)')
        .in('course_id', courseIds)
        .eq('status', 'approved')
    : { data: [] }

  const studentMap = new Map<string, { name: string; courseCount: number }>()
  for (const e of enrollments ?? []) {
    const name = (e.student as unknown as { full_name?: string })?.full_name ?? 'طالب'
    const existing = studentMap.get(e.student_id)
    if (existing) existing.courseCount += 1
    else studentMap.set(e.student_id, { name, courseCount: 1 })
  }
  const students = Array.from(studentMap.values())

  return (
    <>
      <Header title={trainerName} />
      <main className="p-6 flex flex-col gap-6">
        {/* ===== الهيدر الاحترافي ===== */}
        <div className="relative overflow-hidden bg-ruwad-gradient rounded-ruwad shadow-ruwad-lg p-8">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-ruwad-lime/20 rounded-full blur-3xl" />

          <div className="relative flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur text-white flex items-center justify-center font-bold text-2xl shrink-0">
              {trainerName.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{trainerName}</h2>
              {joinedAt && (
                <p className="flex items-center gap-1.5 text-sm text-white/70 mt-1">
                  <Calendar size={14} /> ينضمّ منذ {new Date(joinedAt).toLocaleDateString('ar')}
                </p>
              )}
            </div>
          </div>

          <div className="relative grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'كورسات', value: courses?.length ?? 0 },
              { label: 'امتحانات', value: exams?.length ?? 0 },
              { label: 'استبيانات', value: surveys?.length ?? 0 },
              { label: 'تحديات', value: challenges?.length ?? 0 },
              { label: 'طلاب', value: students.length, accent: true },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-ruwad-sm p-4 text-center ${stat.accent ? 'bg-ruwad-lime' : 'bg-white/15 backdrop-blur'}`}>
                <p className={`text-2xl font-bold ${stat.accent ? 'text-ruwad-navy' : 'text-white'}`}>{stat.value}</p>
                <p className={`text-xs mt-1 ${stat.accent ? 'text-ruwad-navy/70' : 'text-white/70'}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== الكورسات ===== */}
        <Section title="الكورسات" icon={BookOpen}>
          {!courses || courses.length === 0 ? <EmptyRow text="لا توجد كورسات." /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {courses.map((c) => (
                <EntitySummaryCard
                  key={c.id}
                  href={sharedIdsByType.courses.has(c.id) ? `/courses/${c.id}` : undefined}
                  title={c.title}
                  shared={sharedIdsByType.courses.has(c.id)}
                  badge={<StatusBadge active={c.status === 'published'} activeLabel="منشور" inactiveLabel="مسودة" />}
                  meta={`${c.lectures?.[0]?.count ?? 0} محاضرة · ${c.enrollments?.[0]?.count ?? 0} طالب`}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ===== الامتحانات ===== */}
        <Section title="الامتحانات" icon={FileText}>
          {!exams || exams.length === 0 ? <EmptyRow text="لا توجد امتحانات." /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {exams.map((e) => (
                <EntitySummaryCard
                  key={e.id}
                  href={sharedIdsByType.exams.has(e.id) ? `/exams/${e.id}` : undefined}
                  title={e.title}
                  shared={sharedIdsByType.exams.has(e.id)}
                  badge={<StatusBadge active={e.is_active} activeLabel="نشط" inactiveLabel="متوقف" />}
                  meta={`${e.questions?.[0]?.count ?? 0} سؤال · ${e.exam_submissions?.[0]?.count ?? 0} مشارك`}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ===== الاستبيانات ===== */}
        <Section title="الاستبيانات" icon={ClipboardList}>
          {!surveys || surveys.length === 0 ? <EmptyRow text="لا توجد استبيانات." /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {surveys.map((s) => (
                <div key={s.id} className="border border-ruwad-gray/60 rounded-ruwad-sm p-4">
                  <p className="font-bold text-ruwad-navy text-sm line-clamp-1">{s.title}</p>
                  <p className="text-xs text-ruwad-navy/50 mt-2">{s.survey_questions?.[0]?.count ?? 0} سؤال · {s.survey_responses?.[0]?.count ?? 0} رد</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ===== التحديات ===== */}
        <Section title="التحديات" icon={Trophy}>
          {!challenges || challenges.length === 0 ? <EmptyRow text="لا توجد تحديات." /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {challenges.map((c) => (
                <EntitySummaryCard
                  key={c.id}
                  href={sharedIdsByType.challenges.has(c.id) ? `/challenges/${c.id}` : undefined}
                  title={c.title}
                  shared={sharedIdsByType.challenges.has(c.id)}
                  accent
                  meta={`${c.challenge_questions?.[0]?.count ?? 0} سؤال · ${c.challenge_submissions?.[0]?.count ?? 0} مشارك`}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ===== الواجبات ===== */}
        <Section title="الواجبات" icon={FileCheck}>
          {!assignments || assignments.length === 0 ? <EmptyRow text="لا توجد واجبات." /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignments.map((a) => (
                <EntitySummaryCard
                  key={a.id}
                  href={sharedIdsByType.assignments.has(a.id) ? `/assignments/${a.id}` : undefined}
                  title={a.title}
                  shared={sharedIdsByType.assignments.has(a.id)}
                  meta={`${a.assignment_submissions?.[0]?.count ?? 0} تسليم`}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ===== الطلاب ===== */}
        <Section title={`الطلاب (${students.length})`} icon={Users}>
          {students.length === 0 ? <EmptyRow text="لا يوجد طلاب لهذا المدرب بعد." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-ruwad-navy/50 border-b border-ruwad-gray/60">
                    <th className="py-2">الطالب</th>
                    <th className="py-2">عدد الكورسات الملتحق بها</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={idx} className="border-b border-ruwad-gray/30">
                      <td className="py-3 text-ruwad-navy font-medium">{s.name}</td>
                      <td className="py-3 text-ruwad-navy">{s.courseCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </main>
    </>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof BookOpen; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-ruwad shadow-card p-6">
      <h2 className="text-lg font-bold text-ruwad-navy mb-4 flex items-center gap-2">
        <Icon size={20} className="text-ruwad-blue" /> {title}
      </h2>
      {children}
    </section>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-ruwad-navy/50 text-sm py-4 text-center">{text}</p>
}

function StatusBadge({ active, activeLabel, inactiveLabel }: { active: boolean; activeLabel: string; inactiveLabel: string }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${active ? 'bg-ruwad-lime text-ruwad-navy' : 'bg-ruwad-gray/50 text-ruwad-navy/60'}`}>
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

/**
 * بطاقة عنصر (كورس/امتحان/تحدي/واجب) في صفحة المدرب داخل لوحة المعهد.
 * تصبح قابلة للنقر والتعديل فقط إذا فعّل المدرب مشاركتها مع المعهد (href موجود)؛
 * الوصول الفعلي محكوم بـ RLS (can_manage_shared_resource) وليس فقط بإخفاء الرابط هنا.
 */
function EntitySummaryCard({
  href,
  title,
  shared,
  meta,
  badge,
  accent = false,
}: {
  href?: string
  title: string
  shared?: boolean
  meta: string
  badge?: React.ReactNode
  accent?: boolean
}) {
  const content = (
    <div
      className={`rounded-ruwad-sm p-4 h-full transition ${
        accent ? 'border border-ruwad-lime/50 bg-ruwad-lime/5' : 'border border-ruwad-gray/60'
      } ${href ? 'hover:shadow-card hover:-translate-y-0.5 cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-ruwad-navy text-sm line-clamp-1">{title}</p>
        {badge}
      </div>
      <p className="text-xs text-ruwad-navy/50 mt-2">{meta}</p>
      {shared ? (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-ruwad-blue mt-2">
          <Building2 size={12} /> مُشارَك مع المعهد — قابل للتعديل
        </p>
      ) : (
        <p className="text-[11px] text-ruwad-navy/35 mt-2">غير مُشارَك — للعرض فقط</p>
      )}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
