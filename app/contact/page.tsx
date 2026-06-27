import ContactClient from './ContactClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Support | FactorFi — On-Chain Reverse Factoring',
  description: 'Get in touch with the FactorFi protocol core team. Submit a ticket for technical support, bug reports, feature requests, or partnership inquiries regarding on-chain reverse factoring on Arc.',
  keywords: ['Contact FactorFi', 'FactorFi Support', 'Smart Wallet Help', 'On-Chain Factoring Support', 'Technical Channels', 'Bug Reports'],
  alternates: {
    canonical: 'https://factorfi.protocol/contact',
  },
  openGraph: {
    title: 'Contact Support | FactorFi — On-Chain Reverse Factoring',
    description: 'Get in touch with the FactorFi protocol core team. Submit a ticket for technical support, bug reports, feature requests, or partnership inquiries.',
    url: 'https://factorfi.protocol/contact',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Contact FactorFi Support',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Support | FactorFi — On-Chain Reverse Factoring',
    description: 'Get in touch with the FactorFi protocol core team. Submit a ticket for technical support, bug reports, feature requests, or partnership inquiries.',
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
        'name': 'Contact Support',
        'item': 'https://factorfi.protocol/contact'
      }
    ]
  }

  const contactPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': 'https://factorfi.protocol/contact#webpage',
    'url': 'https://factorfi.protocol/contact',
    'name': 'Contact Support | FactorFi',
    'description': 'Contact the FactorFi protocol core team for technical support, bug reports, or partnership inquiries.',
    'breadcrumb': {
      '@id': 'https://factorfi.protocol/contact#breadcrumb'
    },
    'mainEntity': {
      '@type': 'Organization',
      'name': 'FactorFi Protocol',
      'logo': 'https://factorfi.protocol/favicon.png',
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'technical support',
        'email': 'support@factorfi.protocol',
        'url': 'https://factorfi.protocol/contact'
      }
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <ContactClient />
    </>
  )
}
