'use client'

import MarketingHeader from '../../components/MarketingHeader'
import MarketingFooter from '../../components/MarketingFooter'
import { ShieldAlert } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="app-shell" style={{ background: 'var(--ff-bg)', color: 'var(--ff-text)' }}>
      <MarketingHeader />

      <main style={{ maxWidth: 800, margin: '60px auto', width: '100%', padding: '0 24px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
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
      </main>

      <MarketingFooter />
    </div>
  )
}
