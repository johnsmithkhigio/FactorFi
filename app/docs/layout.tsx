'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import MarketingHeader from '../components/MarketingHeader'
import MarketingFooter from '../components/MarketingFooter'
import { 
  Search, BookOpen, Terminal, Code, Cpu, Activity, HelpCircle, 
  LifeBuoy, FileText, ChevronRight, MessageSquare, Send, X, 
  ThumbsUp, ThumbsDown, Check, Copy, Moon, Sun, ArrowRight, Menu
} from 'lucide-react'

// Define layout & navigation groups
interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  
  // AI assistant state
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [aiHistory, setAiHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; code?: string }>>([
    { 
      sender: 'ai', 
      text: "Hello! I am the FactorFi AI Swarm Assistant. Ask me anything about reverse factoring smart contracts, Circle CCTP bridges, or Arc Testnet deployment. How can I help you build today?" 
    }
  ])
  const [isAiTyping, setIsAiTyping] = useState(false)

  // Feedback widget state
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  // Track scroll position for reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100
        setScrollProgress(progress)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sidebar navigation structure
  const navigation: NavGroup[] = [
    {
      title: "User Hub",
      items: [
        { label: "User Onboarding", href: "/docs/user", icon: <BookOpen size={16} /> },
        { label: "Frequently Asked Questions", href: "/docs/faq", icon: <HelpCircle size={16} /> },
      ]
    },
    {
      title: "Developer Hub",
      items: [
        { label: "Introduction", href: "/docs/developer", icon: <Terminal size={16} /> },
        { label: "API Reference", href: "/docs/api", icon: <Code size={16} /> },
        { label: "Code Examples", href: "/docs/examples", icon: <FileText size={16} /> },
        { label: "Architecture & Diagrams", href: "/docs/architecture", icon: <Cpu size={16} /> },
        { label: "System Status", href: "/docs/status", icon: <Activity size={16} /> },
      ]
    },
    {
      title: "Resources & Help",
      items: [
        { label: "Changelog", href: "/docs/changelog", icon: <FileText size={16} /> },
        { label: "Support & Discord", href: "/docs/support", icon: <LifeBuoy size={16} /> },
      ]
    }
  ]

  // Flattened search items
  const searchItems = [
    { category: 'User Hub', title: 'Getting Started with Underwriting', href: '/docs/user#getting-started' },
    { category: 'User Hub', title: 'Tutorials: Dynamic Fee Discounting', href: '/docs/user#tutorials' },
    { category: 'Developer Hub', title: 'Arc L1 Testnet configuration', href: '/docs/developer#arc-setup' },
    { category: 'Developer Hub', title: 'Circle Developer Wallets setup', href: '/docs/developer#circle-wallets' },
    { category: 'API Reference', title: 'POST /api/invoices/underwrite', href: '/docs/api#post-underwrite' },
    { category: 'API Reference', title: 'GET /api/vaults/yield', href: '/docs/api#get-yield' },
    { category: 'Architecture', title: 'Reverse Factoring Escrow Data Flow', href: '/docs/architecture#escrow-flow' },
    { category: 'Architecture', title: 'CCTP Cross-chain Bridge Contract Topology', href: '/docs/architecture#bridge-topology' },
  ]

  const filteredSearch = searchItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Simple mock AI documentation response logic
  const handleAiSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiMessage.trim()) return

    const userText = aiMessage
    setAiHistory(prev => [...prev, { sender: 'user', text: userText }])
    setAiMessage('')
    setIsAiTyping(true)

    setTimeout(() => {
      let aiText = "I parsed your query. Here is what I found in the FactorFi docs: "
      let aiCode = undefined

      const norm = userText.toLowerCase()
      if (norm.includes("how to integrate") || norm.includes("quickstart") || norm.includes("install")) {
        aiText = "To integrate the FactorFi SDK, install ethers and configure your environment pointing to the Arc Testnet:"
        aiCode = `npm install ethers dotenv\n\n# Configure env:\nRPC_URL="https://rpc.testnet.arc.network"\nFACTORFI_ADDRESS="0xc8d9889a6b49e96951309fc0291e652d005be3f9"`
      } else if (norm.includes("cctp") || norm.includes("bridge") || norm.includes("crosschain")) {
        aiText = "FactorFi uses Circle CCTP via Bridge Kit. LP funds are burned on the source chain and native Arc USDC is minted on-chain. Here is an example setup:"
        aiCode = `import { bridgeUSDC } from '@circle-fin/bridge-kit';\n\nconst tx = await bridgeUSDC({\n  sourceChain: 'ethereum-sepolia',\n  targetChain: 'arc-testnet',\n  amount: '1000.00',\n  recipient: mscaAddress\n});`
      } else if (norm.includes("api") || norm.includes("invoice") || norm.includes("underwrite")) {
        aiText = "You can interact with invoices using the API. Invoices are stored in the SQLite database and signed on-chain by validators. Example API request:"
        aiCode = `const res = await fetch('/api/invoices/underwrite', {\n  method: 'POST',\n  body: JSON.stringify({\n    invoiceId: 'inv_109283',\n    premiumBps: 200 // 2.0% fee\n  })\n});`
      } else if (norm.includes("underwriter") || norm.includes("mechanics") || norm.includes("fee")) {
        aiText = "Underwriters earn a portion of the 0.5% protocol fee for verifying debtor liability. A standard underwrite transaction registers the invoice hash to prevent double factoring."
      } else if (norm.includes("arc") || norm.includes("rpc") || norm.includes("chain")) {
        aiText = "The Arc L1 chain is configured with Chain ID 5042002. It utilizes USDC as the native gas token."
        aiCode = `Network: Arc Testnet\nRPC URL: https://rpc.testnet.arc.network\nChain ID: 5042002\nCurrency: USDC`
      } else {
        aiText = "The FactorFi reverse factoring engine is deployed on Arc Testnet. Invoices are secured via ECDSA signatures and liquidated dynamically through liquidity pools. Let me know if you need specific SDK examples!"
      }

      setAiHistory(prev => [...prev, { sender: 'ai', text: aiText, code: aiCode }])
      setIsAiTyping(false)
    }, 1200)
  }

  // Get active navigation group title based on path
  const getActiveHub = () => {
    if (pathname.includes('/user') || pathname.includes('/faq')) return 'User Hub'
    if (pathname.includes('/developer') || pathname.includes('/api') || pathname.includes('/examples') || pathname.includes('/architecture') || pathname.includes('/status')) return 'Developer Hub'
    return 'Documentation Hub'
  }

  return (
    <div className="app-shell" style={{ 
      background: theme === 'dark' ? 'var(--ff-bg)' : '#f8fafc', 
      color: theme === 'dark' ? 'var(--ff-text)' : '#0f172a',
      transition: 'background var(--ff-transition)'
    }}>
      {/* Reading Progress Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '3px',
        background: 'linear-gradient(90deg, var(--ff-primary), var(--ff-violet))',
        width: `${scrollProgress}%`,
        zIndex: 1000,
        transition: 'width 100ms ease-out'
      }} />

      <MarketingHeader />

      {/* Main Container */}
      <div style={{ 
        maxWidth: 1400, 
        margin: '0 auto', 
        width: '100%', 
        padding: '0 24px 80px',
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        
        {/* Docs Subheader bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0',
          borderBottom: '1px solid var(--ff-border)',
          marginBottom: 32,
          gap: 16
        }}>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ff-text-secondary)' }}>
            <Link href="/" style={{ color: 'var(--ff-primary)', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
            <ChevronRight size={14} />
            <Link href="/docs" style={{ color: 'var(--ff-primary)', textDecoration: 'none', fontWeight: 600 }}>Docs</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--ff-text-muted)' }}>{getActiveHub()}</span>
          </div>

          {/* Quick Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search Input trigger */}
            <button 
              onClick={() => setShowSearchModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid var(--ff-border)',
                borderRadius: 'var(--ff-radius-sm)',
                padding: '8px 16px',
                color: 'var(--ff-text-muted)',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                width: 240
              }}
            >
              <Search size={14} />
              <span>Search everywhere...</span>
              <span style={{ 
                marginLeft: 'auto', 
                fontSize: 10, 
                background: 'rgba(255,255,255,0.08)', 
                padding: '2px 6px', 
                borderRadius: 4,
                color: 'var(--ff-text-secondary)'
              }}>Ctrl+K</span>
            </button>

            {/* Dark/Light mode toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--ff-border)',
                borderRadius: 'var(--ff-radius-sm)',
                padding: 8,
                color: 'var(--ff-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Dynamic Doc Hub Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 48 }} className="docs-grid">
          
          {/* Persistent Sticky Sidebar */}
          <aside style={{ position: 'sticky', top: 100, height: 'calc(100vh - 140px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, paddingRight: 8 }}>
            
            {/* Hub Selector tabs */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 'var(--ff-radius-sm)', border: '1px solid var(--ff-border)' }}>
              <Link 
                href="/docs/user"
                style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  padding: '6px 12px', 
                  borderRadius: 'var(--ff-radius-xs)', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  textDecoration: 'none',
                  color: pathname.includes('/user') || pathname.includes('/faq') ? 'var(--ff-primary)' : 'var(--ff-text-muted)',
                  background: pathname.includes('/user') || pathname.includes('/faq') ? 'rgba(255,255,255,0.05)' : 'transparent'
                }}
              >
                User Hub
              </Link>
              <Link 
                href="/docs/developer"
                style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  padding: '6px 12px', 
                  borderRadius: 'var(--ff-radius-xs)', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  textDecoration: 'none',
                  color: pathname.includes('/developer') || pathname.includes('/api') || pathname.includes('/examples') || pathname.includes('/architecture') || pathname.includes('/status') ? 'var(--ff-primary)' : 'var(--ff-text-muted)',
                  background: pathname.includes('/developer') || pathname.includes('/api') || pathname.includes('/examples') || pathname.includes('/architecture') || pathname.includes('/status') ? 'rgba(255,255,255,0.05)' : 'transparent'
                }}
              >
                Developer Hub
              </Link>
            </div>

            {/* Sidebar navigation groups */}
            {navigation.map((group, gIdx) => (
              <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ 
                  fontSize: 10.5, 
                  fontWeight: 700, 
                  color: 'var(--ff-text-muted)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  paddingLeft: 8, 
                  marginBottom: 4 
                }}>
                  {group.title}
                </span>

                {group.items.map((item, idx) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={idx}
                      href={item.href}
                      style={{
                        background: isActive ? 'var(--ff-primary-subtle)' : 'transparent',
                        color: isActive ? 'var(--ff-primary)' : 'var(--ff-text-secondary)',
                        padding: '8px 12px',
                        borderRadius: 'var(--ff-radius-sm)',
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        textDecoration: 'none',
                        transition: 'all var(--ff-transition)'
                      }}
                      className="sidebar-link"
                    >
                      {item.icon}
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <ChevronRight size={12} style={{ opacity: isActive ? 1 : 0 }} />
                    </Link>
                  )
                })}
              </div>
            ))}
          </aside>

          {/* Active Hub Main Content Section */}
          <section style={{ minWidth: 0 }}>
            {children}
            
            {/* Helpful Feedback Widget */}
            <div style={{ 
              marginTop: 64, 
              paddingTop: 32, 
              borderTop: '1px solid var(--ff-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20
            }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Was this page helpful?</h4>
                <p style={{ fontSize: 12.5, color: 'var(--ff-text-muted)' }}>Help us improve the developer experience at FactorFi.</p>
              </div>

              {!feedbackSubmitted ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={() => setFeedbackSubmitted(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--ff-border)',
                      borderRadius: 'var(--ff-radius-sm)',
                      padding: '8px 16px',
                      fontSize: 13,
                      color: 'var(--ff-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--ff-transition)'
                    }}
                    className="feedback-btn"
                  >
                    <ThumbsUp size={14} /> Yes
                  </button>
                  <button 
                    onClick={() => setFeedbackSubmitted(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--ff-border)',
                      borderRadius: 'var(--ff-radius-sm)',
                      padding: '8px 16px',
                      fontSize: 13,
                      color: 'var(--ff-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--ff-transition)'
                    }}
                    className="feedback-btn"
                  >
                    <ThumbsDown size={14} /> No
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ff-success)', fontSize: 13.5, fontWeight: 600 }}>
                  <Check size={16} /> Thank you for your feedback!
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <MarketingFooter />

      {/* Floating AI Documentation Assistant */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 500 }}>
        {!isAiOpen ? (
          <button
            onClick={() => setIsAiOpen(true)}
            style={{
              background: 'linear-gradient(135deg, var(--ff-primary), var(--ff-violet))',
              border: 'none',
              borderRadius: '50%',
              width: 56,
              height: 56,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(56,189,248,0.4)',
              transition: 'transform 300ms var(--ff-transition-bounce)'
            }}
            className="ai-chat-btn"
          >
            <MessageSquare size={22} />
          </button>
        ) : (
          <div style={{
            width: 380,
            height: 500,
            background: 'var(--ff-bg)',
            border: '1px solid var(--ff-border-highlight)',
            borderRadius: 'var(--ff-radius-lg)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Header */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '16px 20px',
              borderBottom: '1px solid var(--ff-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ff-success)' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>FactorFi AI Assistant</span>
              </div>
              <button 
                onClick={() => setIsAiOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--ff-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {aiHistory.map((msg, idx) => (
                <div key={idx} style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{
                    background: msg.sender === 'user' ? 'var(--ff-primary-subtle)' : 'rgba(255,255,255,0.03)',
                    color: msg.sender === 'user' ? 'var(--ff-primary)' : 'var(--ff-text)',
                    border: '1px solid',
                    borderColor: msg.sender === 'user' ? 'rgba(56,189,248,0.2)' : 'var(--ff-border)',
                    borderRadius: 'var(--ff-radius-sm)',
                    padding: '10px 14px',
                    fontSize: 13,
                    lineHeight: 1.5
                  }}>
                    {msg.text}
                  </div>
                  {msg.code && (
                    <pre style={{
                      background: '#000',
                      padding: 12,
                      borderRadius: 8,
                      fontFamily: 'var(--ff-mono)',
                      fontSize: 11,
                      color: 'var(--ff-primary)',
                      overflowX: 'auto',
                      border: '1px solid var(--ff-border)'
                    }}>
                      {msg.code}
                    </pre>
                  )}
                </div>
              ))}
              {isAiTyping && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 4, padding: 8 }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" style={{ animationDelay: '200ms' }} />
                  <div className="typing-dot" style={{ animationDelay: '400ms' }} />
                </div>
              )}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleAiSend} style={{
              padding: 16,
              borderTop: '1px solid var(--ff-border)',
              background: 'rgba(0,0,0,0.1)',
              display: 'flex',
              gap: 8
            }}>
              <input 
                type="text"
                value={aiMessage}
                onChange={e => setAiMessage(e.target.value)}
                placeholder="Ask about smart contracts, SDK, RPC..."
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--ff-border)',
                  borderRadius: 'var(--ff-radius-sm)',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--ff-primary)',
                  border: 'none',
                  borderRadius: 'var(--ff-radius-sm)',
                  padding: '8px 12px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            style={{
              background: 'var(--ff-bg)',
              border: '1px solid var(--ff-border-highlight)',
              borderRadius: 'var(--ff-radius-lg)',
              width: '90%',
              maxWidth: 600,
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input area */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--ff-border)' }}>
              <Search size={18} style={{ color: 'var(--ff-text-muted)', marginRight: 12 }} />
              <input 
                type="text"
                autoFocus
                placeholder="Search documentation, guides, or API endpoints..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: 16,
                  outline: 'none'
                }}
              />
              <button 
                onClick={() => setShowSearchModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 8px',
                  color: 'var(--ff-text-muted)',
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                ESC
              </button>
            </div>

            {/* Results list */}
            <div style={{ maxHeight: 350, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredSearch.length > 0 ? (
                filteredSearch.map((item, idx) => (
                  <Link 
                    key={idx}
                    href={item.href}
                    onClick={() => setShowSearchModal(false)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      padding: '10px 16px',
                      borderRadius: 'var(--ff-radius-sm)',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid transparent',
                      textDecoration: 'none',
                      transition: 'all var(--ff-transition)'
                    }}
                    className="search-result-item"
                  >
                    <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--ff-primary)', fontWeight: 600 }}>{item.category}</span>
                    <span style={{ fontSize: 13.5, color: '#fff', fontWeight: 500 }}>{item.title}</span>
                  </Link>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ff-text-muted)', fontSize: 13 }}>
                  No documentation found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS Inject */}
      <style jsx global>{`
        .search-result-item:hover {
          background: rgba(56,189,248,0.05) !important;
          border-color: rgba(56,189,248,0.2) !important;
        }
        .ai-chat-btn:hover {
          transform: scale(1.08) rotate(4deg);
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ff-text-muted);
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .feedback-btn:hover {
          color: #fff !important;
          border-color: var(--ff-border-highlight) !important;
          background: rgba(255,255,255,0.06) !important;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (max-width: 992px) {
          .docs-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          aside {
            position: relative !important;
            top: 0 !important;
            height: auto !important;
            overflow-y: visible !important;
          }
        }
      `}</style>
    </div>
  )
}
