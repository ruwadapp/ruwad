import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/land/', '/login', '/register', '/blog', '/idarat-maahid', '/ruwad-vs-manual'],
        disallow: [
          '/dashboard', '/home', '/admin', '/org', '/students', '/courses',
          '/exams', '/surveys', '/challenges', '/assignments', '/attendance',
          '/analytics', '/rawaq', '/profile', '/progress', '/posts',
          '/presentations', '/my-courses', '/my-challenges', '/my-institute',
          '/api/', '/account-pending', '/reset-password',
        ],
      },
    ],
    sitemap: 'https://www.ruwaad.app/sitemap.xml',
  }
}
