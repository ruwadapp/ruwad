import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/register`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/login`, changeFrequency: 'monthly', priority: 0.3 },
    ...courseEntries,
  ]
}
