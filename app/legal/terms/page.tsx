'use client'

import MarketingHeader from '../../components/MarketingHeader'
import MarketingFooter from '../../components/MarketingFooter'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="app-shell" style={{ background: 'var(--ff-bg)', color: 'var(--ff-text)' }}>
      <MarketingHeader />

      <main style={{ maxWidth: 800, margin: '60px auto', width: '100%', padding: '0 24px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <FileText size={28} color="var(--ff-primary)" />
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Terms of Service</h2>
        </div>
        <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginBottom: 32 }}>Last updated: June 20, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 14, lineHeight: 1.7, color: 'var(--ff-text-secondary)' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>1. Acceptable Protocol Usage</h3>
            <p>
              By using FactorFi, you verify that you are acting as an authorized corporate manager of the corresponding supplier or anchor debtor. You are solely responsible for verifying the authenticity of invoice details submitted on-chain. Falsified invoice reporting or double-factoring attempts represent fraudulent commercial actions.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>2. Protocol Yield & Asset-Backed Vaults</h3>
            <p>
              Investors funding invoices through the FactorFi pools understand that factoring yields are tied directly to the credit risk of the underlying debtor anchors. Protocol operations, OCR validations, and on-chain parameters do not represent financial advisory. Past performance does not guarantee future results.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>3. Smart Contract Interactions</h3>
            <p>
              The smart contracts executing invoice validation, payouts, and settlements are deployed open-source on the Arc Testnet. Users assume all risk regarding transaction broadcast failures, consensus delays, or key management faults on local Web3 providers.
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
