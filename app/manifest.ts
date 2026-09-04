import type { MetadataRoute } from 'next'
import { readActivePortal } from '@/lib/portal/read-headers'

// بيان PWA الديناميكي: عند زيارة بوابة معهد، اسم التطبيق وأيقونته عند "إضافة للشاشة
// الرئيسية" تصبح هوية المعهد بالكامل — بلا أي ذكر لرُوّاد. الزيارات العادية تحصل
// على بيان رُوّاد الافتراضي كما كان دوماً.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { brand } = await readActivePortal()

  if (!brand) {
    return {
      name: 'رُوّاد | Ruwad',
      short_name: 'رُوّاد',
      description: 'منصة تعليمية متكاملة تتيح للمدرب إدارة الطلاب والكورسات والامتحانات',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#F5F6FA',
      theme_color: '#3A4EFB',
      lang: 'ar',
      dir: 'rtl',
      icons: [
        { src: '/icons/icon-48.png', sizes: '48x48', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-180.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }
  }

  const icons: MetadataRoute.Manifest['icons'] = brand.logoUrl
    ? [
        { src: brand.logoUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: brand.logoUrl, sizes: '512x512', type: 'image/png', purpose: 'any' },
      ]
    : [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ]

  return {
    name: brand.displayName,
    short_name: brand.displayName,
    description: `${brand.displayName} — منصة تدريب إلكترونية.`,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F5F6FA',
    theme_color: '#3A4EFB',
    lang: 'ar',
    dir: 'rtl',
    icons,
  }
}
