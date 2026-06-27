import ArchitectureDocsClient from './ArchitectureDocsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Architecture & Data Flow | FactorFi Docs',
  description: 'Explore the on-chain/off-chain architecture of FactorFi. Learn how we prevent invoice double-factoring fraud and structure gasless USDC transactions on the Arc L1 network.',
  keywords: ['Reverse Factoring Architecture', 'FactorFi Data Flow', 'Idempotency Validation', 'Arc L1 Integration Architecture', 'Circle Wallet Topology'],
  alternates: {
    canonical: 'https://factorfi.protocol/docs/architecture',
  },
  openGraph: {
    title: 'System Architecture & Data Flow | FactorFi Docs',
    description: 'Explore the on-chain/off-chain architecture of FactorFi. Learn how we prevent invoice double-factoring fraud and structure gasless USDC transactions on the Arc L1 network.',
    url: 'https://factorfi.protocol/docs/architecture',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi System Architecture',
      },
    ],
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'System Architecture & Data Flow | FactorFi Docs',
    description: 'Explore the on-chain/off-chain architecture of FactorFi. Learn how we prevent invoice double-factoring fraud and structure gasless USDC transactions on the Arc L1 network.',
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
        'name': 'System Architecture',
        'item': 'https://factorfi.protocol/docs/architecture'
      }
    ]
  }

  const techArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'headline': 'System Architecture & Data Flow | FactorFi Docs',
    'description': 'Technical system flow and architectural breakdown of the FactorFi reverse-factoring invoice finance protocol.',
    'url': 'https://factorfi.protocol/docs/architecture',
    'inLanguage': 'en-US',
    'articleSection': 'Developer Guide',
    'dependencies': 'ethers, dotenv, Arc blockchain network',
    'proficienciesRequired': 'EVM Account Abstraction, Smart Contracts, Trade Finance APIs',
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
      <ArchitectureDocsClient />
    </>
  )
}
