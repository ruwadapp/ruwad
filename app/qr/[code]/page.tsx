import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function QrResolverPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/qr/${code}`)}`)

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role ?? 'student'
  const fallback = role === 'trainer' ? '/dashboard' : '/home'

  const { data: matches, error: rpcError } = await supabase.rpc('resolve_qr_code', { p_code: code })
  const match = matches?.[0]

  if (rpcError || !match) redirect(fallback)

  // أي خطأ غير متوقع من قاعدة البيانات هنا لا يجب أن يترك الطالب أمام شاشة خطأ مكسورة —
  // فبدل تعطّل الصفحة، نتجاهل خطأ التسجيل الفردي ونكمل التوجيه للوجهة المناسبة على أي حال
  switch (match.entity_type) {
    case 'institute': {
      await supabase.from('institute_members').upsert(
        { institute_id: match.entity_id, user_id: user.id, member_role: role === 'trainer' ? 'trainer' : 'student', invited_by: 'self' },
        { onConflict: 'institute_id,user_id', ignoreDuplicates: true }
      )
      redirect(role === 'trainer' ? '/institute' : '/my-institute')
    }
    case 'course': {
      const { data: existing } = await supabase
        .from('enrollments').select('id').eq('course_id', match.entity_id).eq('student_id', user.id).maybeSingle()
      if (!existing) {
        await supabase.from('enrollments').insert({ student_id: user.id, course_id: match.entity_id })
      }
      redirect('/my-courses')
    }
    case 'exam': {
      redirect(`/my-exams/${match.entity_id}`)
    }
    case 'presentation_session': {
      await supabase.from('presentation_participants').upsert(
        { session_id: match.entity_id, student_id: user.id },
        { onConflict: 'session_id,student_id' }
      )
      redirect(`/my-presentations/${match.entity_id}`)
    }
    case 'challenge_session': {
      await supabase.from('challenge_session_participants').upsert(
        { session_id: match.entity_id, student_id: user.id },
        { onConflict: 'session_id,student_id' }
      )
      redirect(`/my-challenges/live/${match.entity_id}`)
    }
    case 'attendance_session': {
      // نتحقق أن الجلسة نشطة فعلاً وإلا لا فائدة من التسجيل
      const { data: session } = await supabase
        .from('attendance_sessions')
        .select('id, is_active')
        .eq('id', match.entity_id)
        .single()

      if (!session?.is_active) {
        redirect('/my-attendance?error=session_closed')
      }

      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', match.entity_id)
        .eq('student_id', user.id)
        .maybeSingle()

      if (!existingRecord) {
        await supabase
          .from('attendance_records')
          .insert({ session_id: match.entity_id, student_id: user.id })
      }

      // نمرّر session_id لصفحة الحضور لتعرض حالة الطلب مباشرة
      redirect(`/my-attendance?session=${match.entity_id}`)
    }
    default:
      redirect(fallback)
  }
}
