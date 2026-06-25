import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const TRAINER_ROUTES = [
  '/dashboard', '/students', '/courses', '/exams', '/surveys',
  '/challenges', '/assignments', '/attendance', '/badges', '/analytics', '/presentations', '/institute',
]
const STUDENT_ROUTES = ['/home', '/my-courses', '/my-exams', '/my-assignments', '/my-attendance', '/my-challenges', '/progress', '/my-presentations', '/my-institute']
const INSTITUTE_ROUTES = ['/org']

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
        trainer: '/dashboard', student: '/home', institute_admin: '/org/dashboard',
      }
      const redirect = redirectMap[profile?.role ?? 'student'] ?? '/home'
      return NextResponse.redirect(new URL(redirect, request.url))
    }
    return response
  }

  const isProtected =
    TRAINER_ROUTES.some((r) => path.startsWith(r)) ||
    STUDENT_ROUTES.some((r) => path.startsWith(r)) ||
    INSTITUTE_ROUTES.some((r) => path.startsWith(r))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
