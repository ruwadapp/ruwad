import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const TRAINER_ROUTES = [
  '/dashboard', '/students', '/courses', '/exams', '/surveys',
  '/challenges', '/assignments', '/attendance', '/badges', '/analytics', '/presentations', '/institute',
]
const STUDENT_ROUTES = ['/home', '/my-courses', '/my-exams', '/my-assignments', '/my-attendance', '/my-challenges', '/progress', '/my-presentations', '/my-institute', '/profile']
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
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', path + (request.nextUrl.search || ''))
    return NextResponse.redirect(loginUrl)
  }

  // بوابة موافقة واحدة وبسيطة: أي حساب (مدرّب/طالب/معهد) غير موافَق عليه من المالك يُحوَّل لصفحة الانتظار
  if (user && isProtected && !SUPERADMIN_ROUTES.some((r) => path.startsWith(r))) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: profile } = await supabase.from('profiles').select('account_status').eq('id', user.id).single()
    if (profile?.account_status !== 'approved' && path !== '/account-pending') {
      return NextResponse.redirect(new URL('/account-pending', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
