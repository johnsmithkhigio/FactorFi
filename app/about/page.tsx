import AboutClient from './AboutClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | FactorFi — On-Chain Reverse Factoring',
  description: 'Learn about FactorFi\'s mission to democratize global trade finance. We build transparent, frictionless invoice factoring using USDC native gas, compliance check screening, and smart wallets on the Arc network.',
  keywords: ['About FactorFi', 'Trade Finance Mission', 'Alex Carter', 'Sarah Lin', 'Frictionless Lending', 'On-Chain Attestation', 'Gas Abstraction'],
  alternates: {
    canonical: 'https://factorfi.protocol/about',
  },
  openGraph: {
    title: 'About Us | FactorFi — On-Chain Reverse Factoring',
    description: 'Learn about FactorFi\'s mission to democratize global trade finance using USDC native gas, compliance check screening, and smart wallets on the Arc network.',
    url: 'https://factorfi.protocol/about',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'About FactorFi Protocol',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | FactorFi — On-Chain Reverse Factoring',
    description: 'Learn about FactorFi\'s mission to democratize global trade finance using USDC native gas, compliance check screening, and smart wallets on the Arc network.',
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
        'name': 'About Us',
        'item': 'https://factorfi.protocol/about'
      }
    ]
  }

  const aboutPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': 'https://factorfi.protocol/about#webpage',
    'url': 'https://factorfi.protocol/about',
    'name': 'About Us | FactorFi',
    'description': 'Learn about FactorFi\'s mission to democratize global trade finance using smart wallets and stablecoins on the Arc blockchain.',
    'breadcrumb': {
      '@id': 'https://factorfi.protocol/about#breadcrumb'
    },
    'mainEntity': {
      '@type': 'Organization',
      'name': 'FactorFi Protocol',
      'logo': 'https://factorfi.protocol/favicon.png',
      'description': 'A decentralized reverse-factoring invoice finance protocol on the Arc blockchain.'
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
      <AboutClient />
    </>
  )
}
