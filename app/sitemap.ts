import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://factorfi.protocol'
  
  const routes = [
    '',
    '/about',
    '/contact',
    '/faq',
    '/legal/terms',
    '/legal/privacy',
    '/docs',
    '/docs/architecture',
    '/docs/changelog',
    '/docs/status',
    '/docs/developer',
    '/docs/api',
    '/docs/examples',
    '/docs/faq',
    '/docs/support',
    '/docs/user',
  ]

  return routes.map((route) => {
    // Assign structural priorities
    let priority = 0.5
    let changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'monthly'

    if (route === '') {
      priority = 1.0
      changeFrequency = 'daily'
    } else if (route.startsWith('/docs')) {
      priority = 0.8
      changeFrequency = 'weekly'
    } else if (route.startsWith('/legal')) {
      priority = 0.3
      changeFrequency = 'yearly'
    }

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }
  })
}
