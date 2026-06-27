'use client'

import { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { LayoutDashboard, FileText, Building2, TrendingUp, Shield, ArrowRightLeft, Hexagon, Home, Bot } from 'lucide-react'
import { USDC_ADDRESS_ARC, usdcAbi, FACTORFI_CONTRACT_ADDRESS, factorFiAbi } from '@/lib/contracts'
import { formatUSDC } from '@/lib/utils'
import { toast } from 'sonner'

import LandingView from './views/LandingView'
import DashboardView from './views/DashboardView'
import SupplierView from './views/SupplierView'
import AnchorView from './views/AnchorView'
import InvestorView from './views/InvestorView'
import BridgeView from './views/BridgeView'
import CreditView from './views/CreditView'
import AgentView from './views/AgentView'

import { useUnifiedAccount } from '@/lib/web3-provider'
import Header from './components/Header'
import ComplianceModal from './components/ComplianceModal'
import Breadcrumbs from './components/Breadcrumbs'
import { useOnboarding } from './components/OnboardingProvider'

type View = 'landing' | 'dashboard' | 'supplier' | 'anchor' | 'investor' | 'bridge' | 'credit' | 'agent'

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'landing', label: 'Home', icon: <Home size={16} /> },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'supplier', label: 'Supplier Portal', icon: <FileText size={16} /> },
  { id: 'anchor', label: 'Buyer Portal', icon: <Building2 size={16} /> },
  { id: 'investor', label: 'Invest Pools', icon: <TrendingUp size={16} /> },
  { id: 'bridge', label: 'Funding Bridge', icon: <ArrowRightLeft size={16} /> },
  { id: 'credit', label: 'Credit Passports', icon: <Shield size={16} /> },
  { id: 'agent', label: 'Agent OS', icon: <Bot size={16} /> },
]

export default function FactorFiApp() {
  const [activeView, setActiveView] = useState<View>('agent')
  const { address, isConnected } = useUnifiedAccount()
  const { startTour } = useOnboarding()
  const [faucetLoading, setFaucetLoading] = useState(false)

  const handleFaucetRequest = async () => {
    if (!address) return toast.error('Please connect your wallet first')
    setFaucetLoading(true)
    const toastId = toast.loading('Requesting sandbox gas and tokens from relayer...')
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Faucet request failed')
      
      toast.success('Funds dispensed!', {
        id: toastId,
        description: 'USDC Gas and ERC20 tokens sent to your wallet.'
      })
    } catch (e: any) {
      console.error(e)
      toast.error('Faucet failed', {
        id: toastId,
        description: e.message
      })
    } finally {
      setFaucetLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const view = params.get('view') as View | null
      if (view && ['landing', 'dashboard', 'supplier', 'anchor', 'investor', 'bridge', 'credit', 'agent'].includes(view)) {
        setActiveView(view)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (activeView === 'landing') {
        url.searchParams.delete('view')
      } else {
        url.searchParams.set('view', activeView)
      }
      window.history.replaceState({}, '', url.pathname + url.search)
    }
  }, [activeView])

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
      case 'agent': return <AgentView setActiveView={setActiveView} />
      default: return <LandingView onLaunchApp={(v) => setActiveView(v)} />
    }
  }

  return (
    <div className="app-shell">
      {/* World-class Corporate Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onFaucetRequest={handleFaucetRequest}
        faucetLoading={faucetLoading}
        startTour={startTour}
        usdcBalance={usdcBalance}
      />

      {/* Main Content */}
      <main className="main-content" id="main-content">
        {activeView !== 'landing' && (
          <div style={{ padding: '0 24px', maxWidth: 1200, width: '100%', margin: '0 auto 10px' }}>
            <Breadcrumbs />
          </div>
        )}
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
