// Force Next.js dev server reload to recognize Server Component transition
import DeveloperDocsClient from './DeveloperDocsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Developer Quickstart & Network Config | FactorFi Docs',
  description: 'Integrate the FactorFi SDK, connect to the Arc L1 test network, and automate invoice settlements with Circle Developer-Controlled Wallets and CCTP.',
  keywords: ['FactorFi Developer Hub', 'Arc Testnet RPC', 'Invoice Settlement Script', 'Circle Programmable Wallets SDK', 'CCTP Bridge Code'],
  alternates: {
    canonical: 'https://factorfi.protocol/docs/developer',
  },
  openGraph: {
    title: 'Developer Quickstart & Network Config | FactorFi Docs',
    description: 'Integrate the FactorFi SDK, connect to the Arc L1 test network, and automate invoice settlements with Circle Developer-Controlled Wallets.',
    url: 'https://factorfi.protocol/docs/developer',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi Developer Hub',
      },
    ],
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer Quickstart & Network Config | FactorFi Docs',
    description: 'Integrate the FactorFi SDK, connect to the Arc L1 test network, and automate invoice settlements.',
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
        'name': 'Developer Guide',
        'item': 'https://factorfi.protocol/docs/developer'
      }
    ]
  }

  const techArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'headline': 'Developer Quickstart & Network Config | FactorFi Docs',
    'description': 'A quickstart guide showing how to set up environment configurations and deploy invoice underwriting scripts using the FactorFi SDK.',
    'url': 'https://factorfi.protocol/docs/developer',
    'inLanguage': 'en-US',
    'articleSection': 'Developer Quickstart',
    'dependencies': 'ethers, @circle-fin/user-controlled-wallets, dotenv',
    'proficienciesRequired': 'Node.js, TypeScript, Solidity, Web3',
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
      <DeveloperDocsClient />
    </>
  )
}
