import SupportDocsClient from './SupportDocsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support & Community | FactorFi Docs',
  description: 'Submit technical developer support tickets or connect with the global trade finance community. Get direct support for RPC configurations and smart account troubleshooting.',
  keywords: ['FactorFi Support', 'Developer Community Discord', 'Technical Tickets Hub', 'Smart Contract Relayer Support'],
  alternates: {
    canonical: 'https://factorfi.protocol/docs/support',
  },
  openGraph: {
    title: 'Support & Community | FactorFi Docs',
    description: 'Submit technical developer support tickets or connect with the global trade finance community. Get direct support for RPC configurations and smart account troubleshooting.',
    url: 'https://factorfi.protocol/docs/support',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi Support Hub',
      },
    ],
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support & Community | FactorFi Docs',
    description: 'Submit technical developer support tickets or connect with the global trade finance community.',
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
        'name': 'Support',
        'item': 'https://factorfi.protocol/docs/support'
      }
    ]
  }

  const supportPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://factorfi.protocol/docs/support#webpage',
    'url': 'https://factorfi.protocol/docs/support',
    'name': 'Support Hub | FactorFi',
    'description': 'Contact the developer experience team or join community discussions for FactorFi.',
    'breadcrumb': {
      '@id': 'https://factorfi.protocol/docs/support#breadcrumb'
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(supportPageSchema) }}
      />
      <SupportDocsClient />
    </>
  )
}
