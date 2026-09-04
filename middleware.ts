import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { MAIN_HOSTS, resolvePortal, portalIsLive, type PortalInfo } from '@/lib/portal/resolve'

const TRAINER_ROUTES = [
  '/dashboard', '/students', '/courses', '/exams', '/surveys',
  '/challenges', '/assignments', '/attendance', '/badges', '/analytics', '/presentations', '/institute', '/posts',
]
const STUDENT_ROUTES = ['/home', '/rawaq', '/my-courses', '/my-exams', '/my-assignments', '/my-attendance', '/my-challenges', '/progress', '/my-presentations', '/profile', '/my-badges', '/my-certificates']
const INSTITUTE_ROUTES = ['/org']
const SUPERADMIN_ROUTES = ['/admin']
const PROFILE_ROUTES = ['/t', '/i']

function matchesRoute(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`))
}

// حزمة هوية البوابة تُكتب على ترويسات الطلب نفسه (لا الاستجابة) كي يقرأها
// أي مكوّن خادم لاحقاً عبر headers() — بما في ذلك layout الجذر وكل صفحة تُعرض بعده
function tagPortal(request: NextRequest, portal: PortalInfo) {
  request.headers.set('x-portal-id', portal.portal_id)
  request.headers.set('x-portal-institute-id', portal.institute_id)
  request.headers.set('x-portal-brand', encodeURIComponent(JSON.stringify(portal.brand)))
}

export async function middleware(request: NextRequest) {
  // توحيد النطاق: أي زيارة عبر نطاق vercel.app تُحوَّل للنطاق الرسمي
  const host = request.headers.get('host') ?? ''
  if (host.endsWith('.vercel.app') && !request.nextUrl.pathname.startsWith('/api')) {
    const url = new URL(request.url)
    url.host = 'www.ruwaad.app'
    url.protocol = 'https:'
    url.port = ''
    return NextResponse.redirect(url, 308)
  }

  const url = request.nextUrl
  let portal: PortalInfo | null = null

  // ===== بوابات المعاهد: أي مضيف غير المنصة الأم =====
  if (!MAIN_HOSTS.has(host.toLowerCase())) {
    portal = await resolvePortal(host)

    // مضيف مجهول (subdomain بلا بوابة أو دومين غير مربوط) → المنصة الأم
    if (!portal) {
      return NextResponse.redirect(new URL(`https://www.ruwaad.app${url.pathname}${url.search}`), 307)
    }
    // بوابة موقوفة أو منتهية → صفحة التعليق (على دومين المعهد نفسه)
    if (!portalIsLive(portal)) {
      if (url.pathname !== '/portal-inactive') {
        return NextResponse.rewrite(new URL('/portal-inactive', request.url))
      }
      return NextResponse.next()
    }
    tagPortal(request, portal)
    // بوابة حية والجذر → صفحة التسويق العامة للبوابة
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL(`/portal/${portal.portal_id}`, request.url), { request: { headers: request.headers } })
    }
    if (url.pathname === '/portal-inactive' || url.pathname.startsWith('/portal/')) {
      return NextResponse.next({ request: { headers: request.headers } })
    }
    // كل ما عدا ذلك (تسجيل الدخول، إنشاء الحساب، وكامل التطبيق بعد الدخول)
    // يستمر على نفس دومين البوابة بهويتها الكاملة — لا تحويل بعد الآن للمنصة الأم
  }

  const { user, response } = await updateSession(request)
  const path = request.nextUrl.pathname

  // صفحات المصادقة — إذا كان مسجلاً دخوله اتجه للوحة المناسبة (على نفس الدومين الحالي)
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
    matchesRoute(path, TRAINER_ROUTES) ||
    matchesRoute(path, STUDENT_ROUTES) ||
    matchesRoute(path, INSTITUTE_ROUTES) ||
    matchesRoute(path, SUPERADMIN_ROUTES) ||
    matchesRoute(path, PROFILE_ROUTES)

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', path + (request.nextUrl.search || ''))
    return NextResponse.redirect(loginUrl)
  }

  // بوابة موافقة واحدة وبسيطة: أي حساب (مدرّب/طالب/معهد) غير موافَق عليه، مجمَّد، أو منتهي الاشتراك يُحوَّل لصفحة الانتظار
  if (user && isProtected && !matchesRoute(path, SUPERADMIN_ROUTES)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status, is_frozen, subscription_ends_at')
      .eq('id', user.id)
      .single()
    const expired = !!profile?.subscription_ends_at && new Date(profile.subscription_ends_at) < new Date()
    const blocked = profile?.account_status !== 'approved' || profile?.is_frozen || expired
    if (blocked && path !== '/account-pending') {
      return NextResponse.redirect(new URL('/account-pending', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
