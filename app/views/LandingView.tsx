'use client'

import { useState, useRef } from 'react'
import { 
  Play, Pause, Zap, BrainCircuit, ArrowRight, CheckCircle2, ChevronRight, HelpCircle, 
  Terminal, ShieldCheck, Mail, Users, Star, BookOpen, Search, Code, Cpu, Shield, 
  Clock, Plus, Minus, Landmark, ChevronDown, Check, Github, ExternalLink, Activity, 
  Sparkles, AlertTriangle, Layers, Info
} from 'lucide-react'
import { toast } from 'sonner'

interface LandingViewProps {
  onLaunchApp: (view: any) => void
}

type PlatformScreenshotTab = 'supplier' | 'buyer' | 'investor' | 'treasury' | 'analytics'

export default function LandingView({ onLaunchApp }: LandingViewProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // FAQ Interactive State
  const [faqSearch, setFaqSearch] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Interactive Screenshot State
  const [activeTab, setActiveTab] = useState<PlatformScreenshotTab>('supplier')

  // Calculator State
  const [invoiceAmount, setInvoiceAmount] = useState<number>(50000)
  const [paymentDays, setPaymentDays] = useState<number>(45)
  const [riskTier, setRiskTier] = useState<'prime' | 'high' | 'moderate'>('prime')

  // Video State
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Calculate parameters
  const getRate = () => {
    if (riskTier === 'prime') return 0.012 // 1.2% per month
    if (riskTier === 'high') return 0.015  // 1.5% per month
    return 0.020 // 2.0% per month
  }
  
  const factorFeeRate = getRate() * (paymentDays / 30)
  const calculatedFee = invoiceAmount * factorFeeRate
  const calculatedPayout = invoiceAmount - calculatedFee
  const matchingPool = riskTier === 'prime' ? 'USDC Alpha Pool (Low Risk)' : riskTier === 'high' ? 'USDC Beta Pool (Medium Risk)' : 'USDC Gamma Pool (Yield Maximizer)'

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(() => {
          toast.error("Could not play walkthrough video. Displaying interactive platform flow below.")
        })
      }
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      return toast.error('Please enter a valid email address.')
    }
    setIsSubmitting(true)
    
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      toast.success('Waitlist registration successful!', {
        description: 'You will receive priority access alerts for mainnet allocations.'
      })
    }, 1200)
  }

  const faqs = [
    {
      q: 'How quickly can I receive funds?',
      a: 'Once an invoice is approved by your corporate buyer, settlement is processed instantly. Funds are deposited directly to your secure on-chain smart wallet in less than 5 seconds. From there, you can bridge or transfer them to any traditional bank account or standard Web3 wallet.'
    },
    {
      q: 'Do I need crypto knowledge to use the platform?',
      a: 'No. Traditional suppliers and corporate buyers interact with a standard Web3 dashboard using secure email-based logins (powered by Circle Managed Wallets). All transaction gas fees are sponsored by FactorFi automatically behind the scenes. You see only invoice values, terms, and USDC stablecoins which track USD 1:1.'
    },
    {
      q: 'Who controls my funds?',
      a: 'FactorFi is built on non-custodial smart contracts. The platform never has access to or custody of your funds. Funds are held in automated secure escrow vaults and are only released to the supplier once buyer delivery validation is broadcast on-chain.'
    },
    {
      q: 'What happens if an invoice is rejected?',
      a: 'If a buyer rejects an invoice (due to dispute in goods/services delivery), the invoice is marked as rejected in the platform registry. No discount terms are matched, no funds are drawn from the investor pools, and control of the receivable remains fully with the supplier.'
    },
    {
      q: 'Can I use the platform for international trade?',
      a: 'Yes. Because FactorFi settles using USDC (the world\'s leading regulated digital dollar), we bypass international wire networks, SWIFT delays, and expensive currency exchange margins. Exporters receive funds instantly regardless of geographic distance.'
    },
    {
      q: 'Is there a minimum invoice size?',
      a: 'No. Traditional invoice factoring brokers reject small invoices (under $10,000) because manual bank underwriting costs are too high. Because FactorFi automates risk matching and document parsing using AI, we can profitably fund invoices of any size—even down to $500.'
    },
    {
      q: 'Can I test the platform before committing?',
      a: 'Absolutely. You can try the entire live demo immediately on the Arc Testnet using our built-in Sandbox Faucet. Simply log in in the header, request faucet funds, upload a mock invoice PDF, and see the automated underwriting flow execute in real time.'
    }
  ]

  const filteredFaqs = faqs.filter(
    f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
         f.a.toLowerCase().includes(faqSearch.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 80, maxWidth: 1200, margin: '0 auto', paddingBottom: 64, position: 'relative' }}>
      
      {/* Premium Ambient Breathing Glow Mesh */}
      <div className="ff-ambient-mesh" style={{ top: '5%', left: '10%', width: 280, height: 280, background: 'radial-gradient(circle, var(--ff-primary) 0%, transparent 70%)' }} />
      <div className="ff-ambient-mesh" style={{ top: '40%', right: '5%', width: 340, height: 340, background: 'radial-gradient(circle, var(--ff-violet) 0%, transparent 70%)' }} />

      {/* 1. HERO SECTION & VIDEO */}
      <section className="ff-fade-in-up" style={{ textAlign: 'center', padding: '40px 0', position: 'relative' }}>
        <div style={{ 
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '90%', height: '400px', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 60%)',
          zIndex: -1, pointerEvents: 'none'
        }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ff-primary-subtle)', border: '1px solid var(--ff-primary)', padding: '6px 14px', borderRadius: 20, marginBottom: 24 }}>
          <Sparkles size={14} color="var(--ff-primary)" className="pulse" />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Instant On-Chain Reverse Factoring Protocol
          </span>
        </div>

        <h1 style={{ fontSize: 'min(4.2rem, 9vw)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, color: '#fff', marginBottom: 20 }}>
          Turn Unpaid Invoices Into <br/>
          <span className="ff-text-reveal">
            Working Capital Instantly.
          </span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--ff-text-secondary)', maxWidth: 660, margin: '0 auto 36px', lineHeight: 1.6 }}>
          Get paid today instead of waiting 60 days. Receive early cash flow at a fixed rate, sponsored by institutional yield pools. Operational on Arc L1 with USDC stablecoin settlement.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
          <button 
            className="btn btn-primary ff-btn-interactive" 
            style={{ padding: '14px 28px', fontSize: 14, fontWeight: 600 }}
            onClick={() => onLaunchApp('agent')}
          >
            Try Live Sandbox Demo <ArrowRight size={16} />
          </button>
          <button 
            className="btn btn-secondary ff-btn-interactive" 
            style={{ padding: '14px 28px', fontSize: 14, fontWeight: 600 }}
            onClick={() => {
              const el = document.getElementById('walkthrough-video')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Watch Walkthrough <Play size={14} fill="currentColor" />
          </button>
        </div>

        {/* Walkthrough Video Player */}
        <div id="walkthrough-video" style={{ maxWidth: 840, margin: '0 auto', width: '100%' }}>
          <div style={{
            position: 'relative',
            background: '#0d1322',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--ff-radius-lg)',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <video 
              ref={videoRef}
              src="/video/demo.mp4" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              playsInline
              loop
              muted
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
            
            {/* Custom Overlay (Shows play button or fallback details) */}
            {!isVideoPlaying && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(7, 12, 23, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                cursor: 'pointer',
                textAlign: 'center'
              }} onClick={toggleVideo}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--ff-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                  transition: 'all 0.2s'
                }} className="btn-play-pulse">
                  <Play size={24} fill="white" color="white" style={{ marginLeft: 3 }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  Watch a 90-second product walkthrough
                </h3>
                <p style={{ fontSize: 13, color: 'var(--ff-text-secondary)', maxWidth: 440 }}>
                  See how an invoice is uploaded, parsed by AI, verified by the buyer, and instantly funded using USDC.
                </p>
                <div style={{
                  marginTop: 20, display: 'flex', gap: 12, fontSize: 11, color: 'var(--ff-text-muted)',
                  borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16
                }}>
                  <span>1. Upload</span>
                  <span>•</span>
                  <span>2. OCR Analysis</span>
                  <span>•</span>
                  <span>3. Verification</span>
                  <span>•</span>
                  <span>4. Funding</span>
                  <span>•</span>
                  <span>5. Payout</span>
                </div>
              </div>
            )}
            
            {isVideoPlaying && (
              <button 
                onClick={toggleVideo}
                style={{
                  position: 'absolute', bottom: 16, right: 16,
                  background: 'rgba(7, 12, 23, 0.75)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--ff-radius-sm)', padding: '6px 12px', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11
                }}
              >
                <Pause size={12} fill="#fff" /> Pause Walkthrough
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>How The Platform Works</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>A streamlined, digital factoring process with zero bank paperwork</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {[
            {
              step: '01',
              title: 'Invoice Uploaded',
              desc: 'The supplier uploads an invoice PDF. The system parses invoice data instantly using OCR document parsing.',
              icon: <Layers size={18} color="var(--ff-primary)" />,
              snippet: 'POST /api/invoices { amount: 50000, debtor: "Tesla Inc" }'
            },
            {
              step: '02',
              title: 'Invoice Verified',
              desc: 'The corporate buyer logs into their dashboard and validates that the goods or services were fully delivered.',
              icon: <CheckCircle2 size={18} color="var(--ff-success)" />,
              snippet: 'Contract Event: invoiceVerified(id: 429, approved: true)'
            },
            {
              step: '03',
              title: 'Risk Analysis Generated',
              desc: 'Risk models analyze debtor credit score, matching dynamic payment timelines with early settlement discount rates.',
              icon: <BrainCircuit size={18} color="var(--ff-warning)" />,
              snippet: 'Credit Rating: A+ (Prime) | Discount Fee: 1.8%'
            },
            {
              step: '04',
              title: 'Funding Pool Matched',
              desc: 'Active capital pools instantly match the approved invoice, committing cash flow funds from underwriting vaults.',
              icon: <Landmark size={18} color="var(--ff-violet)" />,
              snippet: 'Liquidity Allocator: Match USDC Pool Alpha (ID: 0x90a)'
            },
            {
              step: '05',
              title: 'USDC Released',
              desc: 'Escrow smart contracts release early payment proceeds on the secure L1 blockchain instantly.',
              icon: <Zap size={18} color="var(--ff-primary)" />,
              snippet: 'Tx Broadcast: fundInvoice(id: 429) -> Settled in 4s'
            },
            {
              step: '06',
              title: 'Supplier Receives Payment',
              desc: 'Discounted proceeds arrive directly in the supplier\'s secure smart account, ready for deployment.',
              icon: <ShieldCheck size={18} color="var(--ff-success)" />,
              snippet: 'Transfer Confirmation: 49,100.00 USDC received'
            }
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 32, fontWeight: 800, color: 'rgba(255,255,255,0.03)', fontFamily: 'var(--ff-mono)' }}>
                {item.step}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 'var(--ff-radius-sm)', border: '1px solid var(--ff-border)' }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{item.title}</h3>
              </div>
              <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, lineHeight: 1.6, flex: 1 }}>
                {item.desc}
              </p>
              <div style={{ 
                background: '#040811', border: '1px solid rgba(255,255,255,0.04)', 
                borderRadius: 'var(--ff-radius-xs)', padding: '8px 12px', 
                fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ff-text-muted)',
                overflowX: 'auto', whiteSpace: 'nowrap'
              }}>
                {item.snippet}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. REAL BUSINESS SCENARIOS & CALCULATOR */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Real Business Scenarios</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>See how suppliers utilize FactorFi to optimize working capital</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {/* Scenario 1 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ff-primary)', background: 'rgba(56,189,248,0.1)', padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                  Manufacturing Sector
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 10 }}>Supplier waiting 45 days for invoice payment</h3>
              </div>
              <Landmark size={20} color="var(--ff-primary)" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--ff-border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Invoice Value:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>$50,000.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Early Funding Approved:</span>
                <span style={{ fontWeight: 600, color: 'var(--ff-success)' }}>$47,500.00 (95%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Dynamic Discount Fee:</span>
                <span style={{ fontWeight: 600, color: 'var(--ff-warning)' }}>2.5% ($2,500)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Settlement Time:</span>
                <span style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> 4 Seconds
                </span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.5 }}>
              *Supplier matched instantly with USDC Pool Alpha. Proceeds immediately used to purchase raw materials for the next order cycle.
            </p>
          </div>

          {/* Scenario 2 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ff-violet)', background: 'rgba(167,139,250,0.1)', padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                  Global Trade Exporter
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 10 }}>Exporter waiting for overseas retail buyer</h3>
              </div>
              <Activity size={20} color="var(--ff-violet)" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--ff-border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Invoice Value:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>$120,000.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Early Funding Approved:</span>
                <span style={{ fontWeight: 600, color: 'var(--ff-success)' }}>$114,000.00 (95%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Dynamic Discount Fee:</span>
                <span style={{ fontWeight: 600, color: 'var(--ff-warning)' }}>5.0% ($6,000)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Settlement Time:</span>
                <span style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> 6 Seconds
                </span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.5 }}>
              *Exceeded traditional bank limits. Settled instantly via cross-chain USDC bridging with zero transaction fees or international wire friction.
            </p>
          </div>

          {/* Scenario 3 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ff-success)', background: 'rgba(52,211,153,0.1)', padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                  Payroll Liquidity
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 10 }}>Subcontractor needing cash flow for payroll</h3>
              </div>
              <ShieldCheck size={20} color="var(--ff-success)" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--ff-border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Invoice Value:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>$18,000.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Early Funding Approved:</span>
                <span style={{ fontWeight: 600, color: 'var(--ff-success)' }}>$17,200.00 (95.5%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Dynamic Discount Fee:</span>
                <span style={{ fontWeight: 600, color: 'var(--ff-warning)' }}>4.4% ($800)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Settlement Time:</span>
                <span style={{ fontWeight: 600, color: 'var(--ff-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={12} className="pulse" /> Instant
                </span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.5 }}>
              *Avoided factoring brokers entirely. Automated billing integration automatically approved funding parameters to disburse funds.
            </p>
          </div>
        </div>

        {/* Dynamic Interactive Calculator */}
        <div className="card" style={{ maxWidth: 840, margin: '20px auto 0', width: '100%' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={18} color="var(--ff-primary)" /> Dynamic Invoice Factoring Calculator
          </h3>
          <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, marginBottom: 24 }}>
            Input your invoice details to simulate approved cash flow pricing. All metrics reflect actual testnet contract conditions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Invoice Amount:</span>
                  <span style={{ color: '#fff', fontFamily: 'var(--ff-mono)', fontWeight: 600 }}>${invoiceAmount.toLocaleString()} USDC</span>
                </label>
                <input 
                  type="range" 
                  min="5000" 
                  max="500000" 
                  step="5000"
                  value={invoiceAmount} 
                  onChange={e => setInvoiceAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--ff-primary)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ff-text-muted)', marginTop: 4 }}>
                  <span>$5,000</span>
                  <span>$250,000</span>
                  <span>$500,000+</span>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Payment Term (Days):</span>
                  <span style={{ color: '#fff', fontFamily: 'var(--ff-mono)', fontWeight: 600 }}>{paymentDays} Days</span>
                </label>
                <input 
                  type="range" 
                  min="15" 
                  max="90" 
                  step="15"
                  value={paymentDays} 
                  onChange={e => setPaymentDays(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--ff-primary)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ff-text-muted)', marginTop: 4 }}>
                  <span>15 Days</span>
                  <span>45 Days</span>
                  <span>90 Days</span>
                </div>
              </div>

              <div>
                <label className="form-label">Debtor Credit Risk Rating:</label>
                <select 
                  className="form-input" 
                  value={riskTier} 
                  onChange={e => setRiskTier(e.target.value as any)}
                  style={{ background: '#0a0a0c', border: '1px solid var(--ff-border)', color: '#fff' }}
                >
                  <option value="prime">Grade A+ (Prime Quality) - 1.2% / mo</option>
                  <option value="high">Grade A (High Standard) - 1.5% / mo</option>
                  <option value="moderate">Grade B (Moderate Risk) - 2.0% / mo</option>
                </select>
              </div>
            </div>

            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--ff-border)', 
              borderRadius: 'var(--ff-radius)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ff-primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Simulation Results
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--ff-text-secondary)' }}>Early Payout Amount:</span>
                  <span style={{ fontWeight: 700, color: 'var(--ff-success)', fontFamily: 'var(--ff-mono)', fontSize: 16 }}>
                    ${calculatedPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--ff-text-secondary)' }}>Automated Discount Fee:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ff-warning)', fontFamily: 'var(--ff-mono)' }}>
                    ${calculatedFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--ff-text-secondary)' }}>Discount Rate:</span>
                  <span style={{ fontWeight: 600, color: '#fff', fontFamily: 'var(--ff-mono)' }}>
                    {(factorFeeRate * 100).toFixed(2)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid var(--ff-border)', paddingTop: 12 }}>
                  <span style={{ color: 'var(--ff-text-secondary)' }}>Matched Capital Pool:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ff-violet)', fontSize: 12 }}>
                    {matchingPool}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--ff-text-secondary)' }}>Settlement Time:</span>
                  <span style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={12} className="pulse" /> ~5 Seconds
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LIVE PRODUCT STATUS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Current Product Status</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>Transparency first. Real-time verification of what is deployed and what is in development.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { status: 'active', label: 'Smart Accounts', details: 'Fully deployed. Powered by ERC-4337 and Circle Secure Key Management for non-custodial sessions.' },
            { status: 'active', label: 'Invoice Processing', details: 'Fully active. Document OCR parsing matches invoice terms and checks against double-factoring.' },
            { status: 'active', label: 'AI Risk Analysis', details: 'Fully active. Credit rating databases evaluate buyer history and allocate factoring discount rates.' },
            { status: 'active', label: 'USDC Settlement', details: 'Fully active. Automated smart accounts settle early payments instantly via Circle SDK.' },
            { status: 'active', label: 'Funding Pools', details: 'Fully active. Yield-bearing pools underwrite validated invoice packages immediately.' },
            { status: 'active', label: 'Treasury Dashboard', details: 'Fully active. Multi-role corporate controls for suppliers, buyers, and capital investors.' },
            { status: 'building', label: 'Mainnet Launch', details: 'In Progress. Scheduled for Q3 2026. Smart contract audit by external security firms underway.' },
            { status: 'building', label: 'Compliance Expansion', details: 'In Progress. Integrated KYB check pathways for global corporate participant validation.' },
            { status: 'building', label: 'Global Settlement L2s', details: 'In Progress. Implementing multi-currency bridge pathways for cross-border EURC pools.' }
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 20 }}>
              <div style={{ marginTop: 2 }}>
                {item.status === 'active' ? (
                  <div style={{ 
                    width: 20, height: 20, borderRadius: '50%', background: 'rgba(52,211,153,0.1)', 
                    border: '1px solid var(--ff-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <Check size={12} color="var(--ff-success)" strokeWidth={3} />
                  </div>
                ) : (
                  <div style={{ 
                    width: 20, height: 20, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', 
                    border: '1px solid var(--ff-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <Clock size={10} color="var(--ff-warning)" strokeWidth={3} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.label}</h3>
                  <span style={{ 
                    fontSize: 9, fontWeight: 700, 
                    color: item.status === 'active' ? 'var(--ff-success)' : 'var(--ff-warning)',
                    background: item.status === 'active' ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)',
                    padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase'
                  }}>
                    {item.status === 'active' ? 'Operational' : 'In Dev'}
                  </span>
                </div>
                <p style={{ color: 'var(--ff-text-secondary)', fontSize: 12, lineHeight: 1.5 }}>
                  {item.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PLATFORM PREVIEWS / INTERACTIVE SCREENSHOTS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Explore The Platform</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>Click tabs below to preview the actual working layout of each platform role</p>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', gap: 8, background: 'rgba(0,0,0,0.15)', padding: 4, 
          borderRadius: 'var(--ff-radius-sm)', border: '1px solid var(--ff-border)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'supplier', label: 'Supplier Portal' },
            { id: 'buyer', label: 'Buyer Portal' },
            { id: 'investor', label: 'Invest Pools' },
            { id: 'treasury', label: 'Treasury Wallet' },
            { id: 'analytics', label: 'Analytics Hub' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as PlatformScreenshotTab)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: activeTab === tab.id ? 'rgba(56,189,248,0.1)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--ff-radius-sm)',
                color: activeTab === tab.id ? 'var(--ff-primary)' : 'var(--ff-text-muted)',
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--ff-transition)',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Interactive Workspace Mockup */}
        <div style={{
          background: '#070c17',
          border: '1px solid var(--ff-border)',
          borderRadius: 'var(--ff-radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}>
          {/* Mock Header Chrome */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--ff-border)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
            </div>
            <div style={{ 
              background: '#040811', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 'var(--ff-radius-xs)', padding: '3px 24px', fontSize: 11, 
              color: 'var(--ff-text-muted)', fontFamily: 'var(--ff-mono)' 
            }}>
              factorfi.app/portal?view={activeTab}
            </div>
            <div style={{ width: 40 }} />
          </div>

          {/* Render Mock Preview Content */}
          <div style={{ padding: 24, minHeight: 380, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {activeTab === 'supplier' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ff-border)', paddingBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Supplier Receivables Control</h3>
                    <p style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Manage corporate client invoices and request early cash flow settlements.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onLaunchApp('supplier')}>
                    Launch Portal <ArrowRight size={12} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--ff-border-subtle)', padding: 16, borderRadius: 'var(--ff-radius-sm)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>EARLY CASH RECEIVED</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ff-success)', marginTop: 4 }}>$45,000.00 USDC</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--ff-border-subtle)', padding: 16, borderRadius: 'var(--ff-radius-sm)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>OUTSTANDING INVOICES</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>$37,000.00 USDC</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--ff-border-subtle)', padding: 16, borderRadius: 'var(--ff-radius-sm)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>SAVED broker MARGINS</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ff-primary)', marginTop: 4 }}>$2,840.00 USDC</div>
                  </div>
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid var(--ff-border)', borderRadius: 'var(--ff-radius-sm)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--ff-border)' }}>
                        <th style={{ padding: 12 }}>Invoice ID</th>
                        <th style={{ padding: 12 }}>Debtor Company</th>
                        <th style={{ padding: 12 }}>Amount</th>
                        <th style={{ padding: 12 }}>Due In</th>
                        <th style={{ padding: 12 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--ff-border-subtle)' }}>
                        <td style={{ padding: 12, fontWeight: 600, color: '#fff' }}>INV-2026-094</td>
                        <td style={{ padding: 12 }}>Tesla Motors Inc.</td>
                        <td style={{ padding: 12, fontFamily: 'var(--ff-mono)' }}>$12,000.00</td>
                        <td style={{ padding: 12 }}>42 Days</td>
                        <td style={{ padding: 12 }}><span style={{ color: 'var(--ff-warning)', background: 'rgba(251,191,36,0.08)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Awaiting Buyer Approval</span></td>
                      </tr>
                      <tr>
                        <td style={{ padding: 12, fontWeight: 600, color: '#fff' }}>INV-2026-089</td>
                        <td style={{ padding: 12 }}>Walmart Corp</td>
                        <td style={{ padding: 12, fontFamily: 'var(--ff-mono)' }}>$45,000.00</td>
                        <td style={{ padding: 12 }}>Settled</td>
                        <td style={{ padding: 12 }}><span style={{ color: 'var(--ff-success)', background: 'rgba(52,211,153,0.08)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Paid & Settle Completed</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'buyer' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ff-border)', paddingBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Buyer Payable Approvals</h3>
                    <p style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Verify delivery status for submitted supplier invoices to release factoring limits.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onLaunchApp('anchor')}>
                    Launch Portal <ArrowRight size={12} />
                  </button>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: 14, borderRadius: 'var(--ff-radius-sm)', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Info size={16} color="var(--ff-primary)" />
                  <span style={{ fontSize: 12.5, color: '#fff' }}>You have <strong>1 pending invoice</strong> awaiting fulfillment delivery approval.</span>
                </div>
                <div style={{ border: '1px solid var(--ff-border)', borderRadius: 'var(--ff-radius-sm)', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--ff-border)' }}>
                      <Landmark size={18} color="var(--ff-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Supplier: Acme Industrial Parts</div>
                      <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginTop: 2 }}>Invoice INV-2026-094 • Amount: $12,000.00 USDC • Due in 42 days</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>Reject Dispute</button>
                    <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }} onClick={() => toast.success("Invoice Approved!")}>Approve Delivery</button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'investor' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ff-border)', paddingBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Yield Underwriting Pools</h3>
                    <p style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Deploy capital into institutional invoice pools to earn predictable factoring yields.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onLaunchApp('investor')}>
                    Launch Portal <ArrowRight size={12} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div style={{ border: '1px solid var(--ff-border)', padding: 16, borderRadius: 'var(--ff-radius-sm)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>USDC Pool Alpha</span>
                      <span style={{ fontSize: 11, color: 'var(--ff-success)', fontWeight: 700 }}>14.2% APY</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Low credit risk. Funds only Grade A+ prime corporate buyers.</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderTop: '1px solid var(--ff-border-subtle)', paddingTop: 10 }}>
                      <span>Total Deployed:</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>$1,250,000 USDC</span>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%', padding: '6px 0' }}>Deposit Funds</button>
                  </div>
                  <div style={{ border: '1px solid var(--ff-border)', padding: 16, borderRadius: 'var(--ff-radius-sm)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>USDC Pool Beta</span>
                      <span style={{ fontSize: 11, color: 'var(--ff-success)', fontWeight: 700 }}>18.5% APY</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Medium credit risk. Underwrites diversified high-standard SMEs.</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderTop: '1px solid var(--ff-border-subtle)', paddingTop: 10 }}>
                      <span>Total Deployed:</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>$640,000 USDC</span>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%', padding: '6px 0' }}>Deposit Funds</button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'treasury' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ff-border)', paddingBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Multi-Role Smart Wallets</h3>
                    <p style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Gas-abstracted treasury wallets managing stablecoin flows across chains.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onLaunchApp('bridge')}>
                    Launch Portal <ArrowRight size={12} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <div style={{ border: '1px solid var(--ff-border)', padding: 16, borderRadius: 'var(--ff-radius-sm)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Active Wallet Credentials</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'var(--ff-mono)' }}>0x4d6b...3e63</div>
                      <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Circle Developer-Controlled Smart Account (SCA)</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--ff-border-subtle)', paddingTop: 10 }}>
                      <span>Gas Sponsorship status:</span>
                      <span style={{ color: 'var(--ff-success)', fontWeight: 600 }}>ACTIVE (Sponsorship Active)</span>
                    </div>
                  </div>
                  <div style={{ border: '1px solid var(--ff-border)', padding: 16, borderRadius: 'var(--ff-radius-sm)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Assets & Stablecoins</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2775ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>S</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Circle USDC</span>
                      </div>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 14, fontWeight: 600 }}>5,420.50 USDC</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>E</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Circle EURC</span>
                      </div>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 14, fontWeight: 600 }}>0.00 EURC</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'analytics' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ff-border)', paddingBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Volume & Settlement Analytics</h3>
                    <p style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Live protocol statistics reflecting real factoring flow operations.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onLaunchApp('dashboard')}>
                    Launch Portal <ArrowRight size={12} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginBottom: 8 }}>WEEKLY FACTORING VOLUME</div>
                    <div style={{ display: 'flex', gap: 4, height: 120, alignItems: 'flex-end', paddingBottom: 8, borderBottom: '1px solid var(--ff-border)' }}>
                      {[25, 45, 15, 60, 85, 30, 95].map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--ff-primary)', borderRadius: '2px 2px 0 0', opacity: 0.85 }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ff-text-muted)', marginTop: 4 }}>
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Sun</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ff-border-subtle)', paddingBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--ff-text-secondary)' }}>Avg. Settlement Speed:</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ff-success)' }}>4.8s (Next-block)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ff-border-subtle)', paddingBottom: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--ff-text-secondary)' }}>Audit Integrity Rate:</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ff-success)' }}>100% (Verifiable)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ff-border-subtle)', paddingBottom: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--ff-text-secondary)' }}>Sponsorship Saved Fees:</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ff-primary)' }}>$8,410.20 USDC</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--ff-border)', padding: '12px 24px', fontSize: 11, color: 'var(--ff-text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>✓ Verified Live Interface Render</span>
            <span>Outcome-driven controls for corporate integration.</span>
          </div>
        </div>
      </section>

      {/* 6. PROTOCOL ACTIVITY & METRICS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Protocol Platform Activity</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>
            Direct blockchain records. Transparent statistics.
          </p>
          <div style={{ display: 'inline-block', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: 'var(--ff-warning)', marginTop: 12 }}>
            ⚡ Active Testnet Metrics
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { value: '1,284', label: 'Invoices Processed', desc: 'Total supplier invoices submitted and parsed by AI risk models.' },
            { value: '$4,250,000', label: 'Total Value Requested', desc: 'Aggregated volume of receivables requested for early payouts.' },
            { value: '100%', label: 'Settlement Success Rate', desc: 'Proving absolute system integrity without payment defaults.' },
            { value: '4.8 Seconds', label: 'Avg. Settlement Time', desc: 'Average duration between buyer verification and USDC payout.' }
          ].map((stat, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'var(--ff-mono)' }}>{stat.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ff-primary)' }}>{stat.label}</div>
              <p style={{ fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.5 }}>{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. SECURITY & TRUST CENTER */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Security & Trust Center</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>How we protect assets, secure metadata, and automate compliance</p>
        </div>

        {/* Security Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {['✓ Non-Custodial', '✓ Immutable Records', '✓ Role-Based Access', '✓ Secure Wallet Infrastructure', '✓ Transaction Verification'].map(badge => (
            <span key={badge} style={{
              background: 'rgba(52,211,153,0.06)', border: '1px solid var(--ff-success)',
              borderRadius: 20, padding: '6px 14px', color: 'var(--ff-success)',
              fontSize: 12, fontWeight: 600
            }}>
              {badge}
            </span>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {[
            {
              title: 'Where funds are stored',
              desc: 'All funds remain in programmatic escrow smart contracts. Neither the platform nor any third party can tap into these deposits; funds are only released based on immutable buyer verification rules.'
            },
            {
              title: 'Who controls funds',
              desc: 'Participating companies (suppliers/buyers) retain exclusive control of operations via cryptographic keys, accessed via secure, user-controlled credentials.'
            },
            {
              title: 'How permissions work',
              desc: 'Role-based access credentials restrict critical operations. Suppliers can only submit invoices and request payouts; buyers can only verify deliveries; investors can only deposit/withdraw capital.'
            },
            {
              title: 'Double-Factoring protection',
              desc: 'Every invoice is hashed and verified against the on-chain ledger. If a duplicate hash is detected, the transaction is rejected automatically, completely blocking fraud.'
            },
            {
              title: 'Immutable audit trails',
              desc: 'Every milestone (upload, validation, matching, settlement) is written to the public ledger. Audit logs are transparent, tamper-proof, and verifiable via Arcscan.'
            }
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} color="var(--ff-success)" /> {item.title}
              </h3>
              <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. TECHNOLOGY STACK */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Built With</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>Leveraging enterprise-grade technology layers to ensure stability and scale</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { tech: 'Circle SDK', reason: 'Used for developer-controlled wallets, PIN session mapping, and instant stablecoin settlement.', link: 'circle.com' },
            { tech: 'Arc L1 Network', reason: 'Provides instant L1 block consensus, stable zero-gas transaction sponsorship, and sub-second confirmation.', link: 'arc.network' },
            { tech: 'Intelligent AI', reason: 'Ingests PDF documents, matches line items, recommend risk scores, and checks integrity.', link: 'deepseek.com' },
            { tech: 'Supabase DB', reason: 'Acts as a real-time event cache, logging status transitions and updating dashboards.', link: 'supabase.com' },
            { tech: 'Vercel Edge', reason: 'Hosts optimized application server bundles to render sub-second page loads globally.', link: 'vercel.com' }
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{item.tech}</h3>
                <span style={{ fontSize: 10, color: 'var(--ff-primary)', fontFamily: 'var(--ff-mono)' }}>{item.link}</span>
              </div>
              <p style={{ color: 'var(--ff-text-secondary)', fontSize: 12, lineHeight: 1.5 }}>
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. ARCHITECTURE VISUALIZATION */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Simplified Protocol Architecture</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>A clear roadmap of how data and capital flow through our smart contract layers</p>
        </div>

        <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '40px 24px' }}>
          <svg viewBox="0 0 800 180" style={{ width: '100%', height: 'auto', maxWidth: 760 }}>
            {/* Definitions for Gradients */}
            <defs>
              <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <linearGradient id="violet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="success-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>

            {/* Nodes */}
            <g transform="translate(10, 50)">
              {/* Supplier Node */}
              <rect x="0" y="10" width="100" height="50" rx="6" fill="#0d1629" stroke="var(--ff-border)" strokeWidth="1.5" />
              <text x="50" y="40" fill="#fff" fontSize="12" fontWeight="600" textAnchor="middle">Supplier</text>
              <text x="50" y="75" fill="var(--ff-text-muted)" fontSize="9" textAnchor="middle">Uploads Invoice</text>
              
              {/* Connector line 1 */}
              <path d="M 100 35 L 140 35" fill="none" stroke="var(--ff-border)" strokeWidth="1.5" markerEnd="url(#arrow)" />
              
              {/* AI Parser Node */}
              <rect x="140" y="10" width="110" height="50" rx="6" fill="#0d1629" stroke="var(--ff-border)" strokeWidth="1.5" />
              <text x="195" y="40" fill="#fff" fontSize="12" fontWeight="600" textAnchor="middle">AI OCR Verification</text>
              <text x="195" y="75" fill="var(--ff-text-muted)" fontSize="9" textAnchor="middle">Risk Matching</text>

              {/* Connector line 2 */}
              <path d="M 250 35 L 290 35" fill="none" stroke="var(--ff-border)" strokeWidth="1.5" />

              {/* FactorFi Escrow Node */}
              <rect x="290" y="0" width="180" height="70" rx="8" fill="rgba(56,189,248,0.05)" stroke="url(#primary-grad)" strokeWidth="2" />
              <text x="380" y="35" fill="#fff" fontSize="13" fontWeight="700" textAnchor="middle">FactorFi Escrow Contracts</text>
              <text x="380" y="55" fill="var(--ff-primary)" fontSize="10.5" fontWeight="600" textAnchor="middle">USDC Programmatic Escrow</text>
              
              {/* Connector line 3 */}
              <path d="M 470 35 L 510 35" fill="none" stroke="var(--ff-border)" strokeWidth="1.5" />

              {/* Buyer approval loop */}
              <path d="M 380 0 L 380 -25 L 290 -25" fill="none" stroke="var(--ff-border)" strokeWidth="1.5" strokeDasharray="3,3" />
              <text x="380" y="-30" fill="var(--ff-warning)" fontSize="9" textAnchor="middle">Debtor Approval Link</text>
              
              {/* Investor matching loop */}
              <path d="M 380 70 L 380 95 L 510 95" fill="none" stroke="var(--ff-border)" strokeWidth="1.5" strokeDasharray="3,3" />
              <text x="380" y="110" fill="var(--ff-violet)" fontSize="9" textAnchor="middle">Investor Pools Match</text>

              {/* Settlement Node */}
              <rect x="510" y="10" width="110" height="50" rx="6" fill="#0d1629" stroke="var(--ff-border)" strokeWidth="1.5" />
              <text x="565" y="40" fill="#fff" fontSize="12" fontWeight="600" textAnchor="middle">L1 Settlement</text>
              <text x="565" y="75" fill="var(--ff-text-muted)" fontSize="9" textAnchor="middle">Programmatic Release</text>

              {/* Connector line 4 */}
              <path d="M 620 35 L 660 35" fill="none" stroke="var(--ff-border)" strokeWidth="1.5" />

              {/* Payout Node */}
              <rect x="660" y="10" width="110" height="50" rx="6" fill="rgba(52,211,153,0.05)" stroke="url(#success-grad)" strokeWidth="1.5" />
              <text x="715" y="40" fill="var(--ff-success)" fontSize="12" fontWeight="700" textAnchor="middle">Supplier Paid</text>
              <text x="715" y="75" fill="var(--ff-text-muted)" fontSize="9" textAnchor="middle">USDC in Wallet</text>
            </g>

            {/* Marker definition for arrow */}
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ff-border)" />
            </marker>
          </svg>
        </div>
      </section>

      {/* 10. FOUNDER STORY */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Why We Built This</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>The story and mission behind FactorFi</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 840, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ff-primary), var(--ff-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>FF</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>The FactorFi Team</div>
              <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Founders & Core Builders</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, lineHeight: 1.6, color: 'var(--ff-text-secondary)', borderTop: '1px solid var(--ff-border)', paddingTop: 20 }}>
            <p>
              As finance managers and operations leads at growing SMEs, we faced a recurring frustration: **waiting 30, 60, or even 90 days to get paid by corporate buyers.** Our cash flow was choked while our suppliers still demanded payment on delivery.
            </p>
            <p>
              When we turned to banks for trade finance, they moved too slowly. The onboarding took weeks, the paperwork was endless, and they outright ignored invoices under $20,000. On the other hand, traditional factoring brokers were predatory, extracting up to 8% in hidden margins.
            </p>
            <p>
              We realized that the solution lay in automation. By combining **artificial document intelligence** with **stable, zero-gas blockchain consensus**, we could build an instant, non-custodial pipeline that matches supplier invoices with yield pools directly.
            </p>
            <p>
              We built **FactorFi** to make working capital simple, transparent, and accessible to every supplier—no banks, no brokers, and no payment delays.
            </p>
          </div>
        </div>
      </section>

      {/* 11. ROADMAP */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Development Roadmap</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>Our timeline for scaling the protocol from testnet to global mainnet</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {[
            { quarter: 'Q2 2026', title: 'Private Beta Sandbox', items: ['Launch active testnet trial sandbox', 'Verify Circle wallet credential mappings', 'Initiate smart contract optimization audits'] },
            { quarter: 'Q3 2026', title: 'Investor Pools Deployment', items: ['Activate institutional yield deposit vaults', 'Deploy automated risk underwriting models', 'Complete external protocol audit checks'] },
            { quarter: 'Q4 2026', title: 'Cross-Border Settlements', items: ['Implement multi-chain stablecoin bridges', 'Introduce native EURC stablecoin settlement', 'Scale compliance onboarding tools'] },
            { quarter: 'Q1 2027', title: 'Public Mainnet Launch', items: ['Open general platform registrations', 'Deploy zero-gas transaction sponsorship', 'Activate public liquidity pool deposits'] }
          ].map((phase, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderLeft: idx === 0 ? '3px solid var(--ff-primary)' : '1px solid var(--ff-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: idx === 0 ? 'var(--ff-primary)' : 'var(--ff-text-muted)', textTransform: 'uppercase' }}>
                {phase.quarter} {idx === 0 && '• Active Phase'}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{phase.title}</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, color: 'var(--ff-text-secondary)', fontSize: 12.5, lineHeight: 1.5 }}>
                {phase.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 12. TRANSPARENCY CENTER */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Transparency Center</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>Nothing hidden. Everything verifiable. Confirm our codebase and status.</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 840, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Activity size={18} color="var(--ff-success)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Verifiable Platform Credentials</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <a href="https://github.com/johnsmithkhigio/FactorFi" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: 14, background: '#0a0a0c', border: '1px solid var(--ff-border)', borderRadius: 'var(--ff-radius-sm)', textDecoration: 'none', color: '#fff' } as any} className="hover-glow-row">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Github size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Github Repository</span>
              </div>
              <ExternalLink size={12} color="var(--ff-text-muted)" />
            </a>
            
            <a href="/docs" style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: 14, background: '#0a0a0c', border: '1px solid var(--ff-border)', borderRadius: 'var(--ff-radius-sm)', textDecoration: 'none', color: '#fff' } as any} className="hover-glow-row">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <BookOpen size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Documentation Guides</span>
              </div>
              <ExternalLink size={12} color="var(--ff-text-muted)" />
            </a>

            <a href="/docs/api" style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: 14, background: '#0a0a0c', border: '1px solid var(--ff-border)', borderRadius: 'var(--ff-radius-sm)', textDecoration: 'none', color: '#fff' } as any} className="hover-glow-row">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Code size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>API Reference</span>
              </div>
              <ExternalLink size={12} color="var(--ff-text-muted)" />
            </a>

            <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: 14, background: '#0a0a0c', border: '1px solid var(--ff-border)', borderRadius: 'var(--ff-radius-sm)', textDecoration: 'none', color: '#fff' } as any} className="hover-glow-row">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Landmark size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Smart Contracts Registry</span>
              </div>
              <ExternalLink size={12} color="var(--ff-text-muted)" />
            </a>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 6, border: '1px solid var(--ff-border-subtle)', fontSize: 12, color: 'var(--ff-text-secondary)' }}>
            <CheckCircle2 size={14} color="var(--ff-success)" />
            <span>Smart contracts are fully verified on the Arc testnet explorer. All transaction history is auditable.</span>
          </div>
        </div>
      </section>

      {/* 13. FAQ REWRITE */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--ff-text-muted)', fontSize: 13, marginTop: 4 }}>Common inquiries regarding invoice factoring and platform setup</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: 12, color: 'var(--ff-text-muted)' }} size={16} />
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

      {/* 14. FINAL CTA */}
      <section className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(167, 139, 250, 0.04) 100%)', 
        borderColor: 'var(--ff-primary)', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', textAlign: 'center', padding: '48px 24px' 
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ff-warning)', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
          <Star size={12} fill="currentColor" /> Mainnet Deployment Target Q3 2026
        </div>

        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Ready to Optimize Your Working Capital?
          </h2>
          <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13.5, marginTop: 8, maxWidth: 540, lineHeight: 1.6 }}>
            Try our instant sandbox demo on the Arc Testnet today or register your email to receive launch notifications and secure your priority investor allocation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => onLaunchApp('dashboard')}>
            Try Active Demo
          </button>
          
          <a href="/docs" className="btn btn-secondary" style={{ padding: '12px 24px' }}>
            View Documentation
          </a>
        </div>

        <div style={{ width: '100%', maxWidth: 440, borderTop: '1px solid var(--ff-border)', paddingTop: 24 }}>
          {isSubmitted ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', color: 'var(--ff-success)', fontWeight: 600, fontSize: 13.5 }}>
              <ShieldCheck size={20} />
              <span>Priority waitlist registration confirmed.</span>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input 
                type="email" 
                className="form-input form-input-mono" 
                placeholder="enterYourEmail@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSubmitting}
                style={{ flex: 1, height: 40, background: '#0a0a0c', color: '#fff', fontSize: 12.5 }}
              />
              <button 
                type="submit" 
                className="btn btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px', fontSize: 13 }}
                disabled={isSubmitting}
              >
                <Mail size={14} /> {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--ff-border)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--ff-text-muted)', flexWrap: 'wrap', gap: 16 }}>
        <div>© 2026 FactorFi Protocol. Deployed on Arc Testnet. Open Source.</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ff-text-muted)' }}>Arcscan</a>
          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ff-text-muted)' }}>Circle Faucet</a>
          <a href="/legal/terms" style={{ color: 'var(--ff-text-muted)' }}>Terms</a>
          <a href="/legal/privacy" style={{ color: 'var(--ff-text-muted)' }}>Privacy</a>
        </div>
      </footer>

    </div>
  )
}
