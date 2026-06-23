'use client'

import React from 'react'
import Link from 'next/link'
import { BookOpen, HelpCircle, User, MessageSquare, Shield, Coins, FileText, ChevronRight } from 'lucide-react'

interface RelatedContentProps {
  currentPage: 'about' | 'contact' | 'docs' | 'faq' | 'privacy' | 'terms' | 'dashboard'
}

interface RecommendationItem {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  category: string
}

export default function RelatedContent({ currentPage }: RelatedContentProps) {
  // Master list of all product content nodes
  const allNodes: RecommendationItem[] = [
    {
      title: 'Protocol Documentation',
      description: 'Review the technical implementation parameters, smart contract ABI details, and architecture diagrams.',
      href: '/docs',
      icon: <BookOpen size={16} color="var(--ff-primary)" />,
      category: 'Guides'
    },
    {
      title: 'Frequently Asked Questions',
      description: 'Got quick questions about gas optimization, invoice tokenization, or OFAC AML screening?',
      href: '/faq',
      icon: <HelpCircle size={16} color="var(--ff-violet)" />,
      category: 'Self-Help'
    },
    {
      title: 'Our Company Story & Origins',
      description: 'Learn about the FactorFi protocol core vision, origins, and developer-centric trade finance mission.',
      href: '/about',
      icon: <User size={16} color="var(--ff-success)" />,
      category: 'Company'
    },
    {
      title: 'Get Help & Support Ticketing',
      description: 'Submit technical inquiries or consult with our systems team regarding custom integration disputes.',
      href: '/contact',
      icon: <MessageSquare size={16} color="var(--ff-primary)" />,
      category: 'Support'
    },
    {
      title: 'Privacy and Decentralization Policy',
      description: 'Understand how transaction hashes, encrypted keys, and client details are securely indexed.',
      href: '/legal/privacy',
      icon: <Shield size={16} color="var(--ff-violet)" />,
      category: 'Legal'
    },
    {
      title: 'Corporate Terms of Service',
      description: 'Read the legal parameters of on-chain asset-backed vault funding and invoice underwriting.',
      href: '/legal/terms',
      icon: <FileText size={16} color="var(--ff-success)" />,
      category: 'Legal'
    },
    {
      title: 'FactorFi Application Dashboard',
      description: 'Access supplier invoice onboarding, anchor corporate registration, and OTC receivables market.',
      href: '/?view=dashboard',
      icon: <Coins size={16} color="var(--ff-primary)" />,
      category: 'Portal'
    }
  ]

  // Calculate similarity rankings based on current page
  const recommendations = allNodes
    .filter(node => {
      // Don't recommend the page the user is currently reading
      if (currentPage === 'about' && node.href === '/about') return false
      if (currentPage === 'contact' && node.href === '/contact') return false
      if (currentPage === 'docs' && node.href === '/docs') return false
      if (currentPage === 'faq' && node.href === '/faq') return false
      if (currentPage === 'privacy' && node.href === '/legal/privacy') return false
      if (currentPage === 'terms' && node.href === '/legal/terms') return false
      if (currentPage === 'dashboard' && node.href.includes('view=')) return false
      return true
    })
    .sort((a, b) => {
      // Relate legal together
      if (currentPage === 'privacy' && a.category === 'Legal') return -1
      if (currentPage === 'terms' && a.category === 'Legal') return -1
      // Relate docs, faq and support together
      if (currentPage === 'docs' && (a.category === 'Self-Help' || a.category === 'Support')) return -1
      if (currentPage === 'faq' && (a.category === 'Guides' || a.category === 'Support')) return -1
      if (currentPage === 'contact' && (a.category === 'Self-Help' || a.category === 'Guides')) return -1
      return 1
    })
    .slice(0, 3) // Select top 3 relevant internal links

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40, borderTop: '1px solid var(--ff-border)', paddingTop: 32 }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', margin: 0 }}>
        Related Content & Workflows
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {recommendations.map(node => (
          <Link
            key={node.href}
            href={node.href}
            style={{ textDecoration: 'none' }}
            className="related-card-link"
          >
            <div
              className="card"
              style={{
                height: '100%',
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid var(--ff-border)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
                transition: 'all var(--ff-transition)',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ padding: 6, background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, display: 'flex' }}>
                    {node.icon}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {node.category}
                  </span>
                </div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>{node.title}</h4>
                <p style={{ fontSize: '12.5px', color: 'var(--ff-text-secondary)', margin: 0, lineHeight: 1.4 }}>{node.description}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', fontWeight: 600, color: 'var(--ff-primary)' }}>
                <span>Explore</span> <ChevronRight size={13} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx global>{`
        .related-card-link:hover .card {
          border-color: var(--ff-primary) !important;
          transform: translateY(-2px);
          background: rgba(0, 117, 255, 0.02) !important;
        }
      `}</style>
    </div>
  )
}
