import type { Metadata } from 'next'
import Link from 'next/link'
import { ARTICLES } from '@/lib/content/articles'
import { LandingNav } from '@/components/marketing/LandingNav'

const TITLE = 'مدونة رُوّاد | مقالات عن إدارة المعاهد والتدريبات'
const DESCRIPTION =
  'مقالات عملية لأصحاب المعاهد والمدربين: كيف تختار نظام إدارة معهد، الحضور الرقمي، إدارة فريق مدربين، وأتمتة العمل الإداري للتدريب.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/blog' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: 'https://www.ruwaad.app/blog' },
}

export default function BlogIndexPage() {
  const sorted = [...ARTICLES].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))

  return (
    <main dir="rtl" className="bg-white min-h-screen">
      <LandingNav />
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-32 pb-20">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy mb-3">
          مدونة رُوّاد — إدارة المعاهد والتدريبات
        </h1>
        <p className="text-ruwad-navy/60 mb-12 leading-relaxed max-w-2xl">
          دليل عملي مستمر لأصحاب المعاهد والمدربين حول أتمتة العمل الإداري، اختيار الأنظمة المناسبة،
          وتحسين تجربة الطلاب في التدريب الإلكتروني والحضوري.
        </p>

        <div className="flex flex-col gap-6">
          {sorted.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="block bg-[#F5F6FA] rounded-ruwad p-6 sm:p-8 border-2 border-transparent hover:border-ruwad-blue transition"
            >
              <p className="text-xs text-ruwad-navy/50 font-semibold mb-2">
                {new Date(a.publishedAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                {' · '}قراءة {a.readingMinutes} دقائق
              </p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-ruwad-navy mb-2">{a.title}</h2>
              <p className="text-ruwad-navy/70 leading-relaxed">{a.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
