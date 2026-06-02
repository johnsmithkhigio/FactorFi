'use client'

import { useState } from 'react'
import { 
  Zap, BrainCircuit, ArrowRight, CheckCircle2, ChevronRight, HelpCircle, 
  Terminal, ShieldCheck, Mail, Users, Star, BookOpen, Search, Code, Cpu 
} from 'lucide-react'
import { toast } from 'sonner'

interface LandingViewProps {
  onLaunchApp: (view: 'dashboard' | 'supplier' | 'anchor' | 'investor' | 'bridge' | 'credit') => void
}

export default function LandingView({ onLaunchApp }: LandingViewProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // FAQ Interactive State
  const [faqSearch, setFaqSearch] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Docs Simple Navigation
  const [docTab, setDocTab] = useState<'intro' | 'start' | 'contracts'>('intro')

  const faqs = [
    {
      q: 'What is FactorFi and how does it work?',
      a: 'FactorFi is a decentralized reverse factoring protocol deployed on the Arc network. It allows SME suppliers to get immediate cash payouts for their outstanding invoices at a small discount, while institutional investors earn predictable real-world yields funded directly by creditworthy corporate anchors.'
    },
    {
      q: 'Why does FactorFi use the Arc L1 blockchain?',
      a: 'Arc is Circle\'s purpose-built L1 chain where USDC is the native gas token. By building on Arc, we bypass standard Web3 gas volatility. SMEs and corporate anchors pay all transaction fees in stable, predictable USDC, enabling completely gas-less transactions funded via enterprise paymasters.'
    },
    {
      q: 'How does the Paymaster enable "Gasless Transactions"?',
      a: 'Through Account Abstraction on Arc, FactorFi hosts an automated Gas Station Paymaster. When an SME supplier submits an invoice, the paymaster intercepts the transaction hash, pays the USDC gas fees behind the scenes, and broadcasts the sponsored transaction to the blockchain instantly.'
    },
    {
      q: 'Is my corporate financial data secure on-chain?',
      a: 'Yes. While all factoring payouts, settlements, and credit passport histories are recorded transparently on-chain, private client metadata (like product descriptions or invoice files) is processed off-chain through secure agents, recording only cryptographic hashes and base credentials to prevent double-factoring fraud.'
    },
    {
      q: 'How do investors bridge capital to FactorFi?',
      a: 'FactorFi integrates Circle\'s Cross-Chain Transfer Protocol (CCTP) and App Kit. Investors from Ethereum Sepolia, Base, or Arbitrum can deposit standard USDC. The protocol burns the source tokens and mints native USDC on Arc Testnet, providing a unified, instant bridging experience.'
    }
  ]

  const filteredFaqs = faqs.filter(
    f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
         f.a.toLowerCase().includes(faqSearch.toLowerCase())
  )

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter a valid email address.')
    setIsSubmitting(true)
    
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      toast.success('You have successfully joined the FactorFi elite waitlist!', {
        description: 'We will notify you as soon as the mainnet custody module launches.'
      })
    }, 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 64, maxWidth: 1200, margin: '0 auto', paddingBottom: 48 }}>
      
      {/* 1. HERO SECTION */}
      <section style={{ textAlign: 'center', padding: '48px 0', position: 'relative' }}>
        <div style={{ 
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: '300px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 60%)',
          zIndex: -1, pointerEvents: 'none'
        }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ff-primary-subtle)', border: '1px solid var(--ff-primary)', padding: '6px 14px', borderRadius: 20, marginBottom: 24 }}>
          <Zap size={14} color="var(--ff-primary)" className="pulse" />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Built for Track 2 — Stablecoins Commerce Stack
          </span>
        </div>

        <h1 style={{ fontSize: 'min(4.5rem, 9vw)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, color: '#fff', marginBottom: 20 }}>
          Seamless SME Capital. <br/>
          <span style={{ background: 'linear-gradient(135deg, var(--ff-primary) 30%, var(--ff-violet) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Zero Gas. Instant Yield.
          </span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--ff-text-secondary)', maxWidth: 640, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Stop waiting 60 days for corporate payouts. Factor your invoices on-chain using Circle USDC-native gas, enterprise paymasters, and unified CCTP capital bridges.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            style={{ padding: '12px 24px', fontSize: 14 }}
            onClick={() => onLaunchApp('dashboard')}
          >
            Launch Active Demo <ArrowRight size={16} />
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '12px 24px', fontSize: 14 }}
            onClick={() => {
              const el = document.getElementById('demo-section')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Explore Core Features
          </button>
        </div>
      </section>

      {/* 2. PROBLEM VS SOLUTION */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>SME Capital Redefined</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>Compare legacy invoicing against FactorFi\'s modern Web3 stack</p>
        </div>

        <div className="grid-2" style={{ gap: 20 }}>
          <div className="card" style={{ borderLeft: '4px solid var(--ff-danger)', background: 'rgba(239, 68, 68, 0.02)' }}>
            <div style={{ fontWeight: 700, color: 'var(--ff-danger)', fontSize: 16, marginBottom: 16 }}>The Friction (Legacy Trade Finance)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                '60-90 Day Delays: Suppliers choke waiting for anchor invoice payout dates.',
                'High Broker Fees: Legacy factoring brokers extract up to 8% in arbitrary fees.',
                'Web3 Complexity: Corporate finance teams refuse custody of private keys/faucets.',
                'Double-Factoring Fraud: Lack of shared ledgers leads to invoice counterfeiting.',
              ].map((txt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--ff-text-secondary)' }}>
                  <span style={{ color: 'var(--ff-danger)' }}>✕</span>
                  <span>{txt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--ff-success)', background: 'rgba(16, 185, 129, 0.02)' }}>
            <div style={{ fontWeight: 700, color: 'var(--ff-success)', fontSize: 16, marginBottom: 16 }}>The Solution (FactorFi on Arc)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Instant USDC Settlements: Repayments settle in sub-seconds via Arc Testnet.',
                'Transparent Smart Discount: Fixed 3% dynamic yield goes directly to investors.',
                'Invisible Wallet Custody: Account abstraction sponsors gasless transactions.',
                'Immutable Credit Passports: Double-factoring is blocked by verifiable states.',
              ].map((txt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--ff-text)' }}>
                  <span style={{ color: 'var(--ff-success)' }}>✓</span>
                  <span>{txt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. BENTO GRID FEATURES */}
      <section id="demo-section" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Powering the Stablecoins Commerce Stack</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>Deep integration with Arc and Circle developer tools</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
          {/* Bento Card 1 */}
          <div className="card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BrainCircuit size={18} color="var(--ff-primary)" />
              <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Agentic Underwriter AI (OCR Ingestion)</span>
            </div>
            <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
              Our embedded AI models ingest and parse invoice PDFs instantly. The system automatically reads debtor address registry, matches terms, recommends smart discount rates, and auto-fills on-chain submission structures.
            </p>
            <div style={{ flex: 1, background: '#000', borderRadius: 8, border: '1px solid var(--ff-border)', padding: 12, fontFamily: 'var(--ff-mono)', fontSize: 11 }}>
              <div style={{ color: 'var(--ff-primary)', marginBottom: 4 }}>&gt; Initializing neural OCR risk parser...</div>
              <div style={{ color: '#888' }}>&gt; Debtor Verification: Tesla Inc. (Score: 940/1000)</div>
              <div style={{ color: 'var(--ff-success)' }}>&gt; Result: Approved. Premium BPS discount recommended: 3.2%</div>
            </div>
          </div>

          {/* Bento Card 2 */}
          <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <Zap size={24} color="var(--ff-primary)" className="pulse" />
            <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>USDC Paymaster Gas Station</div>
            <p style={{ color: 'var(--ff-text-secondary)', fontSize: 12.5, lineHeight: 1.6 }}>
              Tapping into Arc\'s account abstraction framework to sponsor gas fees, ensuring SMEs enjoy complete commercial integration with zero native token prerequisites.
            </p>
          </div>

          {/* Bento Card 3 */}
          <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <Cpu size={24} color="var(--ff-violet)" />
            <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Programmable Yield Vault</div>
            <p style={{ color: 'var(--ff-text-secondary)', fontSize: 12.5, lineHeight: 1.6 }}>
              Set risk scoring thresholds and minimum yields. Autonomous keepers continuously scan block headers, funding incoming corporate invoices automatically.
            </p>
          </div>

          {/* Bento Card 4 */}
          <div className="card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code size={18} color="var(--ff-violet)" />
              <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Circle CCTP Cross-Chain Bridge</span>
            </div>
            <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
              Utilizing Circle\'s App Kit to bridge USDC cross-chain without custodial risk. The contract burns source-chain tokens, verifies IRIS attestation signatures, and mints stable native USDC directly on the Arc L1 blockchain.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {['Approve', 'Burn (Base)', 'Iris Proof', 'Mint (Arc)'].map((s, idx) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--ff-border)', fontSize: 11 }}>
                  <CheckCircle2 size={12} color="var(--ff-success)" />
                  <span style={{ color: '#fff', fontWeight: 500 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. MICRO-DOCS TAB PANEL */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Developer Docs & Getting Started</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>Copy-paste setup parameters for testing the protocol</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--ff-border)', paddingBottom: 12, gap: 16 }}>
            {[
              { id: 'intro', label: '1. Introduction', icon: <BookOpen size={14} /> },
              { id: 'start', label: '2. 3-Min Quickstart', icon: <Zap size={14} /> },
              { id: 'contracts', label: '3. API Contracts', icon: <Code size={14} /> }
            ].map(tab => (
              <button 
                key={tab.id}
                style={{ 
                  background: 'none', border: 'none', color: docTab === tab.id ? 'var(--ff-primary)' : 'var(--ff-text-muted)',
                  fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  paddingBottom: 12, borderBottom: docTab === tab.id ? '2px solid var(--ff-primary)' : 'none', marginBottom: -13,
                  transition: 'all 0.2s'
                }}
                onClick={() => setDocTab(tab.id as any)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div style={{ minHeight: 180, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ff-text-secondary)' }}>
            {docTab === 'intro' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontWeight: 600, color: '#fff' }}>What is FactorFi?</p>
                <p>FactorFi is an on-chain protocol executing reverse-factoring workflows on Arc Testnet. By utilizing USDC as native gas, the protocol ensures extremely stable, deterministic transaction settlements under sub-seconds.</p>
                <p>We leverage Circle\'s core Developer APIs to create Developer-Controlled corporate wallets acting as escrow mediators, protecting companies from custody complexities and managing invoice payouts automatically.</p>
              </div>
            )}

            {docTab === 'start' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontWeight: 600, color: '#fff' }}>Setting up your testing wallet in 3 steps:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12 }}>
                  <div>1. Connect your Ethereum Web3 Wallet using the Connect button in the header.</div>
                  <div>2. Acquire testnet USDC from the official faucet: <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ff-primary)', textDecoration: 'underline' }}>faucet.circle.com</a> (Select Arc Chain).</div>
                  <div>3. Register as an Anchor company or directly upload a mock corporate invoice in the Supplier tab to execute dynamic paymaster operations!</div>
                </div>
              </div>
            )}

            {docTab === 'contracts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontWeight: 600, color: '#fff' }}>Hợp đồng thông minh trên Arc Testnet (Solc 0.8.24):</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, background: '#000', borderRadius: 6, border: '1px solid var(--ff-border)', fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: '#ccc' }}>
                  <div>// Active Deployment Address:</div>
                  <div style={{ color: 'var(--ff-primary)' }}>FACTORFI_CONTRACT = "0x82f4c3a1670921f57b149d70fd66aa295d69a2f"</div>
                  <div>// Core ABI execution:</div>
                  <div>function submitInvoice(address _anchor, uint256 _amount, uint256 _dueDate, string _desc) external;</div>
                  <div>function fundInvoice(uint256 _invoiceId, uint256 _discountBps) external;</div>
                  <div>function settleInvoice(uint256 _invoiceId) external;</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE FAQ ACCORDION */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>Common developer and commercial inquiries regarding our protocol</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: 11, color: 'var(--ff-text-muted)' }} size={16} />
            <input 
              className="form-input" 
              placeholder="Search FAQ questions or topics..." 
              value={faqSearch} 
              onChange={e => setFaqSearch(e.target.value)}
              style={{ paddingLeft: 36, background: '#111', borderColor: '#333', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    borderBottom: '1px solid var(--ff-border)', paddingBottom: 16, cursor: 'pointer' 
                  }}
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#fff', fontSize: 14 }}>
                    <span>{faq.q}</span>
                    <span style={{ fontSize: 16, color: 'var(--ff-primary)' }}>{openFaq === idx ? '−' : '+'}</span>
                  </div>
                  {openFaq === idx && (
                    <p style={{ marginTop: 8, color: 'var(--ff-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ff-text-muted)', fontSize: 13 }}>
                No FAQ matches found. Try searching another keyword.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. TEAM STORY & COMMUNITY */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Our Story & Mission</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>Democratizing trade finance for global business supply chains</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ff-primary)' }}>Built for Global Commercial Inflows</div>
          <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13.5, lineHeight: 1.6 }}>
            Trade finance is currently controlled by a central oligarchy of commercial banks who dictate high interest spreads and lock out small, starting businesses. FactorFi was founded during **The Stablecoins Commerce Stack Challenge** to return control to the innovators. By combining native USDC gas and circle attestation, we create a transparent, frictionless lending pipeline where SMEs get cash instantly and capital sponsors enjoy robust yields.
          </p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', borderTop: '1px solid var(--ff-border)', paddingTop: 16 }}>
            {[
              { label: 'Open Source', val: 'GitHub Audited' },
              { label: 'Network', val: 'Arc Testnet L1' },
              { label: 'Primary Currency', val: 'Circle USDC & EURC' }
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 2 }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CONVERSION-FOCUSED WAITLIST */}
      <section className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', 
        borderColor: 'var(--ff-primary)', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center', padding: '40px 24px' 
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ff-warning)', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
          <Star size={12} fill="currentColor" /> Mainnet Deployment Scheduled Q3 2026
        </div>

        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Secure Your Priority Allocations</h2>
          <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, marginTop: 6, maxWidth: 480 }}>
            Join the waitlist to receive immediate mainnet notifications and get priority institutional liquidity allocations for your trade factoring.
          </p>
        </div>

        {isSubmitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', color: 'var(--ff-success)', fontWeight: 600, fontSize: 14 }}>
            <ShieldCheck size={32} />
            <span>Registration Complete! Welcome to FactorFi.</span>
          </div>
        ) : (
          <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', gap: 10, maxWidth: 480, width: '100%', flexDirection: 'column', smDirection: 'row' } as any}>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input 
                type="email" 
                className="form-input form-input-mono" 
                placeholder="enterYourEmail@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSubmitting}
                style={{ flex: 1, height: 42, background: '#0a0a0c', color: '#fff' }}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 42, padding: '0 16px' }}
                disabled={isSubmitting}
              >
                <Mail size={16} /> {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--ff-border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--ff-text-muted)', flexWrap: 'wrap', gap: 16 }}>
        <div>© 2026 FactorFi Protocol. Deployed on Arc Testnet. Open Source.</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ff-text-muted)' }}>Arcscan</a>
          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ff-text-muted)' }}>Circle Faucet</a>
          <a href="#" style={{ color: 'var(--ff-text-muted)' }}>Terms</a>
          <a href="#" style={{ color: 'var(--ff-text-muted)' }}>Privacy</a>
        </div>
      </footer>

    </div>
  )
}
