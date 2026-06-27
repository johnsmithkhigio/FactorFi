import ExamplesDocsClient from './ExamplesDocsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Code Integration Examples | FactorFi Docs',
  description: 'Copy and paste integration samples for TypeScript, Python, Go, and Rust. Learn how to deposit USDC liquidity, sign invoice hashes, and handle payments verification webhooks.',
  keywords: ['FactorFi Code Snippets', 'Deposit USDC Script', 'Invoice Hash Signer Go', 'Webhook HMAC Verification Python', 'Rust Smart Contract Call'],
  alternates: {
    canonical: 'https://factorfi.protocol/docs/examples',
  },
  openGraph: {
    title: 'Code Integration Examples | FactorFi Docs',
    description: 'Copy and paste integration samples for TypeScript, Python, Go, and Rust. Learn how to deposit USDC liquidity, sign invoice hashes, and handle payments verification webhooks.',
    url: 'https://factorfi.protocol/docs/examples',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi Code Examples',
      },
    ],
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Code Integration Examples | FactorFi Docs',
    description: 'Copy and paste integration samples for TypeScript, Python, Go, and Rust.',
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
        'name': 'Code Examples',
        'item': 'https://factorfi.protocol/docs/examples'
      }
    ]
  }

  const techArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'headline': 'Code Integration Examples | FactorFi Docs',
    'description': 'Production-ready code samples in TypeScript, Python, Go, and Rust for interacting with the FactorFi smart contracts.',
    'url': 'https://factorfi.protocol/docs/examples',
    'inLanguage': 'en-US',
    'articleSection': 'Developer SDK Examples',
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
      <ExamplesDocsClient />
    </>
  )
}
