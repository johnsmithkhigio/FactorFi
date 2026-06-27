import UserDocsClient from './UserDocsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Business Onboarding & User Guides | FactorFi Docs',
  description: 'Understand the business benefits of reverse factoring. Read the step-by-step onboarding walkthrough to create accounts with Passkeys and liquidate invoices.',
  keywords: ['FactorFi User Hub', 'Reverse Factoring Guide', 'Invoice Liquidation Step-by-Step', 'Gasless Business Transactions', 'USDC Trade Finance Benefits'],
  alternates: {
    canonical: 'https://factorfi.protocol/docs/user',
  },
  openGraph: {
    title: 'Business Onboarding & User Guides | FactorFi Docs',
    description: 'Understand the business benefits of reverse factoring. Read the step-by-step onboarding walkthrough to create accounts with Passkeys and liquidate invoices.',
    url: 'https://factorfi.protocol/docs/user',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi User Onboarding Guides',
      },
    ],
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Onboarding & User Guides | FactorFi Docs',
    description: 'Understand the business benefits of reverse factoring. Read the step-by-step onboarding walkthrough.',
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
        'name': 'User Guide',
        'item': 'https://factorfi.protocol/docs/user'
      }
    ]
  }

  const learningResourceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    'headline': 'Business Onboarding & User Guides | FactorFi Docs',
    'description': 'Onboarding course explaining how to tokenize approved invoice liabilities and liquidate trade finance receivables gaslessly.',
    'url': 'https://factorfi.protocol/docs/user',
    'inLanguage': 'en-US',
    'educationalUse': 'Instruction',
    'learningResourceType': 'Guide',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(learningResourceSchema) }}
      />
      <UserDocsClient />
    </>
  )
}
