'use client'

import React, { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, Lock, Database, Landmark } from 'lucide-react'

interface FaqItem {
  question: string
  answer: string
  category: 'account' | 'underwriting' | 'blockchain'
}

export default function FaqDocsClient() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'account' | 'underwriting' | 'blockchain'>('all')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const faqs: FaqItem[] = [
    {
      category: 'account',
      question: "What is a Passkey and how does FactorFi use it?",
      answer: "A Passkey is a secure login method using your device's biometrics (TouchID/FaceID) or PIN. FactorFi uses Passkeys to create and secure your Modular Smart Contract Account (MSCA) gaslessly. You do not need to memorize passwords or handle raw private keys."
    },
    {
      category: 'underwriting',
      question: "How does the protocol prevent double factoring of invoices?",
      answer: "Every submitted invoice metadata is hashed (keccak256) along with the supplier's signature. This hash is permanently registered to our Smart Contract on the Arc network. If the same hash is submitted again, the contract immediately reverts, blocking duplication fraud."
    },
    {
      category: 'blockchain',
      question: "Why does the Arc network use USDC for gas?",
      answer: "Arc is designed from the ground up for stablecoin commerce. To eliminate the friction of acquiring native blockchain gas tokens (like ETH or MATIC) and prevent transaction fee volatility, Arc allows all gas fees to be settled directly in stable USDC."
    },
    {
      category: 'underwriting',
      question: "What is the dynamic discount fee rate?",
      answer: "When a supplier liquidates an invoice, a small discount premium (usually between 1.5% to 3.0%) is deducted from the payout. This premium is paid out to liquidity providers who fund the vault, representing their yield return."
    },
    {
      category: 'account',
      question: "Are my funds locked in the smart contract?",
      answer: "Suppliers receive payout funds directly to their smart wallet, which are instantly spendable or withdrawable. Liquidity providers can request to withdraw their USDC from the vaults at any time, subject to a standard 24-hour withdrawal cooldown."
    }
  ]

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory)

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
          Quick answers to common questions about accounts, biometric security, reverse factoring mechanics, and blockchain integrations.
        </p>
      </div>

      {/* Category selector */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Questions', icon: <HelpCircle size={14} /> },
          { id: 'account', label: 'Account & Security', icon: <Lock size={14} /> },
          { id: 'underwriting', label: 'Invoices & Factoring', icon: <Landmark size={14} /> },
          { id: 'blockchain', label: 'Gas & Blockchain', icon: <Database size={14} /> }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id as any); setExpandedIndex(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activeCategory === cat.id ? 'var(--ff-primary-subtle)' : 'rgba(255,255,255,0.02)',
              border: '1px solid',
              borderColor: activeCategory === cat.id ? 'var(--ff-primary)' : 'var(--ff-border)',
              borderRadius: 'var(--ff-radius-sm)',
              padding: '8px 16px',
              color: activeCategory === cat.id ? 'var(--ff-primary)' : 'var(--ff-text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--ff-transition)'
            }}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredFaqs.map((faq, idx) => {
          const isExpanded = expandedIndex === idx
          return (
            <div 
              key={idx}
              className="card"
              style={{ 
                padding: 0, 
                overflow: 'hidden',
                borderColor: isExpanded ? 'var(--ff-border-highlight)' : 'var(--ff-border)'
              }}
            >
              {/* Question Header */}
              <button
                onClick={() => toggleAccordion(idx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  padding: '20px 24px',
                  color: '#fff',
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16
                }}
              >
                <span>{faq.question}</span>
                {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--ff-primary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--ff-text-muted)' }} />}
              </button>

              {/* Answer Content */}
              {isExpanded && (
                <div style={{ 
                  padding: '0 24px 20px', 
                  fontSize: 13.5, 
                  color: 'var(--ff-text-secondary)', 
                  lineHeight: 1.6,
                  borderTop: '1px solid var(--ff-border-subtle)'
                }}>
                  {faq.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
