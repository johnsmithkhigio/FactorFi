'use client'

import Link from 'next/link'

export default function MarketingFooter() {
  return (
    <footer style={{
      borderTop: '1px solid var(--ff-border)',
      background: 'rgba(7, 12, 23, 0.4)',
      backdropFilter: 'blur(10px)',
      padding: '40px 24px',
      marginTop: 'auto',
      width: '100%'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 24,
        fontSize: 12.5,
        color: 'var(--ff-text-muted)'
      }}>
        <div>
          <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>© 2026 FactorFi Protocol.</span>
          </div>
          <div>Autonomous Trade Receivables & Factoring Flow. Deployed on Arc.</div>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#fff', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</span>
            <Link href="/docs" style={{ color: 'var(--ff-text-muted)', textDecoration: 'none' }} className="footer-link">Documentation</Link>
            <Link href="/faq" style={{ color: 'var(--ff-text-muted)', textDecoration: 'none' }} className="footer-link">FAQ</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#fff', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</span>
            <Link href="/about" style={{ color: 'var(--ff-text-muted)', textDecoration: 'none' }} className="footer-link">About Us</Link>
            <Link href="/contact" style={{ color: 'var(--ff-text-muted)', textDecoration: 'none' }} className="footer-link">Contact Support</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#fff', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resources</span>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ff-text-muted)', textDecoration: 'none' }} className="footer-link">Arcscan</a>
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ff-text-muted)', textDecoration: 'none' }} className="footer-link">Circle Faucet</a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#fff', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legal</span>
            <Link href="/legal/privacy" style={{ color: 'var(--ff-text-muted)', textDecoration: 'none' }} className="footer-link">Privacy Policy</Link>
            <Link href="/legal/terms" style={{ color: 'var(--ff-text-muted)', textDecoration: 'none' }} className="footer-link">Terms of Service</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-link:hover {
          color: var(--ff-primary) !important;
          transition: color var(--ff-transition);
        }
      `}</style>
    </footer>
  )
}
