import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_URL = 'https://www.ruwaad.app'
const TITLE = 'رُوّاد | منصة تدريب تفاعلية للمدربين والمعاهد'
const DESCRIPTION = 'منصة رُوّاد التعليمية العربية: كورسات، امتحانات تُصحَّح تلقائياً، تحديات حيّة، شهادات موثّقة بـQR، وحضور رقمي — كل ما يحتاجه المدرب والمعهد في مكان واحد.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s | رُوّاد',
  },
  description: DESCRIPTION,
  keywords: [
    'منصة تدريب', 'منصة تعليمية عربية', 'تدريب أونلاين', 'كورسات أونلاين',
    'امتحانات إلكترونية', 'شهادات إلكترونية', 'تحديات تفاعلية', 'إدارة معهد تدريبي',
    'منصة مدربين', 'e-learning عربي',
  ],
  applicationName: 'رُوّاد',
  authors: [{ name: 'رُوّاد' }],
  creator: 'رُوّاد',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'رُوّاد',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: SITE_URL,
    siteName: 'رُوّاد',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'رُوّاد' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body className="font-arabic">{children}</body>
    </html>
  )
}
