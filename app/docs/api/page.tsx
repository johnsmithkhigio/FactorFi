import ApiDocsClient from './ApiDocsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference & Playground | FactorFi Docs',
  description: 'Explore the FactorFi REST API. Test requests dynamically with our interactive playground to manage corporate invoice finance pipelines, check balances, and retrieve risk metrics.',
  keywords: ['FactorFi API Reference', 'API Playground', 'Submit Invoice API', 'Get Wallet Balance API', 'REST API Sandbox'],
  alternates: {
    canonical: 'https://factorfi.protocol/docs/api',
  },
  openGraph: {
    title: 'API Reference & Playground | FactorFi Docs',
    description: 'Explore the FactorFi REST API. Test requests dynamically with our interactive playground to manage corporate invoice finance pipelines.',
    url: 'https://factorfi.protocol/docs/api',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi API Reference',
      },
    ],
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Reference & Playground | FactorFi Docs',
    description: 'Explore the FactorFi REST API and test endpoints with our interactive playground.',
    images: ['https://factorfi.protocol/og-image.png'],
  },
}

export default function Page() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://factorfi.protocol'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Docs',
        'item': 'https://factorfi.protocol/docs'
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': 'API Reference',
        'item': 'https://factorfi.protocol/docs/api'
      }
    ]
  }

  const techArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'headline': 'API Reference & Playground | FactorFi Docs',
    'description': 'REST API documentation and live playground for the FactorFi ledger and relayer endpoints.',
    'url': 'https://factorfi.protocol/docs/api',
    'inLanguage': 'en-US',
    'articleSection': 'API Docs',
    'author': {
      '@type': 'Organization',
      'name': 'FactorFi Protocol'
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleSchema) }}
      />
      <ApiDocsClient />
    </>
  )
}
