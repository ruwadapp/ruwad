import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ARTICLES, getArticleBySlug } from '@/lib/content/articles'
import { LandingNav } from '@/components/marketing/LandingNav'
import { ArrowLeft } from 'lucide-react'

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return {}
  const url = `https://www.ruwaad.app/blog/${article.slug}`
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.description,
      url,
      publishedTime: article.publishedAt,
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const url = `https://www.ruwaad.app/blog/${article.slug}`
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: { '@type': 'Organization', name: 'رُوّاد' },
    publisher: { '@type': 'Organization', name: 'رُوّاد', url: 'https://www.ruwaad.app' },
    mainEntityOfPage: url,
    inLanguage: 'ar',
  }

  const faqSchema = article.faq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: article.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null

  return (
    <main dir="rtl" className="bg-white min-h-screen">
      <LandingNav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <article className="max-w-3xl mx-auto px-5 sm:px-8 pt-32 pb-24">
        <Link href="/blog" className="text-ruwad-blue text-sm font-bold inline-flex items-center gap-1 mb-6">
          <ArrowLeft size={14} /> رجوع للمدونة
        </Link>

        <p className="text-xs text-ruwad-navy/50 font-semibold mb-3">
          {new Date(article.publishedAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
          {' · '}قراءة {article.readingMinutes} دقائق
        </p>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-ruwad-navy leading-snug mb-6">{article.title}</h1>

        <p className="text-lg text-ruwad-navy/70 leading-relaxed mb-10">{article.intro}</p>

        <div className="flex flex-col gap-8">
          {article.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl sm:text-2xl font-extrabold text-ruwad-navy mb-3">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="text-ruwad-navy/70 leading-relaxed mb-3">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        {article.faq && (
          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-extrabold text-ruwad-navy mb-5">أسئلة شائعة</h2>
            <div className="flex flex-col gap-4">
              {article.faq.map((f) => (
                <div key={f.q} className="bg-[#F5F6FA] rounded-ruwad-sm p-5">
                  <h3 className="font-extrabold text-ruwad-navy">{f.q}</h3>
                  <p className="text-ruwad-navy/70 mt-2 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-16 bg-ruwad-navy rounded-ruwad p-8 text-center">
          <p className="text-white font-extrabold text-xl mb-4">جرّب رُوّاد لإدارة معهدك الآن</p>
          <Link
            href="/register"
            className="inline-block bg-ruwad-lime text-ruwad-navy font-extrabold px-8 py-3 rounded-ruwad-sm border-2 border-ruwad-navy"
          >
            ابدأ مجاناً
          </Link>
        </div>
      </article>
    </main>
  )
}
