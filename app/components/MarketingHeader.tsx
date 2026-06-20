'use client'

import Link from 'next/link'
import { Hexagon, ArrowRight, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="navbar-inner" style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div className="navbar-left">
          <Link href="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
            <h1>
              <Hexagon className="text-primary" size={22} fill="currentColor" fillOpacity={0.2} strokeWidth={2} />
              FactorFi
            </h1>
            <span className="brand-tag">Arc</span>
          </Link>

          <nav className="navbar-nav" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/docs" className="nav-tab" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              Docs
            </Link>
            <Link href="/faq" className="nav-tab" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              FAQ
            </Link>
            <Link href="/about" className="nav-tab" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              About
            </Link>
            <Link href="/contact" className="nav-tab" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              Contact
            </Link>
          </nav>
        </div>

        <div className="navbar-right">
          <div className="network-badge">
            <span className="dot" />
            Arc Testnet
          </div>
          <Link href="/?view=dashboard" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, height: 36, padding: '0 16px' }}>
            Launch App <ArrowRight size={14} />
          </Link>
          <button 
            className="btn btn-secondary mobile-menu-btn" 
            style={{ display: 'none', padding: '8px', minWidth: 'auto', border: 'none' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer" style={{
          position: 'fixed', top: 57, left: 0, right: 0, bottom: 0,
          background: 'var(--ff-bg)', zIndex: 100, display: 'flex', flexDirection: 'column',
          padding: 24, gap: 16, borderTop: '1px solid var(--ff-border)'
        }}>
          <Link href="/docs" className="nav-tab" style={{ fontSize: 16, padding: '12px 0', borderBottom: '1px solid var(--ff-border)' }} onClick={() => setMobileMenuOpen(false)}>
            Docs
          </Link>
          <Link href="/faq" className="nav-tab" style={{ fontSize: 16, padding: '12px 0', borderBottom: '1px solid var(--ff-border)' }} onClick={() => setMobileMenuOpen(false)}>
            FAQ
          </Link>
          <Link href="/about" className="nav-tab" style={{ fontSize: 16, padding: '12px 0', borderBottom: '1px solid var(--ff-border)' }} onClick={() => setMobileMenuOpen(false)}>
            About
          </Link>
          <Link href="/contact" className="nav-tab" style={{ fontSize: 16, padding: '12px 0', borderBottom: '1px solid var(--ff-border)' }} onClick={() => setMobileMenuOpen(false)}>
            Contact
          </Link>
          <Link href="/?view=dashboard" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 44, marginTop: 16 }} onClick={() => setMobileMenuOpen(false)}>
            Launch App <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Responsive adjustments */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .navbar-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: inline-flex !important;
          }
          .navbar-right .btn-primary {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
}
