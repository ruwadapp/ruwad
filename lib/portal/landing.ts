// أنواع محتوى صفحة الهبوط + الافتراضيات — مشتركة بين الصفحة العامة ومحرر السوبر أدمن

export interface LandingSections {
  hero: boolean
  stats: boolean
  courses: boolean
  about: boolean
  news: boolean
  testimonials: boolean
  cta: boolean
  inquiry: boolean
}

export interface LandingContent {
  sections: LandingSections
  hero: {
    headline: string
    tagline: string
    cta_text: string
    slides: string[]
    slide_interval_s: number
  }
  stats: {
    auto: boolean
    manual: { label: string; value: string }[]
  }
  about: { title: string; body: string; image_url: string }
  testimonials: { name: string; role: string; text: string; avatar_url: string }[]
  cta: { title: string; subtitle: string; button_text: string }
  footer: {
    phone: string
    email: string
    address: string
    socials: { facebook: string; instagram: string; whatsapp: string; telegram: string; youtube: string }
  }
}

export const DEFAULT_LANDING: LandingContent = {
  sections: { hero: true, stats: true, courses: true, about: true, news: true, testimonials: false, cta: true, inquiry: true },
  hero: { headline: '', tagline: '', cta_text: 'سجّل الآن', slides: [], slide_interval_s: 5 },
  stats: { auto: true, manual: [] },
  about: { title: 'من نحن', body: '', image_url: '' },
  testimonials: [],
  cta: { title: '', subtitle: '', button_text: 'ابدأ رحلتك التدريبية' },
  footer: { phone: '', email: '', address: '', socials: { facebook: '', instagram: '', whatsapp: '', telegram: '', youtube: '' } },
}

// دمج عميق آمن لما هو محفوظ فوق الافتراضيات (يتحمل jsonb ناقصاً أو قديم البنية)
export function mergeLanding(saved: unknown): LandingContent {
  const s = (saved ?? {}) as Partial<LandingContent>
  return {
    sections: { ...DEFAULT_LANDING.sections, ...(s.sections ?? {}) },
    hero: { ...DEFAULT_LANDING.hero, ...(s.hero ?? {}), slides: Array.isArray(s.hero?.slides) ? s.hero!.slides.filter((x): x is string => typeof x === 'string') : [] },
    stats: {
      auto: s.stats?.auto ?? true,
      manual: Array.isArray(s.stats?.manual) ? s.stats!.manual.filter((m) => m && typeof m.label === 'string' && typeof m.value === 'string') : [],
    },
    about: { ...DEFAULT_LANDING.about, ...(s.about ?? {}) },
    testimonials: Array.isArray(s.testimonials)
      ? s.testimonials.filter((t) => t && typeof t.text === 'string').map((t) => ({ name: t.name ?? '', role: t.role ?? '', text: t.text, avatar_url: t.avatar_url ?? '' }))
      : [],
    cta: { ...DEFAULT_LANDING.cta, ...(s.cta ?? {}) },
    footer: {
      ...DEFAULT_LANDING.footer,
      ...(s.footer ?? {}),
      socials: { ...DEFAULT_LANDING.footer.socials, ...(s.footer?.socials ?? {}) },
    },
  }
}
