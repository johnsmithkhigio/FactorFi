'use client'

import { useState } from 'react'
import MarketingHeader from '../components/MarketingHeader'
import MarketingFooter from '../components/MarketingFooter'
import Breadcrumbs from '../components/Breadcrumbs'
import RelatedContent from '../components/RelatedContent'
import { Send, CheckCircle2, MessageSquare, HelpCircle, Mail, Globe, Github } from 'lucide-react'
import { toast } from 'sonner'

export default function ContactClient() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('Support')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) {
      return toast.error('Please fill in all required form fields.')
    }
    
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      toast.success('Support ticket created successfully!', {
        description: 'Our team will respond to your registered email address within 12 hours.'
      })
    }, 1500)
  }

  return (
    <div className="app-shell" style={{ background: 'var(--ff-bg)', color: 'var(--ff-text)' }}>
      <MarketingHeader />

      <main id="main-content" style={{ maxWidth: 900, margin: '20px auto 60px', width: '100%', padding: '0 24px', flex: 1 }}>
        <Breadcrumbs />
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 20 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Contact & Support</h2>
          <p style={{ color: 'var(--ff-text-secondary)', fontSize: 14.5, marginTop: 8 }}>
            Have a question, feedback, or a bug report? Get in touch with our core team.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40 }} className="contact-grid">
          
          {/* Contact Form */}
          <section className="card" style={{ background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', padding: 28 }}>
            {isSubmitted ? (
              <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                <CheckCircle2 size={48} color="var(--ff-success)" className="pulse" />
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 18 }}>Message Sent Successfully</div>
                  <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13, marginTop: 6 }}>
                    Thank you for contacting FactorFi support. A confirmation has been sent to **{email}**.
                  </p>
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsSubmitted(false)
                    setName('')
                    setEmail('')
                    setMessage('')
                  }}
                  style={{ marginTop: 12, padding: '8px 16px', fontSize: 13 }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Your Name <span style={{ color: 'var(--ff-danger)' }}>*</span></label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="John Smith" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={isSubmitting}
                    style={{ background: '#0a0a0c', color: '#fff' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Email Address <span style={{ color: 'var(--ff-danger)' }}>*</span></label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="john@example.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    style={{ background: '#0a0a0c', color: '#fff' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Category</label>
                  <select 
                    className="form-input" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    disabled={isSubmitting}
                    style={{ background: '#0a0a0c', color: '#fff', cursor: 'pointer' }}
                  >
                    <option value="Support">Technical Support</option>
                    <option value="Bug">Bug Report</option>
                    <option value="Feature">Feature Request</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Message <span style={{ color: 'var(--ff-danger)' }}>*</span></label>
                  <textarea 
                    className="form-input" 
                    placeholder="Tell us what you need help with..." 
                    rows={4} 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    disabled={isSubmitting}
                    style={{ background: '#0a0a0c', color: '#fff', resize: 'vertical' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42 }}
                >
                  <Send size={16} /> {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </section>

          {/* Social Handles / Resource Links */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div className="card" style={{ background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', padding: 20 }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={18} color="var(--ff-primary)" />
                <span>Developer Channels</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ff-text-secondary)', fontSize: 13.5 }} className="hover-link">
                  <Github size={16} />
                  <span>FactorFi Protocol GitHub</span>
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ff-text-secondary)', fontSize: 13.5 }}>
                  <Mail size={16} />
                  <span>support@factorfi.protocol</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', padding: 20 }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: 15, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={18} color="var(--ff-violet)" />
                <span>Self-Help Center</span>
              </div>
              <p style={{ color: 'var(--ff-text-secondary)', fontSize: 12.5, lineHeight: 1.5, marginBottom: 12 }}>
                Try our self-help guides to resolve quick start conflicts or smart account transaction reverts instantly.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <a href="/docs" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '6px 0', fontSize: 12 }}>
                  Read Docs
                </a>
                <a href="/faq" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '6px 0', fontSize: 12 }}>
                  Search FAQ
                </a>
              </div>
            </div>

          </aside>

        </div>

        <RelatedContent currentPage="contact" />

      </main>

      <MarketingFooter />

      <style jsx global>{`
        .hover-link:hover {
          color: var(--ff-primary) !important;
        }
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
