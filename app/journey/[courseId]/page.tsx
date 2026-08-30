import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { JourneyBuilder, type BuilderItem } from '@/components/shared/JourneyBuilder'
import { ArrowRight, Map as MapIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

// منظِّم الرحلة — صفحة محايدة يصلها مدرب الكورس أو المعهد المُشارَك معه
export default async function JourneyBuilderPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase.from('courses').select('id, title, trainer_id').eq('id', courseId).single()
  if (!course) redirect('/dashboard')

  // تحقق الصلاحية: مدرب الكورس أو معهد مُشارَك معه (نفس دالة الأمان المعتمدة)
  const { data: canManage } = await supabase.rpc('can_manage_shared_resource_v2', {
    p_resource_type: 'courses',
    p_resource_id: course.id,
    p_trainer_id: course.trainer_id,
    p_acting_user: user.id,
  })
  if (!canManage) redirect('/dashboard')

  // المحتوى المتاح + الترتيب المحفوظ (إن وجد)
  const [{ data: lectures }, { data: exams }, { data: assignments }, { data: challenges }, { data: savedItems }] = await Promise.all([
    supabase.from('lectures').select('id, title').eq('course_id', courseId).eq('is_published', true).order('order_index'),
    supabase.from('exams').select('id, title').eq('course_id', courseId).eq('is_active', true).order('created_at'),
    supabase.from('assignments').select('id, title').eq('course_id', courseId).order('created_at'),
    supabase.from('challenges').select('id, title').eq('course_id', courseId).order('created_at'),
    supabase.from('journey_items').select('id, item_type, item_id').eq('course_id', courseId).order('order_index'),
  ])

  const titleOf = new Map<string, string>()
  for (const list of [lectures, exams, assignments, challenges])
    for (const x of list ?? []) titleOf.set(x.id, x.title)

  let initial: BuilderItem[]
  if (savedItems && savedItems.length > 0) {
    // الترتيب المحفوظ + إلحاق أي محتوى جديد أُضيف بعده
    initial = savedItems
      .filter((it) => it.item_type === 'treasure' || titleOf.has(it.item_id ?? ''))
      .map((it) => ({
        uid: it.id,
        item_type: it.item_type as BuilderItem['item_type'],
        item_id: it.item_id,
        title: it.item_type === 'treasure' ? 'كنز مخفي' : titleOf.get(it.item_id!) ?? '',
      }))
    const included = new Set(initial.map((x) => x.item_id).filter(Boolean))
    const appendMissing = (list: { id: string; title: string }[] | null, type: BuilderItem['item_type']) => {
      for (const x of list ?? []) if (!included.has(x.id)) initial.push({ uid: x.id, item_type: type, item_id: x.id, title: x.title })
    }
    appendMissing(lectures, 'lecture'); appendMissing(assignments, 'assignment')
    appendMissing(challenges, 'challenge'); appendMissing(exams, 'exam')
  } else {
    // الترتيب التلقائي الحالي كنقطة انطلاق
    initial = [
      ...(lectures ?? []).map((x) => ({ uid: x.id, item_type: 'lecture' as const, item_id: x.id, title: x.title })),
      ...(assignments ?? []).map((x) => ({ uid: x.id, item_type: 'assignment' as const, item_id: x.id, title: x.title })),
      ...(challenges ?? []).map((x) => ({ uid: x.id, item_type: 'challenge' as const, item_id: x.id, title: x.title })),
      ...(exams ?? []).map((x) => ({ uid: x.id, item_type: 'exam' as const, item_id: x.id, title: x.title })),
    ]
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA]" dir="rtl">
      <div className="relative overflow-hidden bg-ruwad-gradient px-6 py-8">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-3xl" />
        <div className="relative max-w-2xl mx-auto">
          <p className="flex items-center gap-2 text-white/70 text-xs"><MapIcon size={13} /> منظِّم الرحلة</p>
          <h1 className="text-xl font-extrabold text-white mt-1">{course.title}</h1>
        </div>
      </div>
      <main className="p-6 max-w-2xl mx-auto w-full flex flex-col gap-4 pb-32">
        <BackLink />
        <JourneyBuilder courseId={courseId} initialItems={initial} />
      </main>
    </div>
  )
}

function BackLink() {
  return (
    <Link href="/dashboard" className="self-start flex items-center gap-1.5 text-sm font-semibold text-ruwad-navy/55 hover:text-ruwad-blue transition">
      <ArrowRight size={15} /> رجوع
    </Link>
  )
}
