'use client'

import { useState } from 'react'
import MarketingHeader from '../components/MarketingHeader'
import MarketingFooter from '../components/MarketingFooter'
import { Search, HelpCircle, ChevronDown, MessageSquare } from 'lucide-react'

interface FAQItem {
  category: string
  q: string
  a: string
}

const FAQS: FAQItem[] = [
  {
    category: 'General',
    q: 'What is FactorFi and who is it built for?',
    a: 'FactorFi is an on-chain reverse factoring protocol deployed on the Arc network. It is built for SME suppliers seeking immediate payment on invoices, corporate anchors wanting to optimize supplier relationships, and institutional investors looking for low-risk, asset-backed yields.'
  },
  {
    category: 'General',
    q: 'Is FactorFi free to use?',
    a: 'Signing up, registering companies, and submitting invoices is completely free. The protocol collects a minor 0.5% settlement fee on settled invoices when the corporate anchor makes the final payout. Investors pay zero fees.'
  },
  {
    category: 'Tech & Paymaster',
    q: 'How do "Gasless Transactions" work for suppliers?',
    a: 'By leveraging Arc\'s native Account Abstraction features, we implement an on-chain Paymaster. When an SME supplier registers or submits an invoice, the transaction gas costs are routed to our Paymaster contract, which sponsors the fees, shielding enterprises from purchasing L1 tokens.'
  },
  {
    category: 'Tech & Paymaster',
    q: 'Why are transactions settled in USDC?',
    a: 'Arc L1 network uses USDC as its native gas currency. This prevents network gas fee volatility and allows corporate finance departments to account for fees in a predictable stablecoin value.'
  },
  {
    category: 'Compliance & Safety',
    q: 'Are these transactions compliant and secure?',
    a: 'Absolutely. FactorFi integrates compliance sanctions screenings (OFAC filters) via our `onlyCompliant` smart contract modifiers. Every address is screen-verified before registering, preventing non-compliant entities from accessing capital.'
  },
  {
    category: 'Compliance & Safety',
    q: 'How does the protocol prevent double-factoring fraud?',
    a: 'When an invoice is signed and submitted, its unique cryptographic invoice hash is recorded in contract storage. Any attempt to upload a duplicate invoice with the same hash will be instantly reverted by the smart contract, blocking fraud on-chain.'
  },
  {
    category: 'Secondary Market',
    q: 'Can investors sell their invoice receivables early?',
    a: 'Yes. Invoices funded on FactorFi are tokenized on-chain. Investors who need immediate exit liquidity can list their active receivables on our Secondary OTC Marketplace for other capital sponsors to acquire at discount rates.'
  }
]

export default function FAQPage() {
  const [search, setSearch] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase()) ||
      faq.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="app-shell" style={{ background: 'var(--ff-bg)', color: 'var(--ff-text)' }}>
      <MarketingHeader />

      <main style={{ maxWidth: 800, margin: '60px auto', width: '100%', padding: '0 24px', flex: 1 }}>
        
        {/* Intro */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--ff-text-secondary)', fontSize: 14.5, marginTop: 8, maxWidth: 480, margin: '8px auto 0' }}>
            Find immediate answers regarding on-chain invoice factoring, compliance screening, gas abstraction, and CCTP bridging.
          </p>
        </div>

        {/* Search Bar */}
        <div className="card" style={{ padding: 12, background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Search size={18} style={{ color: 'var(--ff-text-muted)', marginLeft: 8 }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search questions, categories, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14 }}
          />
        </div>

        {/* Accordions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  background: openIndex === idx ? 'var(--ff-card-hover)' : 'var(--ff-surface)',
                  border: '1px solid var(--ff-border)',
                  cursor: 'pointer',
                  padding: '16px 20px',
                  transition: 'all var(--ff-transition)'
                }}
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: faq.category === 'General' ? 'var(--ff-primary)' : faq.category === 'Secondary Market' ? 'var(--ff-violet)' : 'var(--ff-success)', background: 'rgba(255,255,255,0.02)', padding: '2px 6px', borderRadius: 4 }}>
                      {faq.category}
                    </span>
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: 14.5 }}>{faq.q}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: openIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform var(--ff-transition)',
                      color: 'var(--ff-text-secondary)'
                    }}
                  />
                </div>

                {openIndex === idx && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--ff-border-subtle)', paddingTop: 12, color: 'var(--ff-text-secondary)', fontSize: 13.5, lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ff-text-muted)' }}>
              <HelpCircle size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
              No FAQ matches found for &quot;{search}&quot;.
            </div>
          )}
        </div>

        {/* Direct CTA */}
        <div className="card" style={{ marginTop: 48, background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, transparent 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 24, border: '1px solid var(--ff-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <MessageSquare size={24} style={{ color: 'var(--ff-primary)' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>Still have questions?</div>
              <div style={{ fontSize: 12.5, color: 'var(--ff-text-muted)' }}>Our support agents are available 24/7.</div>
            </div>
          </div>
          <a href="/contact" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
            Contact Support
          </a>
        </div>

      </main>

      <MarketingFooter />
    </div>
  )
}
