import React from 'react'
import { Sparkles, Cpu, ShieldAlert } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog & Release Notes | FactorFi Docs',
  description: 'Track the latest feature updates, security patches, smart contract deployments, and client SDK adjustments for the FactorFi reverse factoring platform.',
  keywords: ['FactorFi Changelog', 'SDK Release Notes', 'Smart Contract Upgrades', 'Arc Testnet Deployments'],
  alternates: {
    canonical: 'https://factorfi.protocol/docs/changelog',
  },
  openGraph: {
    title: 'Changelog & Release Notes | FactorFi Docs',
    description: 'Track the latest feature updates, security patches, smart contract deployments, and client SDK adjustments for the FactorFi reverse factoring platform.',
    url: 'https://factorfi.protocol/docs/changelog',
    siteName: 'FactorFi Protocol',
    images: [
      {
        url: 'https://factorfi.protocol/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactorFi Release Changelog',
      },
    ],
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog & Release Notes | FactorFi Docs',
    description: 'Track the latest updates and release versions of the FactorFi protocol.',
    images: ['https://factorfi.protocol/og-image.png'],
  },
}

export default function ChangelogDocs() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://factorfi.protocol'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Docs',
        'item': 'https://factorfi.protocol/docs'
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': 'Changelog',
        'item': 'https://factorfi.protocol/docs/changelog'
      }
    ]
  }

  const techArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'headline': 'Changelog & Release Notes | FactorFi Docs',
    'description': 'Product changelog tracking all development releases, bug fixes, and security patches for FactorFi protocol.',
    'url': 'https://factorfi.protocol/docs/changelog',
    'inLanguage': 'en-US',
    'articleSection': 'Release Notes',
    'author': {
      '@type': 'Organization',
      'name': 'FactorFi Protocol'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleSchema) }}
      />
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
          Product Changelog
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
          Stay updated with the latest upgrades, security patches, and SDK releases deployed on the FactorFi trade finance platform.
        </p>
      </div>

      {/* Release Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40, borderLeft: '2px solid var(--ff-border)', paddingLeft: 24, marginLeft: 8 }}>
        
        {/* Version 1.2.0 */}
        <div style={{ position: 'relative' }}>
          {/* Connector Dot */}
          <div style={{
            position: 'absolute',
            left: -33,
            top: 4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--ff-bg)',
            border: '3px solid var(--ff-primary)',
            boxShadow: '0 0 8px var(--ff-primary-glow)'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>v1.2.0</span>
            <span style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>June 24, 2026</span>
            <span style={{ fontSize: 10, background: 'var(--ff-primary-subtle)', color: 'var(--ff-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Active</span>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--ff-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
            This release introduces the dynamic discount receivables vaults and adds support for gasless user transaction sponsorships on the Arc L1 test network.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Sparkles size={16} style={{ color: 'var(--ff-success)', marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 13 }}>
                <strong style={{ color: '#fff' }}>Features:</strong> Dynamic fee quotes and swaps via StableFX (USDC &lt;-&gt; EURC).
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Cpu size={16} style={{ color: 'var(--ff-primary)', marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 13 }}>
                <strong style={{ color: '#fff' }}>Developer:</strong> Released the TypeScript SDK adapter for Circle Developer-Controlled Wallets.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <ShieldAlert size={16} style={{ color: 'var(--ff-warning)', marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 13 }}>
                <strong style={{ color: '#fff' }}>Security:</strong> Added double factoring preventions using unique invoice keccak256 hash checks on-chain.
              </div>
            </div>
          </div>
        </div>

        {/* Version 1.1.0 */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: -33,
            top: 4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--ff-bg)',
            border: '3px solid var(--ff-border)'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ff-text-secondary)' }}>v1.1.0</span>
            <span style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>June 10, 2026</span>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--ff-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
            Introduced Passkey credential authentication flow (WebAuthn) and integrated database indexing support via SQLite.
          </p>
        </div>

      </div>

    </div>
  )
}
