import DocsLandingClient from './DocsLandingClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation Portal | FactorFi — On-Chain Reverse Factoring',
  description: 'Welcome to the FactorFi trade finance resources center. Explore user guides, developer quickstarts, smart contract APIs, and architectural designs on the Arc network.',
  keywords: ['FactorFi Documentation', 'Invoice Factoring Guide', 'Developer Hub', 'Circle Integration API', 'Smart Contract Architecture'],
  alternates: {
    canonical: 'https://factorfi.protocol/docs',
  },
  openGraph: {
    title: 'Documentation Portal | FactorFi — On-Chain Reverse Factoring',
    description: 'Explore user guides, developer quickstarts, smart contract APIs, and architectural designs on the Arc network.',
    url: 'https://factorfi.protocol/docs',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi Documentation',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Documentation Portal | FactorFi — On-Chain Reverse Factoring',
    description: 'Explore user guides, developer quickstarts, smart contract APIs, and architectural designs on the Arc network.',
    images: ['https://factorfi.protocol/og-image.png'],
  },
}

export default function DocsLandingPage() {
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
        'name': 'Documentation',
        'item': 'https://factorfi.protocol/docs'
      }
    ]
  }

  const docsPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://factorfi.protocol/docs#webpage',
    'url': 'https://factorfi.protocol/docs',
    'name': 'Documentation Portal | FactorFi',
    'description': 'Central hub for business user onboarding and technical integration developer resources at FactorFi.',
    'breadcrumb': {
      '@id': 'https://factorfi.protocol/docs#breadcrumb'
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(docsPageSchema) }}
      />
      <DocsLandingClient />
    </>
  )
}
