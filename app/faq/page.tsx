import FaqClient from './FaqClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ | FactorFi — On-Chain Reverse Factoring',
  description: 'Find answers regarding on-chain invoice factoring, compliance screenings, gas abstractions, and CCTP bridging on the FactorFi protocol.',
  keywords: ['FactorFi FAQ', 'Gasless Invoice Factoring', 'USDC Settlement FAQ', 'OFAC Compliance Smart Contract', 'Double Factoring Prevention'],
  alternates: {
    canonical: 'https://factorfi.protocol/faq',
  },
  openGraph: {
    title: 'FAQ | FactorFi — On-Chain Reverse Factoring',
    description: 'Find answers regarding on-chain invoice factoring, compliance screenings, gas abstractions, and CCTP bridging on the FactorFi protocol.',
    url: 'https://factorfi.protocol/faq',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi FAQ Support',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | FactorFi — On-Chain Reverse Factoring',
    description: 'Find answers regarding on-chain invoice factoring, compliance screenings, gas abstractions, and CCTP bridging on the FactorFi protocol.',
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
        'name': 'FAQ',
        'item': 'https://factorfi.protocol/faq'
      }
    ]
  }

  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is FactorFi and who is it built for?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'FactorFi is an on-chain reverse factoring protocol deployed on the Arc network. It is built for SME suppliers seeking immediate payment on invoices, corporate anchors wanting to optimize supplier relationships, and institutional investors looking for low-risk, asset-backed yields.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Is FactorFi free to use?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Signing up, registering companies, and submitting invoices is completely free. The protocol collects a minor 0.5% settlement fee on settled invoices when the corporate anchor makes the final payout. Investors pay zero fees.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How do "Gasless Transactions" work for suppliers?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'By leveraging Arc\'s native Account Abstraction features, we implement an on-chain Paymaster. When an SME supplier registers or submits an invoice, the transaction gas costs are routed to our Paymaster contract, which sponsors the fees, shielding enterprises from purchasing L1 tokens.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Why are transactions settled in USDC?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Arc L1 network uses USDC as its native gas currency. This prevents network gas fee volatility and allows corporate finance departments to account for fees in a predictable stablecoin value.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Are these transactions compliant and secure?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Absolutely. FactorFi integrates compliance sanctions screenings (OFAC filters) via our `onlyCompliant` smart contract modifiers. Every address is screen-verified before registering, preventing non-compliant entities from accessing capital.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does the protocol prevent double-factoring fraud?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'When an invoice is signed and submitted, its unique cryptographic invoice hash is recorded in contract storage. Any attempt to upload a duplicate invoice with the same hash will be instantly reverted by the smart contract, blocking fraud on-chain.'
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />
      <FaqClient />
    </>
  )
}
