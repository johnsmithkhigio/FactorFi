'use client'

import MarketingHeader from '../components/MarketingHeader'
import MarketingFooter from '../components/MarketingFooter'
import Breadcrumbs from '../components/Breadcrumbs'
import CtaSystem from '../components/CtaSystem'
import RelatedContent from '../components/RelatedContent'
import { Landmark, Compass, Award, ExternalLink, Github, Users, Target } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="app-shell" style={{ background: 'var(--ff-bg)', color: 'var(--ff-text)' }}>
      <MarketingHeader />

      <main id="main-content" style={{ maxWidth: 1000, margin: '20px auto 60px', width: '100%', padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 40 }}>
        <Breadcrumbs />
        
        {/* Story Intro */}
        <section style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ff-primary-subtle)', border: '1px solid var(--ff-primary)', padding: '6px 14px', borderRadius: 20, marginBottom: 20 }}>
            <Target size={14} color="var(--ff-primary)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Our Mission</span>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Democratizing Global Trade Finance
          </h2>
          <p style={{ color: 'var(--ff-text-secondary)', fontSize: 15, marginTop: 12, maxWidth: 640, margin: '12px auto 0', lineHeight: 1.7 }}>
            Trade finance has historically been dominated by traditional banks extracting high interest spreads. FactorFi was founded to return control to SME suppliers. By combining USDC native gas, circle attestation, and smart accounts, we create a transparent, frictionless factoring pipeline.
          </p>
        </section>

        {/* Values grid */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 18 }}>Core Value Systems</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="about-values-grid">
            
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--ff-surface)', border: '1px solid var(--ff-border)' }}>
              <Landmark size={24} color="var(--ff-primary)" />
              <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>Frictionless Lending</div>
              <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                Eliminating intermediary brokers. Suppliers receive capital directly from liquidity pools in sub-seconds.
              </p>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--ff-surface)', border: '1px solid var(--ff-border)' }}>
              <Compass size={24} color="var(--ff-violet)" />
              <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>Gas Abstraction</div>
              <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                Sponsoring transaction gas through Paymasters to ensure enterprise finance teams interact with Web3 without operational friction.
              </p>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--ff-surface)', border: '1px solid var(--ff-border)' }}>
              <Award size={24} color="var(--ff-success)" />
              <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>On-Chain Attestation</div>
              <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                Validating compliance OFAC checks and locking invoice hashes on state storage to prevent double-factoring.
              </p>
            </div>

          </div>
        </section>

        {/* Hackathon Origins */}
        <section className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.04) 0%, transparent 100%)', 
          border: '1px solid var(--ff-border)', padding: 32, display: 'flex', flexDirection: 'column', gap: 16 
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>From Hackathon Concept to Global Platform</h3>
          <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13.5, lineHeight: 1.7 }}>
            FactorFi originated during the Stablecoins Commerce Stack Challenge as a protocol attempting to solve invoice factoring friction. Recognizing that corporate CFOs were blocked from Web3 by gas logistics, we leveraged Arc\'s native USDC gas model and built a zero-gas account abstraction relayer. Over a few weeks, we refactored mock libraries into live Circle integrations, proving that real-world trade invoicing can operate securely on-chain.
          </p>
        </section>

        {/* Team Members */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} color="var(--ff-primary)" />
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 18 }}>The Founding Team</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="about-team-grid">
            
            <div className="card" style={{ background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ff-primary) 0%, var(--ff-violet) 100%)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>Alex Carter</div>
                <div style={{ fontSize: 12, color: 'var(--ff-primary)', fontWeight: 500, marginBottom: 8 }}>Smart Contract Architect</div>
                <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                  Ex-Coinbase protocol engineer specializing in EVM account abstraction, gas optimization, and liquidity vaults.
                </p>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ff-violet) 0%, var(--ff-success) 100%)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>Sarah Lin</div>
                <div style={{ fontSize: 12, color: 'var(--ff-violet)', fontWeight: 500, marginBottom: 8 }}>Integration & Security Lead</div>
                <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                  Ex-Circle API engineer focusing on Developer Wallets configuration, client authentication, and payment rails.
                </p>
              </div>
            </div>

          </div>
        </section>

        <CtaSystem variant="general" layout="banner" />
        <RelatedContent currentPage="about" />

      </main>

      <MarketingFooter />

      <style jsx global>{`
        @media (max-width: 768px) {
          .about-values-grid {
            grid-template-columns: 1fr !important;
          }
          .about-team-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
