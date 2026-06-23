'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

function BreadcrumbsInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = searchParams.get('view')

  // Build the breadcrumb segments
  const segments: { label: string; href: string }[] = []

  // Always start with Home
  segments.push({ label: 'Home', href: '/' })

  if (pathname === '/') {
    if (view && view !== 'landing') {
      const formattedView = view.charAt(0).toUpperCase() + view.slice(1)
      segments.push({ label: 'App Portal', href: '/?view=dashboard' })
      if (view !== 'dashboard') {
        segments.push({ label: formattedView, href: `/?view=${view}` })
      }
    }
  } else {
    // Split pathname (e.g. /legal/privacy => ['legal', 'privacy'])
    const pathParts = pathname.split('/').filter(Boolean)
    let currentPath = ''

    pathParts.forEach((part, index) => {
      currentPath += `/${part}`
      
      // Formatting label
      let label = part.charAt(0).toUpperCase() + part.slice(1)
      if (part === 'faq') label = 'FAQ'
      if (part === 'docs') label = 'Documentation'
      if (part === 'legal') label = 'Legal'
      if (part === 'privacy') label = 'Privacy Policy'
      if (part === 'terms') label = 'Terms of Service'
      if (part === 'test-modals') label = 'Modals Sandbox'

      segments.push({ label, href: currentPath })
    })
  }

  // Schema.org structured data JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: segments.map((seg, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: seg.label,
      item: typeof window !== 'undefined' ? `${window.location.origin}${seg.href}` : seg.href
    }))
  }

  return (
    <>
      {/* Schema.org Injection for SEO Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 0',
          fontSize: '12.5px',
          color: 'var(--ff-text-muted)',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          borderBottom: '1px solid rgba(255,255,255,0.03)'
        }}
      >
        <ol style={{ display: 'flex', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap', gap: 6 }}>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1

            return (
              <li key={segment.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {index > 0 && (
                  <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.2)' }} aria-hidden="true" />
                )}

                {isLast ? (
                  <span
                    aria-current="page"
                    style={{
                      color: 'var(--ff-text)',
                      fontWeight: 500
                    }}
                  >
                    {index === 0 && <Home size={13} style={{ display: 'inline', marginRight: 4, transform: 'translateY(-1px)' }} />}
                    {segment.label}
                  </span>
                ) : (
                  <Link
                    href={segment.href}
                    style={{
                      color: 'var(--ff-text-muted)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontWeight: 400,
                      transition: 'color var(--ff-transition)',
                      outline: 'none',
                      borderRadius: '4px'
                    }}
                    className="breadcrumb-link focus-visible-ring"
                  >
                    {index === 0 && <Home size={13} style={{ display: 'inline', marginRight: 4, transform: 'translateY(-1px)' }} />}
                    {segment.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>

        <style jsx>{`
          .breadcrumb-link:hover {
            color: var(--ff-primary) !important;
          }
          .breadcrumb-link:focus-visible {
            outline: 2px solid var(--ff-primary);
            outline-offset: 4px;
          }
        `}</style>
      </nav>
    </>
  )
}

export default function Breadcrumbs() {
  return (
    <Suspense fallback={
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', fontSize: '12.5px', color: 'var(--ff-text-muted)', height: '42px' }}>
        <ol style={{ display: 'flex', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
          <li style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'var(--ff-text-muted)' }}>
              <Home size={13} style={{ display: 'inline', marginRight: 4, transform: 'translateY(-1px)' }} /> Home
            </span>
          </li>
        </ol>
      </nav>
    }>
      <BreadcrumbsInner />
    </Suspense>
  )
}
