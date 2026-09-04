// كاش دور المستخدم محلياً: أزرار الترويسة تظهر فوراً من الكاش
// ويجري التحقق بالخلفية وتحديثه عند أول جلب
const KEY = 'ruwad_role'

export type CachedRole = 'student' | 'trainer' | 'institute_admin' | 'superadmin'

export function getCachedRole(): CachedRole | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(KEY)
  return v === 'student' || v === 'trainer' || v === 'institute_admin' || v === 'superadmin' ? v : null
}

export function setCachedRole(role: string | null | undefined) {
  if (typeof window === 'undefined' || !role) return
  window.localStorage.setItem(KEY, role)
}
