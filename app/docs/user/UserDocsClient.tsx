'use client'

import React, { useState } from 'react'
import { CheckCircle, AlertCircle, FileText, Landmark, Users, TrendingUp } from 'lucide-react'

export default function UserDocsClient() {
  const [onboardingStep, setOnboardingStep] = useState(1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* 1. Introduction Header */}
      <section id="getting-started">
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
          User Documentation Hub
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ff-text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
          This hub provides easy-to-read, non-technical guidance for businesses, SME suppliers, corporate anchors, and liquidity providers utilizing FactorFi. Discover how you can unlock working capital and earn premium yield.
        </p>

        {/* What & Why Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="info-grid">
          <div className="card" style={{ padding: 24, background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Landmark size={18} style={{ color: 'var(--ff-primary)' }} /> What is FactorFi?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
              FactorFi is an on-chain trade finance protocol facilitating **decentralized reverse factoring**. We connect suppliers, anchors, and liquidity investors, allowing invoices to be liquidated instantly for stablecoin capital.
            </p>
          </div>
          
          <div className="card" style={{ padding: 24, background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--ff-success)' }} /> The Core Benefits
            </h3>
            <ul style={{ fontSize: 13, color: 'var(--ff-text-secondary)', display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 16, lineHeight: 1.4 }}>
              <li><strong>Zero Wait Times:</strong> SME suppliers receive capital in under 5 minutes rather than standard 60-90 day invoice net terms.</li>
              <li><strong>Reduced Overhead:</strong> Gasless transactions on the Arc blockchain ensure fees remain predictable and cost-efficient.</li>
              <li><strong>Verifiable History:</strong> Build an on-chain payment score to access better interest premiums.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2. Onboarding Stepper */}
      <section id="onboarding">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Step-by-Step Onboarding
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ff-text-secondary)', marginBottom: 24 }}>
          Follow this 3-step walkthrough to get your business account established and liquidate your first client invoice.
        </p>

        {/* Stepper Header */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[
            { step: 1, title: "1. Create Account" },
            { step: 2, title: "2. Underwrite Invoice" },
            { step: 3, title: "3. Settle Balances" }
          ].map(s => (
            <button
              key={s.step}
              onClick={() => setOnboardingStep(s.step)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 'var(--ff-radius-sm)',
                border: '1px solid',
                borderColor: onboardingStep === s.step ? 'var(--ff-primary)' : 'var(--ff-border)',
                background: onboardingStep === s.step ? 'var(--ff-primary-subtle)' : 'rgba(0,0,0,0.15)',
                color: onboardingStep === s.step ? 'var(--ff-primary)' : 'var(--ff-text-muted)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--ff-transition)'
              }}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Stepper Content */}
        <div className="card" style={{ padding: 24 }}>
          {onboardingStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, color: '#fff' }}>Step 1: Sign up and register biometric credentials</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
                Open the FactorFi app portal, click "Authenticate Account," and register using your device's biometric verification (Passkey). Your Modular Smart Contract Account (MSCA) is deployed automatically.
              </p>
              {/* Onboarding Mockup */}
              <div style={{ background: '#070c17', border: '1px solid var(--ff-border)', borderRadius: 8, padding: 16, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Simulated Sign-Up screen</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto', textAlign: 'center', padding: '16px 0' }}>
                  <Landmark size={32} style={{ color: 'var(--ff-primary)', margin: '0 auto' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>FactorFi Portal</div>
                  <input type="text" placeholder="Enter Company Name" disabled style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ff-border)', padding: 10, borderRadius: 6, color: 'var(--ff-text-muted)', fontSize: 12, textAlign: 'center' }} />
                  <button disabled style={{ background: 'var(--ff-primary)', border: 'none', padding: 10, borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600 }}>Create Passkey Account</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--ff-warning)', background: 'var(--ff-warning-subtle)', padding: 12, borderRadius: 6, fontSize: 12.5, marginTop: 8 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span><strong>Common Mistake:</strong> Do not clear your browser cookies/credential storage. Passkeys are tied to your browser and operating system security layer.</span>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, color: '#fff' }}>Step 2: Upload corporate anchor-approved invoice</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
                Submit your outstanding client invoices to the smart contract. Our AI Underwriter automatically checks client credit ratings and verifies the invoice signature. Once approved, the invoice is indexed on-chain.
              </p>
              {/* Underwrite Mockup */}
              <div style={{ background: '#070c17', border: '1px solid var(--ff-border)', borderRadius: 8, padding: 16, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Simulated Underwrite Dashboard</div>
                <div style={{ border: '1px dashed var(--ff-border)', padding: '24px 0', borderRadius: 6, textAlign: 'center', color: 'var(--ff-text-secondary)' }}>
                  <FileText size={24} style={{ color: 'var(--ff-text-muted)', marginBottom: 8 }} />
                  <div style={{ fontSize: 12 }}>Drag and drop anchor invoice PDF here</div>
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, color: '#fff' }}>Step 3: Receive dynamic discount stablecoin settlement</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
                Once verified, the smart contract immediately releases dynamic discount funding (USDC) from our liquidity vaults to your MSCA address. You can withdraw these funds directly to external fiat banks or bridge them to mainnets.
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--ff-success)', background: 'var(--ff-success-subtle)', padding: 12, borderRadius: 6, fontSize: 12.5 }}>
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span><strong>Pro-Tip:</strong> Set up a webhook under settings to automatically notify your ERP system when USDC funds are settled.</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Core Features (Feature -> Problem -> Solution -> Example -> Result) */}
      <section id="features">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Core Features & Workflows
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ff-text-secondary)', marginBottom: 24 }}>
          Understand how our reverse factoring system resolves key trade finance paint points.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Feature 1 */}
          <div className="card" style={{ padding: 24, borderLeft: '4px solid var(--ff-primary)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Dynamic Receivables Liquidator</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--ff-text-secondary)' }}>
              <div><strong style={{ color: '#fff' }}>Problem:</strong> Small businesses waiting 60+ days for corporate anchors to settle invoices, causing liquidity gaps.</div>
              <div><strong style={{ color: '#fff' }}>Solution:</strong> Suppliers tokenize anchor-approved invoices on the Arc chain, immediately liquidating the debt.</div>
              <div><strong style={{ color: '#fff' }}>Example:</strong> A hardware manufacturing supplier liquidates a $50,000 invoice due in 90 days.</div>
              <div><strong style={{ color: '#fff' }}>Result:</strong> The supplier receives $49,000 USDC immediately, with a 2% discount premium going to LPs.</div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="card" style={{ padding: 24, borderLeft: '4px solid var(--ff-violet)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Biometric Paymaster Gas Sponsorship</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--ff-text-secondary)' }}>
              <div><strong style={{ color: '#fff' }}>Problem:</strong> Non-crypto native managers struggling with hardware wallets, private keys, and native gas tokens.</div>
              <div><strong style={{ color: '#fff' }}>Solution:</strong> Circle User-Controlled wallets allow 1-click Passkey logins, with transactions sponsored gaslessly.</div>
              <div><strong style={{ color: '#fff' }}>Example:</strong> Anchor admin signs invoice payment confirmations using TouchID.</div>
              <div><strong style={{ color: '#fff' }}>Result:</strong> Transaction executes instantly on Arc chain without the user ever managing USDC gas tokens.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Use Cases */}
      <section id="use-cases">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Real World Use Cases
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ff-text-secondary)', marginBottom: 24 }}>
          See how distinct organizations optimize their operational capital utilizing FactorFi.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="use-cases-grid">
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} style={{ color: 'var(--ff-primary)' }} /> Startup Supplier
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              A fast-growing SaaS provider needs to meet payroll but is waiting on an enterprise client's net-60 payment. By liquidating the invoice on FactorFi, they immediately access $25,000 USDC.
            </p>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} style={{ color: 'var(--ff-violet)' }} /> Corporate Anchor
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              A major retail chain wants to strengthen their supplier network. They register on FactorFi, approving invoice debts, allowing their suppliers to fetch instant low-cost working capital.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Tutorials */}
      <section id="tutorials">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
          On-demand Tutorials
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ff-text-secondary)', marginBottom: 20 }}>
          Follow these tutorials to unlock advanced trade finance mechanisms.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <h4 style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>1. Earning Vault Yield (Beginner)</h4>
              <span style={{ fontSize: 11, background: 'rgba(52,211,153,0.1)', color: 'var(--ff-success)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Beginner</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              <strong>Goal:</strong> Provide liquidity to supplier pools. Learn how to deposit USDC into the main trade finance vault and start earning accrued interest from liquidating corporate liabilities.
            </p>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <h4 style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>2. Multi-party Underwriting Signatures (Intermediate)</h4>
              <span style={{ fontSize: 11, background: 'rgba(56,189,248,0.1)', color: 'var(--ff-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Intermediate</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              <strong>Goal:</strong> Set up multi-party approval requirements. Learn how to configure your account so that all underwritten claims above $100k require secondary signatures from compliance officers.
            </p>
          </div>
        </div>
      </section>

      {/* Global CSS Inject */}
      <style jsx>{`
        @media (max-width: 768px) {
          .info-grid, .use-cases-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
