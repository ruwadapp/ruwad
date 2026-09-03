import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { CourseOverviewTabs } from '@/components/institute/CourseOverviewTabs'
import { ArrowRight, ExternalLink, BookOpen } from 'lucide-react'

// بطاقة التدريب الكاملة للمعهد: كل المرتبطات في تبويبات
export default async function InstituteCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: institute } = await supabase
    .from('institutes').select('id').eq('owner_id', session!.user.id).single()
  if (!institute) redirect('/org/dashboard')

  const { data: overview } = await supabase
    .rpc('institute_course_overview', { p_institute_id: institute.id, p_course_id: id })
  if (!overview) notFound()

  const c = (overview as { course: {
    title: string; description: string | null; cover_image: string | null
    status: string; created_at: string; trainer_name: string; trainer_avatar: string | null
  } }).course

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <Header title="التدريبات" />
      <main className="p-4 sm:p-6 max-w-5xl mx-auto flex flex-col gap-4">
        {/* الترويسة */}
        <div className="bg-white rounded-ruwad shadow-card overflow-hidden">
          <div className="relative h-32 sm:h-40">
            {c.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.cover_image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-ruwad-gradient flex items-center justify-center"><BookOpen size={36} className="text-white/60" /></div>
            )}
            <Link href="/org/courses"
              className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-extrabold text-ruwad-navy bg-white/90 backdrop-blur rounded-full px-3 py-1.5 hover:bg-white transition">
              <ArrowRight size={12} /> كل التدريبات
            </Link>
            <span className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur ${c.status === 'published' ? 'bg-green-500/90 text-white' : 'bg-white/90 text-amber-600'}`}>
              {c.status === 'published' ? 'منشور' : 'مسودة'}
            </span>
          </div>
          <div className="p-4 sm:p-5 flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-ruwad-navy">{c.title}</h1>
              {c.description && <p className="text-xs text-ruwad-navy/55 leading-relaxed mt-1 max-w-2xl">{c.description}</p>}
              <div className="flex items-center gap-2 mt-2.5">
                {c.trainer_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.trainer_avatar} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-ruwad-gray/50" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-ruwad-gradient text-white text-[11px] font-extrabold flex items-center justify-center">{c.trainer_name.charAt(0)}</span>
                )}
                <span className="text-xs font-extrabold text-ruwad-navy/70">{c.trainer_name}</span>
                <span className="text-[10px] font-bold text-ruwad-navy/35">· أُنشئ {new Date(c.created_at).toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
            <Link href={`/land/${id}`} target="_blank"
              className="shrink-0 flex items-center gap-1.5 text-xs font-extrabold text-ruwad-blue bg-ruwad-blue/10 hover:bg-ruwad-blue/20 rounded-ruwad-sm px-3.5 py-2.5 transition">
              صفحة التدريب <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        <CourseOverviewTabs data={overview as never} />
      </main>
    </div>
  )
}
