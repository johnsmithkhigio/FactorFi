'use client'

import { useState } from 'react'
import MarketingHeader from '../components/MarketingHeader'
import MarketingFooter from '../components/MarketingFooter'
import { BookOpen, Zap, Cpu, Key, Database, ChevronRight, Terminal, Check } from 'lucide-react'

type DocTab = 'intro' | 'quickstart' | 'mechanics' | 'circle' | 'arc'

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<DocTab>('intro')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  return (
    <div className="app-shell" style={{ background: 'var(--ff-bg)', color: 'var(--ff-text)' }}>
      <MarketingHeader />

      <main style={{ maxWidth: 1200, margin: '40px auto', width: '100%', padding: '0 24px', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 40 }} className="docs-grid">
          
          {/* Left Sidebar */}
          <aside style={{ position: 'sticky', top: 100, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 12, marginBottom: 8 }}>
              Developer Guides
            </span>

            {[
              { id: 'intro', label: 'Introduction', icon: <BookOpen size={16} /> },
              { id: 'quickstart', label: 'Quickstart', icon: <Zap size={16} /> },
              { id: 'mechanics', label: 'Core Mechanics', icon: <Cpu size={16} /> },
              { id: 'circle', label: 'Circle Integrations', icon: <Key size={16} /> },
              { id: 'arc', label: 'Arc Chain Setup', icon: <Database size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DocTab)}
                style={{
                  background: activeTab === tab.id ? 'var(--ff-primary-subtle)' : 'none',
                  border: 'none',
                  outline: 'none',
                  textAlign: 'left',
                  color: activeTab === tab.id ? 'var(--ff-primary)' : 'var(--ff-text-secondary)',
                  padding: '10px 12px',
                  borderRadius: 'var(--ff-radius-sm)',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all var(--ff-transition)'
                }}
              >
                {tab.icon}
                <span style={{ flex: 1 }}>{tab.label}</span>
                <ChevronRight size={14} style={{ opacity: activeTab === tab.id ? 1 : 0 }} />
              </button>
            ))}
          </aside>

          {/* Right Content Pane */}
          <section className="card" style={{ padding: 32, background: 'var(--ff-surface)', border: '1px solid var(--ff-border)' }}>
            {activeTab === 'intro' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Introduction</h2>
                <p style={{ color: 'var(--ff-text-secondary)', lineHeight: 1.7, fontSize: 14.5 }}>
                  FactorFi is an on-chain trade finance protocol facilitating decentralized reverse factoring on the **Arc Network**. The platform lets SME suppliers liquidate unpaid client receivables instantly for a small premium, while corporate anchors approve invoicing liabilities, and investors secure stable real-world yields.
                </p>

                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginTop: 12 }}>Why FactorFi?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="docs-intro-grid">
                  <div className="card" style={{ padding: 16, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--ff-border-subtle)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--ff-primary)', marginBottom: 6 }}>USDC Native Gas</div>
                    <div style={{ fontSize: 13, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
                      Arc is a gas-abstracted L1 chain. All transaction fees are settled in predictable stable USDC rather than native gas tokens, preventing cost volatility.
                    </div>
                  </div>
                  <div className="card" style={{ padding: 16, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--ff-border-subtle)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--ff-violet)', marginBottom: 6 }}>Account Abstraction</div>
                    <div style={{ fontSize: 13, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
                      Corporate anchors and suppliers execute transactions gaslessly using pre-funded Paymasters, eliminating keys and Web3 complexity.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'quickstart' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Quickstart Guide</h2>
                <p style={{ color: 'var(--ff-text-secondary)', lineHeight: 1.7 }}>
                  Test the smart contract invoice underwriting lifecycle on the Arc Testnet inside 3 minutes.
                </p>

                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginTop: 12 }}>Step 1: Install dependencies</h3>
                <div style={{ position: 'relative' }}>
                  <pre style={{ background: '#000', padding: '14px 16px', borderRadius: 8, overflowX: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ff-primary)' }}>
                    npm install ethers dotenv
                  </pre>
                  <button 
                    onClick={() => handleCopy('npm install ethers dotenv')}
                    style={{ position: 'absolute', right: 12, top: 11, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                  >
                    {copiedText === 'npm install ethers dotenv' ? <Check size={16} color="var(--ff-success)" /> : <Terminal size={16} />}
                  </button>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Step 2: Configure Environment</h3>
                <div style={{ position: 'relative' }}>
                  <pre style={{ background: '#000', padding: '14px 16px', borderRadius: 8, overflowX: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 12, color: '#ccc' }}>
                    {`# Arc Testnet RPC URL\nRPC_URL="https://rpc.testnet.arc.network"\n\n# Deployed FactorFi Contract\nFACTORFI_ADDRESS="0xc8d9889a6b49e96951309fc0291e652d005be3f9"`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'mechanics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Core Mechanics</h2>
                <p style={{ color: 'var(--ff-text-secondary)', lineHeight: 1.7 }}>
                  Learn how FactorFi guarantees security, stops double-factoring fraud, and distributes protocol fees.
                </p>

                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginTop: 12 }}>1. Anti-Double Factoring Signatures</h3>
                <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13.5, lineHeight: 1.6 }}>
                  SMEs sign invoice hashes before submitting. AI Underwriters verify the identity, debtor score, and signature, and cryptographically register the invoice on-chain. If an identical invoice hash is submitted again, the smart contract reverts immediately, rendering factoring duplication impossible.
                </p>

                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>2. Revenue & Fee Engine</h3>
                <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13.5, lineHeight: 1.6 }}>
                  When corporate anchors settle outstanding invoices on-chain, the protocol charges a 0.5% fee on the face value. The rest of the discounted yield goes directly to investors, and 20% of the protocol fee is distributed back to AI Underwriters to sponsor API and inference calls.
                </p>
              </div>
            )}

            {activeTab === 'circle' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Circle API Integrations</h2>
                <p style={{ color: 'var(--ff-text-secondary)', lineHeight: 1.7 }}>
                  FactorFi integrates Circle Developer and User-Controlled wallets to deliver premium corporate UX.
                </p>

                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginTop: 12 }}>1. Developer-Controlled Wallets</h3>
                <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13.5, lineHeight: 1.6 }}>
                  Corporate Anchors are assigned non-custodial Developer-Controlled wallets behind the scenes. This allows corporate managers to settle invoices using simple email confirmations, without handling private keys or RPC networks manually.
                </p>

                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>2. Cross-Chain Bridging (CCTP)</h3>
                <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13.5, lineHeight: 1.6 }}>
                  Using Circle\'s CCTP and Bridge Kit adapters, liquidity providers on Ethereum, Base, and Arbitrum can move USDC directly into Arc Testnet vaults. Source tokens are burned, and native Arc USDC is minted automatically in a single unified flow.
                </p>
              </div>
            )}

            {activeTab === 'arc' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Arc Chain Setup</h2>
                <p style={{ color: 'var(--ff-text-secondary)', lineHeight: 1.7 }}>
                  Configure your MetaMask, Rainbow, or other Web3 providers to interact with the Arc Network.
                </p>

                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: 20, border: '1px solid var(--ff-border)', fontSize: 13.5, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ff-border)', paddingBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>Network Name:</span>
                    <span style={{ color: '#fff' }}>Arc Testnet</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ff-border)', paddingBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>New RPC URL:</span>
                    <span style={{ color: '#fff', fontFamily: 'var(--ff-mono)', fontSize: 12 }}>https://rpc.testnet.arc.network</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ff-border)', paddingBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>Chain ID:</span>
                    <span style={{ color: '#fff' }}>5042002</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ff-border)', paddingBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>Currency Symbol:</span>
                    <span style={{ color: '#fff' }}>USDC</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>Block Explorer:</span>
                    <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ff-primary)' }}>testnet.arcscan.app</a>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <MarketingFooter />

      <style jsx global>{`
        @media (max-width: 768px) {
          .docs-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .docs-intro-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
