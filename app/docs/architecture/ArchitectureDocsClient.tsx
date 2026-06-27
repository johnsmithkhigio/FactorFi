'use client'

import React from 'react'
import { ArrowRight, ShieldCheck, Cpu } from 'lucide-react'

export default function ArchitectureDocsClient() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
          System Architecture & Topology
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
          Discover the core infrastructure behind FactorFi. Read about our on-chain/off-chain data integrations, security parameters, and how we leverage the Arc L1 blockchain.
        </p>
      </div>

      {/* 1. System Flow Chart (CSS Mockup Diagram) */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 20 }}>
          Reverse Factoring Lifecycle Data Flow
        </h2>
        
        <div style={{
          background: 'rgba(0,0,0,0.15)',
          border: '1px solid var(--ff-border)',
          borderRadius: 'var(--ff-radius-lg)',
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24
        }}>
          {/* Step 1 Box */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: '100%', maxWidth: 640 }} className="flow-step">
            <div style={{ 
              background: 'var(--ff-primary-subtle)', 
              color: 'var(--ff-primary)',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 8,
              padding: 16,
              flex: 1,
              textAlign: 'center'
            }}>
              <h4 style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', marginBottom: 4 }}>1. Invoice Underwrite Submission</h4>
              <p style={{ fontSize: 11, color: 'var(--ff-text-secondary)' }}>Supplier registers approved invoice metadata to database, signing it via WebAuthn Passkeys.</p>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--ff-text-muted)' }} className="flow-arrow" />
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--ff-border)',
              borderRadius: 8,
              padding: 16,
              flex: 1,
              textAlign: 'center'
            }}>
              <h4 style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', marginBottom: 4 }}>2. Risk Assessment Scan</h4>
              <p style={{ fontSize: 11, color: 'var(--ff-text-secondary)' }}>AI Underwriter triggers credit rating screening and issues a secure risk rating score (A+ to C-).</p>
            </div>
          </div>

          <div style={{ height: 20, width: 2, background: 'var(--ff-border)' }} className="flow-connector" />

          {/* Step 2 Box */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: '100%', maxWidth: 640 }} className="flow-step">
            <div style={{ 
              background: 'rgba(167,139,250,0.12)', 
              color: 'var(--ff-violet)',
              border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: 8,
              padding: 16,
              flex: 1,
              textAlign: 'center'
            }}>
              <h4 style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', marginBottom: 4 }}>3. On-Chain Registry Record</h4>
              <p style={{ fontSize: 11, color: 'var(--ff-text-secondary)' }}>Invoice hash is permanently registered to the smart contract on Arc Testnet to prevent double factoring.</p>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--ff-text-muted)' }} className="flow-arrow" />
            <div style={{ 
              background: 'rgba(52,211,153,0.12)', 
              color: 'var(--ff-success)',
              border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 8,
              padding: 16,
              flex: 1,
              textAlign: 'center'
            }}>
              <h4 style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', marginBottom: 4 }}>4. Dynamic Liquidation Release</h4>
              <p style={{ fontSize: 11, color: 'var(--ff-text-secondary)' }}>Liquidity pool vault releases dynamic discounted funding in USDC directly to the supplier's smart wallet.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Security Model */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Security & Verification Standards
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ff-text-secondary)', marginBottom: 20 }}>
          FactorFi employs multi-layered cryptographic safeguards to protect vaults against flash loan claims, duplicate factoring fraud, and unauthorized withdrawals.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="info-grid">
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 15, color: '#fff', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} style={{ color: 'var(--ff-success)' }} /> Cryptographic Idempotency
            </h4>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              By computing keccak256 hashes of the invoice ID, supplier signature, and amount, the smart contract prevents double factoring. Any attempt to underwrite the same invoice twice will revert immediately.
            </p>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 15, color: '#fff', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={18} style={{ color: 'var(--ff-primary)' }} /> Non-Custodial Multi-Sig
            </h4>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              Treasury vaults utilize multi-signature ownership structures. Relayers only execute transactions pre-authorized and signed by both the validation nodes and anchor admins.
            </p>
          </div>
        </div>
      </section>

      {/* Global CSS Inject */}
      <style jsx>{`
        @media (max-width: 768px) {
          .flow-step {
            flex-direction: column !important;
          }
          .flow-arrow {
            transform: rotate(90deg);
          }
          .info-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
