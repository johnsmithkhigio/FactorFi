'use client'

import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useReadContract } from 'wagmi'
import { LayoutDashboard, FileText, Building2, TrendingUp, Shield, ArrowRightLeft, ExternalLink, Hexagon, Home } from 'lucide-react'
import { USDC_ADDRESS_ARC, usdcAbi, FACTORFI_CONTRACT_ADDRESS, factorFiAbi } from '@/lib/contracts'
import { formatUSDC, getExplorerAddressLink } from '@/lib/utils'

import LandingView from './views/LandingView'
import DashboardView from './views/DashboardView'
import SupplierView from './views/SupplierView'
import AnchorView from './views/AnchorView'
import InvestorView from './views/InvestorView'
import BridgeView from './views/BridgeView'
import CreditView from './views/CreditView'

import { useUnifiedAccount } from '@/lib/web3-provider'
import EmbeddedAuth from './components/EmbeddedAuth'
import ComplianceModal from './components/ComplianceModal'

type View = 'landing' | 'dashboard' | 'supplier' | 'anchor' | 'investor' | 'bridge' | 'credit'

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'landing', label: 'Home', icon: <Home size={16} /> },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'supplier', label: 'Supplier', icon: <FileText size={16} /> },
  { id: 'anchor', label: 'Anchor', icon: <Building2 size={16} /> },
  { id: 'investor', label: 'Invest', icon: <TrendingUp size={16} /> },
  { id: 'bridge', label: 'Bridge', icon: <ArrowRightLeft size={16} /> },
  { id: 'credit', label: 'Credit', icon: <Shield size={16} /> },
]

export default function FactorFiApp() {
  const [activeView, setActiveView] = useState<View>('landing')
  const { address, isConnected, providerType } = useUnifiedAccount()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const view = params.get('view') as View | null
      if (view && ['landing', 'dashboard', 'supplier', 'anchor', 'investor', 'bridge', 'credit'].includes(view)) {
        setActiveView(view)
      }
    }
  }, [])

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS_ARC,
    abi: usdcAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  })

  const { data: isCompliant, refetch: refetchCompliance } = useReadContract({
    address: FACTORFI_CONTRACT_ADDRESS,
    abi: factorFiAbi,
    functionName: 'isCompliant',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const renderView = () => {
    switch (activeView) {
      case 'landing': return <LandingView onLaunchApp={(v) => setActiveView(v)} />
      case 'dashboard': return <DashboardView />
      case 'supplier': return <SupplierView />
      case 'anchor': return <AnchorView />
      case 'investor': return <InvestorView />
      case 'bridge': return <BridgeView />
      case 'credit': return <CreditView />
      default: return <LandingView onLaunchApp={(v) => setActiveView(v)} />
    }
  }

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="navbar-left">
            <div className="navbar-brand" onClick={() => setActiveView('landing')}>
              <h1>
                <Hexagon className="text-primary" size={22} fill="currentColor" fillOpacity={0.2} strokeWidth={2} />
                FactorFi
              </h1>
              <span className="brand-tag">Arc</span>
            </div>

            <nav className="navbar-nav">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`nav-tab ${activeView === item.id ? 'active' : ''}`}
                  onClick={() => setActiveView(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="navbar-right">
            <div className="network-badge">
              <span className="dot" />
              Arc Testnet
            </div>
            {isConnected && usdcBalance !== undefined && (
              <div className="balance-pill">
                <span className="balance-amount">
                  {formatUSDC(usdcBalance as bigint)} USDC
                </span>
                <a href={getExplorerAddressLink(address!)} target="_blank" rel="noopener noreferrer" className="link-explorer">
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
            <div className="connect-btn-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <EmbeddedAuth />
              {providerType !== 'circle' && (
                <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="page-content animate-in" key={activeView}>
          {renderView()}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-tab ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Circle Compliance Onboarding Modal */}
      {isConnected && activeView !== 'landing' && isCompliant === false && (
        <ComplianceModal onVerificationComplete={refetchCompliance} />
      )}
    </div>
  )
}
