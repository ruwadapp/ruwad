import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'رُوّاد | Ruwad',
  description: 'منصة تعليمية متكاملة تتيح للمدرب إدارة الطلاب والكورسات والامتحانات',
  manifest: '/manifest.json',
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3A4EFB',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-arabic">{children}</body>
    </html>
  )
}
