'use client'

import React, { useState, useEffect, useRef } from 'react'
import * as Icons from 'lucide-react'
import { useUnifiedAccount } from '@/lib/web3-provider'
import { formatUSDC, getExplorerAddressLink, truncateAddress } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  WORKSPACES, 
  ENVIRONMENTS, 
  NAVIGATION_SCHEMA, 
  NavigationSubItem 
} from '@/lib/navigation-schema'
import EmbeddedAuth from './EmbeddedAuth'
import { ConnectButton } from '@rainbow-me/rainbowkit'

// Dynamic icon resolver using Lucide icons
const renderIcon = (name: string, size = 16, className = '') => {
  const IconComponent = (Icons as any)[name]
  if (!IconComponent) return null
  return <IconComponent size={size} className={className} />
}

interface HeaderProps {
  activeView: string
  setActiveView: (view: any) => void
  onFaucetRequest: () => any
  faucetLoading: boolean
  startTour: () => void
  usdcBalance: bigint | undefined
}

export default function Header({
  activeView,
  setActiveView,
  onFaucetRequest,
  faucetLoading,
  startTour,
  usdcBalance
}: HeaderProps) {
  const { isConnected, address, circleEmail, providerType, logout } = useUnifiedAccount()

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [showEnvMenu, setShowEnvMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Command palette state
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Active configurations
  const [activeWorkspace, setActiveWorkspace] = useState(WORKSPACES[1]) // Sandbox Corp default
  const [activeEnvironment, setActiveEnvironment] = useState(ENVIRONMENTS[1]) // Sandbox Mode default

  // Notification state
  const [unreadNotifications, setUnreadNotifications] = useState(true)
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Settlement Completed', desc: 'Invoice #INV-2026-089 has been settled on-chain.', time: '5m ago', type: 'success' },
    { id: 2, title: 'Early Payout Funded', desc: '$45,000 USDC disbursed to Supplier Alpha.', time: '1h ago', type: 'info' },
    { id: 3, title: 'Compliance Verified', desc: 'SME Business Passport passed AML checks.', time: '4h ago', type: 'success' },
    { id: 4, title: 'Gas station refueled', desc: 'Gas sponsor balance topped up.', time: '1d ago', type: 'system' }
  ])

  // Refs for closing menus on click outside
  const workspaceRef = useRef<HTMLDivElement>(null)
  const envRef = useRef<HTMLDivElement>(null)
  const notifyRef = useRef<HTMLDivElement>(null)
  const helpRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const dropdownTimer = useRef<NodeJS.Timeout | null>(null)

  // Listen for K command to open search palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchModal(prev => !prev)
      } else if (e.key === '/') {
        // Only trigger if not typing in an input/textarea
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setShowSearchModal(true)
        }
      } else if (e.key === 'Escape') {
        setShowSearchModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setShowWorkspaceMenu(false)
      }
      if (envRef.current && !envRef.current.contains(e.target as Node)) {
        setShowEnvMenu(false)
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setShowHelpMenu(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Trigger login modal via custom event
  const triggerLoginModal = () => {
    window.dispatchEvent(new Event('open-circle-auth'))
  }

  // Trigger settings modal via custom event
  const triggerSettingsModal = () => {
    window.dispatchEvent(new Event('open-circle-settings'))
  }

  // Handle Workspace Switch
  const handleWorkspaceSwitch = (ws: typeof WORKSPACES[0]) => {
    setActiveWorkspace(ws)
    setShowWorkspaceMenu(false)
    toast.success(`Switched to workspace: ${ws.name}`)
  }

  // Handle Environment Switch
  const handleEnvironmentSwitch = (env: typeof ENVIRONMENTS[0]) => {
    setActiveEnvironment(env)
    setShowEnvMenu(false)
    toast.info(`Environment switched to: ${env.label}`)
  }

  // Handle Search item navigation
  const handleSearchSelect = (item: NavigationSubItem) => {
    setShowSearchModal(false)
    setSearchQuery('')
    if (item.viewId) {
      setActiveView(item.viewId)
    } else if (item.id === 'faucet') {
      onFaucetRequest()
    } else if (item.externalUrl) {
      window.open(item.externalUrl, '_blank')
    }
  }

  // Clipboard copy
  const handleCopyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    toast.success('Address copied to clipboard')
  }

  // Filter items in command palette
  const allSubItems = NAVIGATION_SCHEMA.flatMap(cat => cat.subItems)
  const filteredSearchItems = searchQuery.trim() === ''
    ? allSubItems.slice(0, 5)
    : allSubItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )

  return (
    <header className="navbar" style={{ borderBottom: '1px solid var(--ff-border)', background: 'rgba(2, 4, 8, 0.8)', backdropFilter: 'blur(20px)', zIndex: 100, height: 60, position: 'sticky', top: 0 }}>
      {/* Headless embedded auth modal manager mounted in background */}
      <EmbeddedAuth headless={true} />

      <div className="navbar-inner" style={{ height: '100%', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '100%' }}>
        
        {/* LEFT SECTION: Logo, Workspace Switcher & Env Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Brand Logo */}
          <div className="navbar-brand" onClick={() => setActiveView('landing')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
            <Icons.Hexagon className="text-primary animate-pulse" size={20} fill="currentColor" fillOpacity={0.2} strokeWidth={2.5} />
            <h1 style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, var(--ff-text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              FactorFi
            </h1>
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--ff-border)', opacity: 0.8 }} className="nav-separator" />

          {/* Workspace Switcher */}
          <div ref={workspaceRef} style={{ position: 'relative' }} className="workspace-switcher-wrapper">
            <button 
              onClick={() => setShowWorkspaceMenu(prev => !prev)}
              style={{
                background: 'none', border: 'none', padding: '4px 8px', borderRadius: 'var(--ff-radius-sm)',
                color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'background var(--ff-transition)'
              }}
              className="btn-workspace-trigger"
            >
              <span>{activeWorkspace.companyName}</span>
              <span style={{ fontSize: 10, padding: '1px 5px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, color: 'var(--ff-text-muted)', fontWeight: 500 }} className="btn-workspace-role">
                {activeWorkspace.role}
              </span>
              <Icons.ChevronDown size={12} color="var(--ff-text-muted)" />
            </button>

            {showWorkspaceMenu && (
              <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 220, background: '#090d16', border: '1px solid var(--ff-border)', borderRadius: 8, padding: 6, zIndex: 101, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', animation: 'ffDropdownFadeIn 150ms ease' }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', padding: '6px 10px', letterSpacing: '0.05em' }}>Workspaces</div>
                {WORKSPACES.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => handleWorkspaceSwitch(ws)}
                    style={{
                      width: '100%', background: activeWorkspace.id === ws.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                      border: 'none', borderRadius: 6, padding: '8px 10px', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', gap: 2, transition: 'all 0.15s'
                    }}
                    className="dropdown-item-workspace"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: activeWorkspace.id === ws.id ? 'var(--ff-primary)' : '#fff' }}>{ws.name}</span>
                      {activeWorkspace.id === ws.id && <Icons.Check size={12} color="var(--ff-primary)" />}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--ff-text-muted)' }}>{ws.companyName} • {ws.role}</span>
                  </button>
                ))}
                <div style={{ height: 1, background: 'var(--ff-border)', margin: '4px 0' }} />
                <button 
                  onClick={() => { setShowWorkspaceMenu(false); toast.info('Workspace creation feature coming soon'); }}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '8px 10px', borderRadius: 6, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ff-text-muted)' }}
                >
                  <Icons.Plus size={13} />
                  <span>Create new workspace</span>
                </button>
              </div>
            )}
          </div>

          {/* Environment Switcher */}
          <div ref={envRef} style={{ position: 'relative' }} className="env-switcher-wrapper">
            <button 
              onClick={() => setShowEnvMenu(prev => !prev)}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ff-border)', padding: '3px 8px', borderRadius: 20,
                color: activeEnvironment.color, fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}
              className="btn-env-trigger"
            >
              <span style={{ width: 5, height: 5, background: activeEnvironment.color, borderRadius: '50%' }} />
              <span>{activeEnvironment.label}</span>
              <Icons.ChevronDown size={10} color="var(--ff-text-muted)" />
            </button>

            {showEnvMenu && (
              <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 200, background: '#090d16', border: '1px solid var(--ff-border)', borderRadius: 8, padding: 6, zIndex: 101, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', animation: 'ffDropdownFadeIn 150ms ease' }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', padding: '6px 10px', letterSpacing: '0.05em' }}>Environments</div>
                {ENVIRONMENTS.map(env => (
                  <button
                    key={env.id}
                    onClick={() => handleEnvironmentSwitch(env)}
                    style={{
                      width: '100%', background: activeEnvironment.id === env.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                      border: 'none', borderRadius: 6, padding: '8px 10px', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', gap: 2, transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, background: env.color, borderRadius: '50%' }} />
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: activeEnvironment.id === env.id ? '#fff' : 'var(--ff-text-secondary)' }}>{env.label}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--ff-text-muted)', paddingLeft: 12 }}>{env.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER SECTION: Enterprise Grouped Navigation & Global Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          
          {/* Main Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="navbar-nav">
            {NAVIGATION_SCHEMA.map(cat => {
              const isActive = cat.subItems.some(sub => activeView === sub.viewId)
              return (
                <div 
                  key={cat.id} 
                  style={{ position: 'relative' }}
                  onMouseEnter={() => {
                    if (dropdownTimer.current) clearTimeout(dropdownTimer.current)
                    setActiveDropdown(cat.id)
                  }}
                  onMouseLeave={() => {
                    dropdownTimer.current = setTimeout(() => {
                      setActiveDropdown(null)
                    }, 150)
                  }}
                >
                  <button 
                    style={{
                      background: 'none', border: 'none', padding: '6px 12px', borderRadius: 'var(--ff-radius-sm)',
                      color: isActive ? '#fff' : 'var(--ff-text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s'
                    }}
                    className={`nav-tab-enterprise ${isActive ? 'active' : ''}`}
                  >
                    <span>{cat.label}</span>
                    <Icons.ChevronDown size={11} color="var(--ff-text-muted)" style={{ transform: activeDropdown === cat.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {/* MEGA MENU DROPDOWN */}
                  {activeDropdown === cat.id && (
                    <div 
                      style={{
                        position: 'absolute', top: '100%', left: cat.id === 'products' ? -50 : -20, marginTop: 4, 
                        width: cat.id === 'products' ? 360 : 280, background: '#070a12', 
                        border: '1px solid var(--ff-border)', borderRadius: 8, padding: 8, zIndex: 102,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.6)', animation: 'ffDropdownFadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                        {cat.subItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveDropdown(null)
                              if (item.viewId) {
                                setActiveView(item.viewId)
                              } else if (item.id === 'faucet') {
                                onFaucetRequest()
                              } else if (item.externalUrl) {
                                window.open(item.externalUrl, '_blank')
                              }
                            }}
                            style={{
                              width: '100%', background: activeView === item.viewId ? 'rgba(255,255,255,0.03)' : 'transparent',
                              border: 'none', borderRadius: 6, padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                              display: 'flex', alignItems: 'flex-start', gap: 10, transition: 'all 0.15s'
                            }}
                            className="dropdown-item-mega"
                          >
                            <div style={{ marginTop: 2, color: activeView === item.viewId ? 'var(--ff-primary)' : 'var(--ff-text-muted)' }}>
                              {renderIcon(item.icon, 16)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: activeView === item.viewId ? '#fff' : 'var(--ff-text)' }}>
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span style={{
                                    fontSize: 8.5, background: 'rgba(56, 189, 248, 0.15)', color: 'var(--ff-primary)',
                                    padding: '1px 5px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase'
                                  }}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: 10.5, color: 'var(--ff-text-muted)', lineHeight: 1.3 }}>
                                {item.description}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Quick Search trigger button */}
          <button
            onClick={() => setShowSearchModal(true)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ff-border)', borderRadius: 6,
              padding: '6px 10px 6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 20, cursor: 'pointer', color: 'var(--ff-text-muted)', fontSize: 11.5, height: 30, width: 140,
              transition: 'border-color var(--ff-transition)'
            }}
            className="search-bar-trigger"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icons.Search size={12.5} />
              <span>Search...</span>
            </div>
            <kbd style={{ fontSize: 9.5, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--ff-border)', padding: '1px 4px', borderRadius: 3, fontFamily: 'var(--ff-font-mono)' }}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* RIGHT SECTION: Notification Bell, Help Center, Wallet Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          
          {/* Notification Bell */}
          <div ref={notifyRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowNotifications(prev => !prev); setUnreadNotifications(false); }}
              style={{
                background: 'none', border: 'none', padding: 6, borderRadius: '50%',
                cursor: 'pointer', color: 'var(--ff-text-secondary)', display: 'flex', alignItems: 'center',
                position: 'relative', transition: 'background 0.2s'
              }}
              className="hover-bg-muted"
            >
              <Icons.Bell size={16} />
              {unreadNotifications && (
                <span style={{ position: 'absolute', top: 5, right: 6, width: 6, height: 6, background: 'var(--ff-danger)', borderRadius: '50%' }} />
              )}
            </button>

            {showNotifications && (
              <div style={{ position: 'absolute', top: '100%', right: -10, marginTop: 8, width: 300, background: '#090d16', border: '1px solid var(--ff-border)', borderRadius: 8, padding: 8, zIndex: 101, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', animation: 'ffDropdownFadeIn 150ms ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid var(--ff-border)', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Recent Notifications</span>
                  <button 
                    onClick={() => { setNotifications([]); setUnreadNotifications(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--ff-primary)', fontSize: 9.5, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Clear All
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--ff-text-muted)', fontSize: 11 }}>No unread alerts</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: 8, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--ff-border-subtle)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{n.title}</span>
                          <span style={{ fontSize: 9, color: 'var(--ff-text-muted)' }}>{n.time}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 10.5, color: 'var(--ff-text-muted)', lineHeight: 1.3 }}>{n.desc}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Center */}
          <div ref={helpRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowHelpMenu(prev => !prev)}
              style={{
                background: 'none', border: 'none', padding: 6, borderRadius: '50%',
                cursor: 'pointer', color: 'var(--ff-text-secondary)', display: 'flex', alignItems: 'center',
                transition: 'background 0.2s'
              }}
              className="hover-bg-muted"
            >
              <Icons.HelpCircle size={16} />
            </button>

            {showHelpMenu && (
              <div style={{ position: 'absolute', top: '100%', right: -10, marginTop: 8, width: 180, background: '#090d16', border: '1px solid var(--ff-border)', borderRadius: 8, padding: 6, zIndex: 101, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', animation: 'ffDropdownFadeIn 150ms ease' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', padding: '6px 10px', letterSpacing: '0.05em' }}>Help & Resources</div>
                <button 
                  onClick={() => { setShowHelpMenu(false); startTour(); }}
                  style={{ width: '100%', background: 'none', border: 'none', borderRadius: 6, padding: '8px 10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ff-text-secondary)', transition: 'background 0.15s' }}
                  className="dropdown-item-hover"
                >
                  <Icons.Play size={12} color="var(--ff-primary)" />
                  <span>Start Guide Tour</span>
                </button>
                <a 
                  href="/docs" target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, fontSize: 11.5, color: 'var(--ff-text-secondary)', textDecoration: 'none' }}
                  className="dropdown-item-hover"
                >
                  <Icons.FileText size={12} />
                  <span>Documentation</span>
                </a>
                <a 
                  href="/faq" target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, fontSize: 11.5, color: 'var(--ff-text-secondary)', textDecoration: 'none' }}
                  className="dropdown-item-hover"
                >
                  <Icons.HelpCircle size={12} />
                  <span>FAQ Support</span>
                </a>
                <div style={{ height: 1, background: 'var(--ff-border)', margin: '4px 0' }} />
                
                {/* Live System Operational Indicator */}
                <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, background: 'var(--ff-success)', borderRadius: '50%' }} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--ff-success)' }}>All Systems Operational</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--ff-border)', opacity: 0.8 }} />

          {/* Unified Profile Menu */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            {isConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Profile Trigger Button */}
                <button
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ff-border)', borderRadius: 20,
                    padding: '3px 10px 3px 6px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="profile-btn-trigger"
                >
                  {/* Avatar */}
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ff-primary), var(--ff-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.User size={11} color="#fff" />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff' }}>
                    {truncateAddress(address!)}
                  </span>
                  <Icons.ChevronDown size={10} color="var(--ff-text-muted)" />
                </button>

                {/* Profile menu dropdown content */}
                {showProfileMenu && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 280, background: '#090d16', border: '1px solid var(--ff-border)', borderRadius: 8, padding: 12, zIndex: 101, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 10, animation: 'ffDropdownFadeIn 150ms ease' }}>
                    
                    {/* Header info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 10, color: 'var(--ff-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Corporate ID</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>
                        {circleEmail || 'EOA Connected User'}
                      </span>
                    </div>

                    <div style={{ height: 1, background: 'var(--ff-border)' }} />

                    {/* Balance */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ff-border-subtle)', padding: 10, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>USDC Assets</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                          {usdcBalance !== undefined ? formatUSDC(usdcBalance) : '0.00'} USDC
                        </span>
                      </div>
                      <button 
                        disabled={faucetLoading}
                        onClick={onFaucetRequest}
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--ff-primary)',
                          borderRadius: 4, padding: '4px 8px', fontSize: 10, fontWeight: 700,
                          color: 'var(--ff-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <Icons.Zap size={10} className={faucetLoading ? 'spin' : ''} />
                        <span>Faucet</span>
                      </button>
                    </div>

                    {/* Address details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Wallet Address</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--ff-border-subtle)' }}>
                        <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--ff-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{address}</span>
                        <button onClick={handleCopyAddress} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-primary)', padding: 0 }}>
                          <Icons.Copy size={12} />
                        </button>
                      </div>
                      <a href={getExplorerAddressLink(address!)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: 'var(--ff-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <span>Verify on Explorer</span>
                        <Icons.ExternalLink size={10} />
                      </a>
                    </div>

                    <div style={{ height: 1, background: 'var(--ff-border)' }} />

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {providerType === 'circle' && (
                        <button 
                          onClick={() => { setShowProfileMenu(false); triggerSettingsModal(); }}
                          style={{ width: '100%', background: 'none', border: 'none', borderRadius: 6, padding: '6px 8px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ff-text-secondary)' }}
                          className="dropdown-item-hover"
                        >
                          <Icons.Settings size={12} />
                          <span>Account Settings</span>
                        </button>
                      )}
                      <button 
                        onClick={() => { setShowProfileMenu(false); logout(); }}
                        style={{ width: '100%', background: 'none', border: 'none', borderRadius: 6, padding: '6px 8px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ff-danger)' }}
                        className="dropdown-item-hover"
                      >
                        <Icons.LogOut size={12} />
                        <span>Disconnect Wallet</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            ) : (
              // Login buttons
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Circle Web2 Corporate Login Trigger */}
                <button
                  onClick={triggerLoginModal}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    borderColor: 'var(--ff-primary)', color: 'var(--ff-primary)',
                    background: 'rgba(0,117,255,0.04)', border: '1px solid var(--ff-primary)',
                    borderRadius: 'var(--ff-radius-sm)', padding: '5px 12px', fontSize: 11.5,
                    fontWeight: 600, cursor: 'pointer', height: 28, transition: 'all 0.2s'
                  }}
                  className="hover-glow"
                >
                  <Icons.Mail size={13} />
                  <span>Business Email Login</span>
                </button>

                {/* Legacy Web3 EOA Wallet trigger */}
                <div className="connect-btn-wrapper" data-tour="connect-wallet" style={{ display: 'flex', alignItems: 'center' }}>
                  <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* SEARCH COMMAND PALETTE MODAL */}
      {showSearchModal && (
        <div 
          onClick={() => setShowSearchModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            zIndex: 10000, paddingTop: 100, backdropFilter: 'blur(8px)'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: 550, width: '90%', background: '#0a0d16', border: '1px solid var(--ff-primary-subtle)', 
              borderRadius: 12, padding: 0, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              animation: 'ffDropdownFadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--ff-border)' }}>
              <Icons.Search size={18} color="var(--ff-primary)" />
              <input
                type="text"
                placeholder="Search pages, reports, and developer tools..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 13.5,
                  outline: 'none', width: '100%'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--ff-text-muted)', fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', fontFamily: 'var(--ff-mono)' }}>
                  ESC
                </span>
                <button 
                  onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}
                  style={{ 
                    border: 'none', 
                    background: 'none',
                    color: 'var(--ff-text-muted)', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: 4
                  }}
                  className="close-search-btn"
                >
                  <Icons.X size={14} />
                </button>
              </div>
            </div>

            {/* List results */}
            <div style={{ padding: 8, maxHeight: 300, overflowY: 'auto' }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', padding: '6px 12px', letterSpacing: '0.05em' }}>
                {searchQuery.trim() === '' ? 'Quick Links' : 'Search Results'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredSearchItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSearchSelect(item)}
                    style={{
                      width: '100%', background: 'none', border: 'none', borderRadius: 6,
                      padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'all 0.15s'
                    }}
                    className="dropdown-item-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ color: 'var(--ff-primary)' }}>
                        {renderIcon(item.icon, 15)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{item.title}</span>
                        <span style={{ fontSize: 10.5, color: 'var(--ff-text-muted)' }}>{item.description}</span>
                      </div>
                    </div>
                    <Icons.ChevronRight size={12} color="var(--ff-text-muted)" />
                  </button>
                ))}
                {filteredSearchItems.length === 0 && (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ff-text-muted)', fontSize: 12 }}>
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

            {/* Footer hints */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 18px', borderTop: '1px solid var(--ff-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--ff-text-muted)' }}>
                Use <kbd style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 3px', borderRadius: 2 }}>↑↓</kbd> keys to navigate, <kbd style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 3px', borderRadius: 2 }}>Enter</kbd> to select.
              </span>
              <span style={{ fontSize: 10, color: 'var(--ff-text-muted)' }}>
                FactorFi Treasury OS
              </span>
            </div>

          </div>
        </div>
      )}
    </header>
  )
}
