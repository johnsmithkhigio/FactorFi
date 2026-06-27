import StatusDocsClient from './StatusDocsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Status & Latency | FactorFi Docs',
  description: 'Monitor the live status, latency metrics, and API gateway uptime benchmarks for the FactorFi reverse factoring infrastructure and on-chain relayers.',
  keywords: ['FactorFi System Status', 'Smart Contract Relayer Latency', 'CCTP Bridge Watcher Uptime', 'SQLite Indexer Status'],
  alternates: {
    canonical: 'https://factorfi.protocol/docs/status',
  },
  openGraph: {
    title: 'System Status & Latency | FactorFi Docs',
    description: 'Monitor the live status, latency metrics, and API gateway uptime benchmarks for the FactorFi reverse factoring infrastructure.',
    url: 'https://factorfi.protocol/docs/status',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi System Status',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'System Status & Latency | FactorFi Docs',
    description: 'Monitor the live status, latency metrics, and API gateway uptime benchmarks for the FactorFi reverse factoring infrastructure.',
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
        'name': 'Status',
        'item': 'https://factorfi.protocol/docs/status'
      }
    ]
  }

  const statusPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://factorfi.protocol/docs/status#webpage',
    'url': 'https://factorfi.protocol/docs/status',
    'name': 'System Status | FactorFi',
    'description': 'Real-time operational status, latency benchmarks, and uptime metrics for the FactorFi protocol services.',
    'breadcrumb': {
      '@id': 'https://factorfi.protocol/docs/status#breadcrumb'
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(statusPageSchema) }}
      />
      <StatusDocsClient />
    </>
  )
}
