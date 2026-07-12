import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ARTICLES } from '@/lib/content/articles'

const SITE_URL = 'https://www.ruwaad.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, updated_at')
    .eq('status', 'published')

  const courseEntries: MetadataRoute.Sitemap = (courses ?? []).map((c) => ({
    url: `${SITE_URL}/land/${c.id}`,
    lastModified: c.updated_at ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const articleEntries: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${SITE_URL}/blog/${a.slug}`,
    lastModified: a.updatedAt ?? a.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/idarat-maahid`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/ruwad-vs-manual`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/register`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/login`, changeFrequency: 'monthly', priority: 0.3 },
    ...articleEntries,
    ...courseEntries,
  ]
}
