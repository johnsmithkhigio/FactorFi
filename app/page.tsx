import HomeClient from './home-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FactorFi — Reverse Factoring Protocol on Arc',
  description: 'On-chain reverse factoring platform. Anchor companies pre-approve supplier invoices. Investors fund receivables for instant yield. Built on Arc with USDC settlement, compliance, and gas abstraction.',
  keywords: ['Reverse Factoring', 'FactorFi', 'Trade Finance', 'USDC', 'Arc Blockchain', 'DeFi', 'Invoice Factoring', 'Account Abstraction', 'Circle Developer Wallets'],
  alternates: {
    canonical: 'https://factorfi.protocol',
  },
  openGraph: {
    title: 'FactorFi — Reverse Factoring Protocol on Arc',
    description: 'On-chain reverse factoring platform. Anchor companies pre-approve supplier invoices. Investors fund receivables for instant yield. Built on Arc with USDC settlement.',
    url: 'https://factorfi.protocol',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi On-Chain Reverse Factoring Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FactorFi — Reverse Factoring Protocol on Arc',
    description: 'On-chain reverse factoring platform. Anchor companies pre-approve supplier invoices. Investors fund receivables for instant yield.',
    images: ['https://factorfi.protocol/og-image.png'],
    creator: '@FactorFiProtocol',
  },
}

export default function Page() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'FactorFi',
    'url': 'https://factorfi.protocol',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://factorfi.protocol/docs?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'FactorFi App',
    'url': 'https://factorfi.protocol',
    'applicationCategory': 'FinanceApplication',
    'operatingSystem': 'Web',
    'description': 'On-chain reverse factoring protocol that optimizes global trade finance using USDC and gas abstraction on the Arc blockchain.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    },
    'author': {
      '@type': 'Organization',
      'name': 'FactorFi',
      'logo': 'https://factorfi.protocol/favicon.png'
    }
  }

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'FactorFi',
    'url': 'https://factorfi.protocol',
    'logo': 'https://factorfi.protocol/favicon.png',
    'sameAs': [
      'https://github.com/johnsmithkhigio/FactorFi',
      'https://twitter.com/FactorFiProtocol'
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <HomeClient />
    </>
  )
}
