'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, HelpCircle, ArrowUpRight, BookOpen, ShieldCheck } from 'lucide-react'

interface CtaProps {
  variant: 'supplier' | 'investor' | 'developer' | 'general' | 'support'
  layout?: 'banner' | 'card' | 'inline'
}

export default function CtaSystem({ variant, layout = 'card' }: CtaProps) {
  const getCtaContent = () => {
    switch (variant) {
      case 'supplier':
        return {
          title: 'Ready to liquidate your receivables?',
          description: 'Register your corporate supplier account and convert unpaid invoices to instant USDC. Gasless onboarding with automated compliance check.',
          primaryBtn: { label: 'Go to Supplier Portal', href: '/?view=supplier' },
          secondaryBtn: { label: 'Read Supplier Guide', href: '/docs' },
          badge: 'SME / Supplier Journey'
        }
      case 'investor':
        return {
          title: 'Provide trade liquidity for real-world yields',
          description: 'Deposit USDC into Asset-Backed FactorFi Vaults and fund verified corporate invoice receivables. Enjoy premium yield completely on-chain.',
          primaryBtn: { label: 'Explore Pools', href: '/?view=investor' },
          secondaryBtn: { label: 'How Vaults Work', href: '/docs' },
          badge: 'Capital Provider Journey'
        }
      case 'developer':
        return {
          title: 'Build automated commerce pipelines',
          description: 'Leverage our Developer-Controlled Wallets, compliance attestation screening, and Arc native USDC gas API endpoints in your enterprise workflows.',
          primaryBtn: { label: 'Read API Docs', href: '/docs' },
          secondaryBtn: { label: 'Create Corporate API Key', href: '/?view=anchor' },
          badge: 'Developer Integration Hub'
        }
      case 'support':
        return {
          title: 'Still have questions or stuck on a transaction?',
          description: 'Search our detailed self-help repository or create an instant support ticket. Our team is available to help resolve your operational conflicts.',
          primaryBtn: { label: 'Contact Support', href: '/contact' },
          secondaryBtn: { label: 'Browse FAQ', href: '/faq' },
          badge: 'Support Recovery Channel'
        }
      case 'general':
      default:
        return {
          title: 'Experience Gasless Trade Finance on Arc',
          description: 'Join the next generation commercial invoicing protocol. Complete compliance checks instantly and automate supply chain factoring in USDC.',
          primaryBtn: { label: 'Launch Application', href: '/?view=dashboard' },
          secondaryBtn: { label: 'Protocol Documentation', href: '/docs' },
          badge: 'Get Started'
        }
    }
  }

  const { title, description, primaryBtn, secondaryBtn, badge } = getCtaContent()

  if (layout === 'banner') {
    return (
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(0, 117, 255, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(0, 117, 255, 0.2)',
          borderRadius: '12px',
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24,
          margin: '24px 0'
        }}
      >
        <div style={{ flex: '1 1 500px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ff-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {badge}
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>{title}</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--ff-text-secondary)', margin: 0, lineHeight: 1.5 }}>{description}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={secondaryBtn.href} className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '13px', height: '40px', display: 'inline-flex', alignItems: 'center' }}>
            {secondaryBtn.label}
          </Link>
          <Link href={primaryBtn.href} className="btn btn-primary" style={{ textDecoration: 'none', fontSize: '13px', height: '40px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {primaryBtn.label} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  if (layout === 'inline') {
    return (
      <div style={{ borderTop: '1px solid var(--ff-border)', paddingTop: 24, marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>{title}</span>
          <span style={{ fontSize: '13px', color: 'var(--ff-text-muted)', marginLeft: 8 }}>— {description}</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href={primaryBtn.href} style={{ textDecoration: 'none', color: 'var(--ff-primary)', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {primaryBtn.label} <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="card" 
      style={{ 
        background: 'rgba(255,255,255,0.01)', 
        border: '1px solid var(--ff-border)', 
        padding: 24, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 16,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(0, 117, 255, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      
      <div>
        <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: 'var(--ff-primary)', background: 'rgba(0, 117, 255, 0.1)', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase', marginBottom: 12 }}>
          {badge}
        </div>
        <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 6px 0' }}>{title}</h4>
        <p style={{ fontSize: '13px', color: 'var(--ff-text-secondary)', margin: 0, lineHeight: 1.5 }}>{description}</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <Link href={primaryBtn.href} className="btn btn-primary" style={{ textDecoration: 'none', flex: 1, justifyContent: 'center', fontSize: '12.5px', height: '36px', display: 'flex', alignItems: 'center', gap: 4 }}>
          {primaryBtn.label} <ArrowRight size={13} />
        </Link>
        <Link href={secondaryBtn.href} className="btn btn-secondary" style={{ textDecoration: 'none', flex: 1, justifyContent: 'center', fontSize: '12.5px', height: '36px', display: 'flex', alignItems: 'center' }}>
          {secondaryBtn.label}
        </Link>
      </div>
    </div>
  )
}
