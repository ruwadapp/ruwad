// حلّ البوابة من اسم المضيف — يُستخدم في middleware (edge) وصفحات البوابة
// عبر استدعاء REST مباشر لدالة get_portal_by_host بمفتاح anon (تمر عبر RLS الآمنة)

export interface PortalInfo {
  portal_id: string
  institute_id: string
  status: 'active' | 'suspended' | 'expired'
  expires_at: string | null
  brand: {
    primary?: string
    secondary?: string
    accent?: string
    navy?: string
    logo_url?: string
    display_name?: string
  }
}

export const MAIN_HOSTS = new Set(['www.ruwaad.app', 'ruwaad.app', 'localhost:3000', '127.0.0.1:3000'])

// كاش خفيف داخل نسخة الـ edge لتفادي رحلة قاعدة بيانات مع كل طلب
const cache = new Map<string, { at: number; portal: PortalInfo | null }>()
const TTL_MS = 60_000

export async function resolvePortal(host: string): Promise<PortalInfo | null> {
  const key = host.toLowerCase()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.portal

  let portal: PortalInfo | null = null
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_portal_by_host`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      body: JSON.stringify({ p_host: key }),
    })
    if (res.ok) {
      const rows = (await res.json()) as PortalInfo[]
      portal = rows?.[0] ?? null
    }
  } catch {
    // فشل الشبكة: نتصرف كأن البوابة غير موجودة (تحويل للمنصة الأم) بدل كسر الطلب
  }
  cache.set(key, { at: Date.now(), portal })
  return portal
}

export function portalIsLive(p: PortalInfo): boolean {
  if (p.status !== 'active') return false
  if (p.expires_at && new Date(p.expires_at) < new Date()) return false
  return true
}

// تحويل hex إلى قنوات RGB لمتغيرات CSS (يتجاهل القيم غير الصالحة بأمان)
export function hexToRgbChannels(hex?: string): string | null {
  if (!hex) return null
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

// أنماط الحقن لعنصر غلاف البوابة — المتغيرات تتوارث فتتلون كل فئات tailwind تحتها
export function brandStyle(brand: PortalInfo['brand']): Record<string, string> {
  const style: Record<string, string> = {}
  const map: [keyof PortalInfo['brand'], string][] = [
    ['primary', '--brand-primary'],
    ['secondary', '--brand-secondary'],
    ['accent', '--brand-accent'],
    ['navy', '--brand-navy'],
  ]
  for (const [k, v] of map) {
    const rgb = hexToRgbChannels(brand[k] as string | undefined)
    if (rgb) style[v] = rgb
  }
  return style
}
