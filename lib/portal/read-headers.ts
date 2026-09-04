import { headers } from 'next/headers'
import { hexToRgbChannels, type PortalInfo } from './resolve'
import type { ActivePortalBrand } from './brand-context'

// يقرأ هوية البوابة التي وسمها middleware على ترويسات الطلب — تُستدعى في مكوّنات الخادم
// (Server Components) فقط؛ تُعيد null على زيارات النطاق الرئيسي العادية
export async function readActivePortal(): Promise<{ brand: ActivePortalBrand | null; raw: PortalInfo['brand'] | null }> {
  const h = await headers()
  const id = h.get('x-portal-id')
  const instituteId = h.get('x-portal-institute-id')
  const rawBrandHeader = h.get('x-portal-brand')
  if (!id || !instituteId || !rawBrandHeader) return { brand: null, raw: null }

  let raw: PortalInfo['brand'] = {}
  try { raw = JSON.parse(decodeURIComponent(rawBrandHeader)) } catch { raw = {} }

  return {
    raw,
    brand: {
      id, instituteId,
      displayName: raw.display_name || 'المعهد',
      logoUrl: raw.logo_url || null,
    },
  }
}

export function portalCssVars(raw: PortalInfo['brand'] | null): Record<string, string> {
  if (!raw) return {}
  const style: Record<string, string> = {}
  const map: [keyof PortalInfo['brand'], string][] = [
    ['primary', '--brand-primary'], ['secondary', '--brand-secondary'],
    ['accent', '--brand-accent'], ['navy', '--brand-navy'],
  ]
  for (const [k, v] of map) {
    const rgb = hexToRgbChannels(raw[k] as string | undefined)
    if (rgb) style[v] = rgb
  }
  return style
}
