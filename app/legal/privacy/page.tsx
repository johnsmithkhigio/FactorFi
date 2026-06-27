import MarketingHeader from '../../components/MarketingHeader'
import MarketingFooter from '../../components/MarketingFooter'
import Breadcrumbs from '../../components/Breadcrumbs'
import RelatedContent from '../../components/RelatedContent'
import { ShieldAlert } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | FactorFi — On-Chain Reverse Factoring',
  description: 'Read the privacy policy of FactorFi to understand how transaction metadata, compliance screening, and off-chain invoice ingestion are handled on the Arc network.',
  keywords: ['Privacy Policy', 'Data Security', 'On-Chain Hashing', 'OFAC Screening Data', 'Arc Ledger Privacy'],
  alternates: {
    canonical: 'https://factorfi.protocol/legal/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | FactorFi — On-Chain Reverse Factoring',
    description: 'Read the privacy policy of FactorFi to understand how transaction metadata, compliance screening, and off-chain invoice ingestion are handled on the Arc network.',
    url: 'https://factorfi.protocol/legal/privacy',
    siteName: 'FactorFi Protocol',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | FactorFi — On-Chain Reverse Factoring',
    description: 'Read the privacy policy of FactorFi to understand how data is processed on the Arc network.',
  },
}

export default function PrivacyPage() {
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
        'name': 'Privacy Policy',
        'item': 'https://factorfi.protocol/legal/privacy'
      }
    ]
  }

  const privacyPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://factorfi.protocol/legal/privacy#webpage',
    'url': 'https://factorfi.protocol/legal/privacy',
    'name': 'Privacy Policy | FactorFi',
    'description': 'Understand how data hashing, compliance screening, and database storage are handled on the FactorFi platform.',
    'breadcrumb': {
      '@id': 'https://factorfi.protocol/legal/privacy#breadcrumb'
    }
  }

  return (
    <div className="app-shell" style={{ background: 'var(--ff-bg)', color: 'var(--ff-text)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyPageSchema) }}
      />
      <MarketingHeader />

      <main id="main-content" style={{ maxWidth: 800, margin: '20px auto 60px', width: '100%', padding: '0 24px', flex: 1 }}>
        <Breadcrumbs />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, marginTop: 20 }}>
          <ShieldAlert size={28} color="var(--ff-primary)" />
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Privacy Policy</h2>
        </div>
        <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginBottom: 32 }}>Last updated: June 20, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 14, lineHeight: 1.7, color: 'var(--ff-text-secondary)' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>1. Data Storage on the Arc Blockchain</h3>
            <p>
              FactorFi operates as a decentralized software protocol deployed on the Arc blockchain network. By interacting with our smart contracts, transaction metadata (such as invoice values, debtor wallet addresses, and repayment deadlines) is recorded permanently on the public ledger. Private details are hashed locally, storing only their cryptographic hashes to prevent double-factoring.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>2. Off-Chain Document Ingestion</h3>
            <p>
              When uploading invoice PDFs or files for automated OCR underwriting, the source documents are parsed in secure memory sandboxes. Only invoice balances and company registrations are written to the on-chain states. We do not store raw PDF files or unencrypted tax IDs on persistent databases.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>3. Web3 Analytics & Compliance</h3>
            <p>
              To maintain compliance under regulatory guidelines, wallet addresses connecting to FactorFi are checked against compliant sanction indexes (including OFAC lists) using secure third-party compliance endpoints. No IP logging or location history is cross-referenced with your corporate identities.
            </p>
          </div>
        </section>

        <RelatedContent currentPage="privacy" />

      </main>

      <MarketingFooter />
    </div>
  )
}
