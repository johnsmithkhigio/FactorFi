'use client'

import React from 'react'
import { Activity, ShieldCheck, Database, RefreshCw, Cpu } from 'lucide-react'

export default function StatusDocs() {
  const services = [
    { name: "REST API Gateway", status: "Operational", uptime: "99.98%", load: "140ms" },
    { name: "Smart Contract Relayer", status: "Operational", uptime: "100.00%", load: "850ms" },
    { name: "CCTP Bridge Watcher", status: "Operational", uptime: "99.95%", load: "1.2s" },
    { name: "SQLite Ledger Indexer", status: "Operational", uptime: "100.00%", load: "15ms" }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }} className="status-header">
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
            System Operational Status
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
            Real-time status updates, uptime benchmarks, and incident histories of all FactorFi services and backend processing queues.
          </p>
        </div>

        {/* Global indicator pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          background: 'rgba(52,211,153,0.1)',
          border: '1px solid rgba(52,211,153,0.2)',
          borderRadius: 'var(--ff-radius-full)',
          color: 'var(--ff-success)',
          fontSize: 13.5,
          fontWeight: 600,
          whiteSpace: 'nowrap'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ff-success)', boxShadow: '0 0 8px var(--ff-success)' }} />
          All Systems Operational
        </div>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="status-grid">
        {services.map((svc, idx) => (
          <div key={idx} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>{svc.name}</span>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ff-text-secondary)' }}>
                <span>Uptime: <strong>{svc.uptime}</strong></span>
                <span>•</span>
                <span>Latency: <strong>{svc.load}</strong></span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ff-success)', fontWeight: 600 }}>
              <ShieldCheck size={16} /> Operational
            </div>
          </div>
        ))}
      </div>

      {/* Mock Performance Chart */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, color: '#fff', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} style={{ color: 'var(--ff-primary)' }} /> Live Network Metrics
        </h3>
        
        {/* Visual bar graph representation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { metric: "Active Subscribed MSCA Smart Accounts", value: "2,091 Accounts", progress: 75, color: 'var(--ff-primary)' },
            { metric: "Settled Invoice Volume (USDC)", value: "$1,450,000 USDC", progress: 60, color: 'var(--ff-violet)' },
            { metric: "Relayed Smart Contract UserOps", value: "48,938 Transactions", progress: 90, color: 'var(--ff-success)' }
          ].map((bar, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>{bar.metric}</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{bar.value}</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${bar.progress}%`, height: '100%', background: bar.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident History List */}
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Incident History (Past 30 Days)</h3>
        <div style={{ borderLeft: '2px solid var(--ff-border)', paddingLeft: 24, marginLeft: 8, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>Arc Testnet Network Upgrade Re-sync</span>
              <span style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>June 18, 2026</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              The Arc L1 test network underwent structural finality upgrades. The SQLite indexer caught up within 12 minutes. No transaction losses occurred.
            </p>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>Circle CCTP Attestation Slowdown</span>
              <span style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>June 05, 2026</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              Cross-chain bridging transactions from Ethereum Sepolia Sepolia to Arc Testnet experienced validation delays due to high network gas fees on Sepolia. Resolving within 45 minutes.
            </p>
          </div>
        </div>
      </div>

      {/* Global CSS Inject */}
      <style jsx>{`
        @media (max-width: 768px) {
          .status-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .status-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
