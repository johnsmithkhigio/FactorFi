import FaqDocsClient from './FaqDocsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | FactorFi Docs',
  description: 'Read the detailed developer and business FAQ for FactorFi. Discover how Passkeys secure smart accounts, how double-factoring is prevented on-chain, and how USDC gas settlements operate.',
  keywords: ['FactorFi Docs FAQ', 'Passkey Smart Account Security', 'Invoice Double Factoring Prevention', 'USDC gas payments Arc network'],
  alternates: {
    canonical: 'https://factorfi.protocol/docs/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions | FactorFi Docs',
    description: 'Read the detailed developer and business FAQ for FactorFi. Discover how Passkeys secure smart accounts, how double-factoring is prevented on-chain, and how USDC gas settlements operate.',
    url: 'https://factorfi.protocol/docs/faq',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi FAQ Documentation',
      },
    ],
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frequently Asked Questions | FactorFi Docs',
    description: 'Read the detailed developer and business FAQ for FactorFi.',
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
        'name': 'FAQ',
        'item': 'https://factorfi.protocol/docs/faq'
      }
    ]
  }

  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is a Passkey and how does FactorFi use it?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'A Passkey is a secure login method using your device\'s biometrics (TouchID/FaceID) or PIN. FactorFi uses Passkeys to create and secure your Modular Smart Contract Account (MSCA) gaslessly. You do not need to memorize passwords or handle raw private keys.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does the protocol prevent double factoring of invoices?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Every submitted invoice metadata is hashed (keccak256) along with the supplier\'s signature. This hash is permanently registered to our Smart Contract on the Arc network. If the same hash is submitted again, the contract immediately reverts, blocking duplication fraud.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Why does the Arc network use USDC for gas?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Arc is designed from the ground up for stablecoin commerce. To eliminate the friction of acquiring native blockchain gas tokens (like ETH or MATIC) and prevent transaction fee volatility, Arc allows all gas fees to be settled directly in stable USDC.'
        }
      },
      {
        '@type': 'Question',
        'name': 'What is the dynamic discount fee rate?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'When a supplier liquidates an invoice, a small discount premium (usually between 1.5% to 3.0%) is deducted from the payout. This premium is paid out to liquidity providers who fund the vault, representing their yield return.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Are my funds locked in the smart contract?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Suppliers receive payout funds directly to their smart wallet, which are instantly spendable or withdrawable. Liquidity providers can request to withdraw their USDC from the vaults at any time, subject to a standard 24-hour withdrawal cooldown.'
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
      <FaqDocsClient />
    </>
  )
}
