import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const TRAINER_ROUTES = [
  '/dashboard', '/students', '/courses', '/exams', '/surveys',
  '/challenges', '/assignments', '/attendance', '/badges', '/analytics', '/presentations', '/institute',
]
const STUDENT_ROUTES = ['/home', '/my-courses', '/my-exams', '/my-assignments', '/my-attendance', '/my-challenges', '/progress', '/my-presentations', '/my-institute']
const INSTITUTE_ROUTES = ['/org']
const SUPERADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  const { user, response } = await updateSession(request)
  const path = request.nextUrl.pathname

  // صفحات المصادقة — إذا كان مسجلاً دخوله اتجه للوحة المناسبة
  if (['/login', '/register'].includes(path)) {
    if (user) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
      )
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const redirectMap: Record<string, string> = {
        trainer: '/dashboard', student: '/home', institute_admin: '/org/dashboard', super_admin: '/admin/dashboard',
      }
      const redirect = redirectMap[profile?.role ?? 'student'] ?? '/home'
      return NextResponse.redirect(new URL(redirect, request.url))
    }
    return response
  }

  const isProtected =
    TRAINER_ROUTES.some((r) => path.startsWith(r)) ||
    STUDENT_ROUTES.some((r) => path.startsWith(r)) ||
    INSTITUTE_ROUTES.some((r) => path.startsWith(r)) ||
    SUPERADMIN_ROUTES.some((r) => path.startsWith(r))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // فرض الاشتراك — لكن مع استثناء صفحات "المعهد" حتى لا يُحجب حساب جديد عن الطريقة
  // الوحيدة المجانية لكسب وصول (طلب الانضمام لمعهد مشترك)
  const EXEMPT_FROM_SUBSCRIPTION = ['/institute', '/my-institute', '/org/dashboard']
  const isExempt = EXEMPT_FROM_SUBSCRIPTION.some((r) => path.startsWith(r))

  if (user && !isExempt) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )

    if (TRAINER_ROUTES.some((r) => path.startsWith(r))) {
      const { data: hasAccess } = await supabase.rpc('has_active_access', { p_trainer_id: user.id })
      if (!hasAccess) return NextResponse.redirect(new URL('/subscription-required', request.url))
    }

    if (INSTITUTE_ROUTES.some((r) => path.startsWith(r))) {
      const { data: institute } = await supabase.from('institutes').select('id').eq('owner_id', user.id).single()
      if (institute) {
        const { data: hasAccess } = await supabase.rpc('institute_has_active_access', { p_institute_id: institute.id })
        if (!hasAccess) return NextResponse.redirect(new URL('/subscription-required', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
