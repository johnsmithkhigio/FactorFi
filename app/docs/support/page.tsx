'use client'

import React, { useState } from 'react'
import { LifeBuoy, MessageSquare, Send, CheckCircle, ExternalLink } from 'lucide-react'

export default function SupportDocs() {
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketBody, setTicketBody] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketSubject.trim() || !ticketBody.trim()) return

    setSubmitted(true)
    setTimeout(() => {
      setTicketSubject('')
      setTicketBody('')
    }, 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
          Support & Community Hub
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
          Need assistance with integration nodes, smart contract deployments, or corporate invoicing? Our support team and global developer community are here to help.
        </p>
      </div>

      {/* Grid: Live Discord & Ticketing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40 }} className="support-grid">
        
        {/* Support ticket submission form */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, color: '#fff', fontWeight: 600, marginBottom: 8 }}>Submit Developer Ticket</h2>
          <p style={{ fontSize: 13, color: 'var(--ff-text-secondary)', marginBottom: 20 }}>
            Open a high-priority ticket directly with our DX engineering desk. Response times average under 1 hour.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: 'var(--ff-text)' }}>Subject</label>
                <input 
                  type="text" 
                  value={ticketSubject}
                  onChange={e => setTicketSubject(e.target.value)}
                  placeholder="e.g. Issue deploying MSCA on Arc Testnet" 
                  style={{ background: '#000', border: '1px solid var(--ff-border)', padding: 10, borderRadius: 6, color: '#fff', fontSize: 13 }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: 'var(--ff-text)' }}>Details</label>
                <textarea 
                  value={ticketBody}
                  onChange={e => setTicketBody(e.target.value)}
                  rows={4} 
                  placeholder="Provide transaction hashes, RPC node details, or error codes..."
                  style={{ background: '#000', border: '1px solid var(--ff-border)', padding: 10, borderRadius: 6, color: '#fff', fontSize: 13, resize: 'none' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: 'var(--ff-primary)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: 'var(--ff-radius-sm)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Send size={14} /> Submit Ticket
              </button>
            </form>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '32px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              color: 'var(--ff-success)'
            }}>
              <CheckCircle size={32} />
              <div style={{ fontWeight: 600, fontSize: 15 }}>Ticket Submitted Successfully!</div>
              <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', maxWidth: 280 }}>
                Our support engineers have received your inquiry. Check your developer console notifications for updates.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                style={{ background: 'none', border: 'none', color: 'var(--ff-primary)', cursor: 'pointer', fontSize: 13, marginTop: 8 }}
              >
                Submit another ticket
              </button>
            </div>
          )}
        </div>

        {/* Community & Discord */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: 16, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={18} style={{ color: 'var(--ff-primary)' }} /> Join Developer Discord
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              Connect with 5,000+ trade finance developers, treasury managers, and smart contract engineers. Get realtime troubleshooting help in our technical support channels.
            </p>
            <a 
              href="https://discord.gg" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--ff-border)',
                borderRadius: 'var(--ff-radius-sm)',
                padding: '8px 16px',
                fontSize: 13,
                color: 'var(--ff-text)',
                textDecoration: 'none',
                transition: 'all var(--ff-transition)'
              }}
              className="discord-btn"
            >
              Open Discord <ExternalLink size={14} />
            </a>
          </div>
        </div>

      </div>

      {/* Global CSS Inject */}
      <style jsx global>{`
        .discord-btn:hover {
          border-color: var(--ff-border-highlight) !important;
          background: rgba(255,255,255,0.06) !important;
        }
        @media (max-width: 768px) {
          .support-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
