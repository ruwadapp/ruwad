import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { BookOpen, Users, Star, GraduationCap, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CourseLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: rows } = await supabase.rpc('get_course_landing_info', { p_course_id: id })
  const course = rows?.[0]
  if (!course) notFound()

  const joinHref = `/register?next=${encodeURIComponent(`/my-courses/join?code=${course.course_code}`)}`

  return (
    <main dir="rtl" className="min-h-screen bg-[#F5F6FA]">
      <div className="relative overflow-hidden bg-ruwad-gradient text-white">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-ruwad-lime/20 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto px-6 py-14 flex flex-col items-center text-center gap-5">
          <Link href="/" className="text-lg font-extrabold tracking-tight">رُوّاد</Link>

          {course.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.cover_image} alt={course.title} className="w-full max-w-md aspect-video object-cover rounded-ruwad shadow-ruwad-lg" />
          )}

          <h1 className="text-3xl font-extrabold">{course.title}</h1>
          {course.description && <p className="text-white/85 leading-relaxed max-w-lg">{course.description}</p>}

          <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-2 text-sm">
            {course.trainer_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.trainer_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {course.trainer_name.charAt(0)}
              </span>
            )}
            <span>بواسطة {course.trainer_name}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-2">
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <BookOpen size={18} className="mx-auto mb-1" />
              <p className="text-xl font-bold">{course.lecture_count}</p>
              <p className="text-[11px] text-white/70">محاضرة</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-ruwad-sm p-4 text-center">
              <Users size={18} className="mx-auto mb-1" />
              <p className="text-xl font-bold">{course.enrolled_count}</p>
              <p className="text-[11px] text-white/70">طالب مسجّل</p>
            </div>
            <div className="bg-ruwad-lime text-ruwad-navy rounded-ruwad-sm p-4 text-center">
              <Star size={18} className="mx-auto mb-1" />
              <p className="text-xl font-bold">{Number(course.rating_avg ?? 0).toFixed(1)}</p>
              <p className="text-[11px] opacity-70">تقييم ({course.rating_count})</p>
            </div>
          </div>

          <Link
            href={joinHref}
            className="bg-ruwad-lime text-ruwad-navy px-10 py-4 rounded-ruwad-sm font-bold text-lg hover:opacity-90 transition shadow-ruwad-lg mt-3"
          >
            سجّل الآن مجاناً ↗
          </Link>
          <p className="text-xs text-white/60">إنشاء حساب مجاني — طلب انضمامك يُراجَع من المدرب قبل التفعيل</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-4">
        <div className="bg-white rounded-ruwad shadow-card p-6 flex items-center gap-4">
          <GraduationCap size={28} className="text-ruwad-blue shrink-0" />
          <p className="text-sm text-ruwad-navy/70 leading-relaxed">
            هذا التدريب جزء من منصة <span className="font-bold text-ruwad-navy">رُوّاد</span> — منصة تعليمية شاملة
            تجمع المحاضرات، الامتحانات، الشهادات، وتتبّع تقدّمك في مكان واحد.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {['وصول لكل محاضرات التدريب وموادّه', 'امتحانات وتحديات تفاعلية لقياس تقدّمك', 'شهادة إتمام عند إنهاء التدريب بنجاح'].map((point) => (
            <div key={point} className="flex items-center gap-2 text-sm text-ruwad-navy/80">
              <CheckCircle2 size={16} className="text-ruwad-blue shrink-0" /> {point}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
