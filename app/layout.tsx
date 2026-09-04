import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppResumeGuard } from '@/components/shared/AppResumeGuard'
import { readActivePortal, portalCssVars } from '@/lib/portal/read-headers'
import { PortalBrandProvider } from '@/lib/portal/brand-context'

const SITE_URL = 'https://www.ruwaad.app'
const TITLE = 'رُوّاد | نظام إدارة معاهد وتدريبات — منصة تعليمية عربية متكاملة'
const DESCRIPTION = 'رُوّاد نظام متكامل لإدارة المعاهد والتدريبات: كورسات، امتحانات تُصحَّح تلقائياً، تحديات حيّة، شهادات موثّقة بـQR، حضور رقمي، ولوحة تحكم موحّدة لمدرّبي المعهد. الحل العربي الأول لإدارة التدريب أونلاين وأوفلاين.'

// البيانات الوصفية ديناميكية بحسب الطلب: إن جاءت الزيارة عبر بوابة معهد
// (subdomain مربوط)، يظهر اسم المعهد وشعاره في عنوان المتصفح واسم التطبيق
// بدل هوية رُوّاد بالكامل — بلا أي ذكر لرُوّاد على تلك البوابة.
export async function generateMetadata(): Promise<Metadata> {
  const { brand } = await readActivePortal()
  if (!brand) {
    return {
      metadataBase: new URL(SITE_URL),
      title: { default: TITLE, template: '%s | رُوّاد' },
      description: DESCRIPTION,
      keywords: [
        'نظام إدارة معاهد', 'إدارة معاهد تدريب', 'برنامج إدارة تدريبات', 'إدارة الدورات التدريبية',
        'منصة تدريب', 'منصة تعليمية عربية', 'تدريب أونلاين', 'كورسات أونلاين',
        'امتحانات إلكترونية', 'شهادات إلكترونية', 'تحديات تفاعلية', 'إدارة معهد تدريبي',
        'منصة مدربين', 'نظام إدارة مراكز تدريب', 'e-learning عربي',
      ],
      applicationName: 'رُوّاد',
      authors: [{ name: 'رُوّاد' }],
      creator: 'رُوّاد',
      alternates: { canonical: '/' },
      icons: {
        icon: [
          { url: '/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
          { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [{ url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' }],
      },
      appleWebApp: { capable: true, statusBarStyle: 'default', title: 'رُوّاد' },
      openGraph: {
        type: 'website', locale: 'ar_SA', url: SITE_URL, siteName: 'رُوّاد', title: TITLE, description: DESCRIPTION,
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'رُوّاد' }],
      },
      twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/opengraph-image'] },
      robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    }
  }

  const name = brand.displayName
  return {
    title: { default: name, template: `%s | ${name}` },
    description: `${name} — منصة تدريب إلكترونية.`,
    applicationName: name,
    appleWebApp: { capable: true, statusBarStyle: 'default', title: name },
    icons: brand.logoUrl ? { icon: [{ url: brand.logoUrl }], apple: [{ url: brand.logoUrl }] } : undefined,
    openGraph: { type: 'website', locale: 'ar_SA', siteName: name, title: name, description: `${name} — منصة تدريب إلكترونية.` },
    robots: { index: false, follow: false },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3A4EFB',
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'رُوّاد',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  description: DESCRIPTION,
  url: SITE_URL,
  offers: { '@type': 'Offer', priceCurrency: 'USD', price: '0' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { brand, raw } = await readActivePortal()
  const brandVars = portalCssVars(raw)

  return (
    <html lang="ar" dir="rtl" style={brandVars}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Alyamama:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
        />
        {!brand && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />}
      </head>
      <body className="font-arabic">
        <AppResumeGuard />
        <PortalBrandProvider brand={brand}>{children}</PortalBrandProvider>
      </body>
    </html>
  )
}
