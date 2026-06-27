'use client'

import Link from 'next/link'
import { BookOpen, Terminal, ShieldCheck, Zap, Layers, ArrowRight } from 'lucide-react'

export default function DocsLandingClient() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {/* Hero Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(167, 139, 250, 0.03) 100%)',
        border: '1px solid var(--ff-border)',
        borderRadius: 'var(--ff-radius-lg)',
        padding: '48px 40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative glows */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: 300,
          height: 300,
          background: 'var(--ff-primary-glow)',
          filter: 'blur(80px)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
          FactorFi Documentation Portal
        </h1>
        <p style={{ fontSize: 15.5, color: 'var(--ff-text-secondary)', lineHeight: 1.6, maxWidth: 640 }}>
          Welcome to the FactorFi trade finance resources center. Explore our separated onboarding paths for business administrators, treasury desks, and technical integration engineers.
        </p>
      </div>

      {/* Two main Hub selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="hubs-grid">
        {/* User Hub */}
        <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 'var(--ff-radius-sm)', 
            background: 'var(--ff-primary-subtle)', 
            color: 'var(--ff-primary)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: 20 
          }}>
            <BookOpen size={22} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 8 }}>User Documentation Hub</h2>
          <p style={{ fontSize: 13.5, color: 'var(--ff-text-secondary)', lineHeight: 1.6, marginBottom: 24, flex: 1 }}>
            Perfect for business owners, corporate anchors, SME suppliers, and liquidity investors. Learn how to onboard your business, submit invoice receivable documents, and earn high-yield returns.
          </p>
          <Link href="/docs/user" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Go to User Hub <ArrowRight size={14} />
          </Link>
        </div>

        {/* Developer Hub */}
        <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 'var(--ff-radius-sm)', 
            background: 'rgba(167, 139, 250, 0.12)', 
            color: 'var(--ff-violet)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: 20 
          }}>
            <Terminal size={22} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Developer Hub & API Reference</h2>
          <p style={{ fontSize: 13.5, color: 'var(--ff-text-secondary)', lineHeight: 1.6, marginBottom: 24, flex: 1 }}>
            Access our RPC nodes, smart contract addresses, SDK methods, webhooks payloads, and interactive API sandbox. Implement automated invoice discounting flows under 10 minutes.
          </p>
          <Link href="/docs/developer" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
            Go to Developer Hub <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Core Protocol Pillars */}
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Core Protocol Pillars</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="pillars-grid">
          <div className="card" style={{ padding: 20, background: 'rgba(255,255,255,0.01)', borderColor: 'var(--ff-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <ShieldCheck size={18} style={{ color: 'var(--ff-primary)' }} />
              <h4 style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>Reverse Factoring Escrow</h4>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              Anchor-approved invoice liabilities are tokenized as smart contract debt. Liquidation funds are held securely until anchor repayment.
            </p>
          </div>

          <div className="card" style={{ padding: 20, background: 'rgba(255,255,255,0.01)', borderColor: 'var(--ff-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Zap size={18} style={{ color: 'var(--ff-violet)' }} />
              <h4 style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>Zap Chain Gas Abstraction</h4>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              All fees are settled in dollar-pegged stable USDC. No other native tokens are required to pay gas, creating smooth operational flows.
            </p>
          </div>

          <div className="card" style={{ padding: 20, background: 'rgba(255,255,255,0.01)', borderColor: 'var(--ff-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Layers size={18} style={{ color: 'var(--ff-success)' }} />
              <h4 style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>Circle Wallet Infrastructures</h4>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              Developer-Controlled Wallets abstract private keys. Non-crypto suppliers sign transactions gaslessly via pre-configured Paymasters.
            </p>
          </div>
        </div>
      </div>

      {/* Global CSS Inject */}
      <style jsx>{`
        @media (max-width: 768px) {
          .hubs-grid, .pillars-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
