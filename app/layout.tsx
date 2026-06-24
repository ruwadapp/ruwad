import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'رُوّاد | Ruwad',
  description: 'منصة تعليمية متكاملة تتيح للمدرب إدارة الطلاب والكورسات والامتحانات',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-arabic">{children}</body>
    </html>
  )
}
