'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useUnifiedAccount } from '@/lib/web3-provider'
import { Mail, ShieldAlert, CheckCircle, ShieldCheck, Settings, LogOut, Copy, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { truncateAddress, getExplorerAddressLink } from '@/lib/utils'

const importWithRetry = async (fn: () => Promise<any>, retriesLeft = 3, interval = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retriesLeft === 0) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
    return importWithRetry(fn, retriesLeft - 1, interval);
  }
};

interface EmbeddedAuthProps {
  headless?: boolean
}

export default function EmbeddedAuth({ headless = false }: EmbeddedAuthProps) {
  const { isConnected, address, circleEmail, providerType, loginWithCircle, logout } = useUnifiedAccount()
  
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'pin_challenge' | 'success'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mounted, setMounted] = useState(false)

  const sdkRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleOpenAuth = () => {
      setStep('email')
      setShowSettings(true)
    }
    const handleOpenSettings = () => {
      setStep(isConnected ? 'success' : 'email')
      setShowSettings(true)
    }
    window.addEventListener('open-circle-auth', handleOpenAuth)
    window.addEventListener('open-circle-settings', handleOpenSettings)
    return () => {
      window.removeEventListener('open-circle-auth', handleOpenAuth)
      window.removeEventListener('open-circle-settings', handleOpenSettings)
    }
  }, [isConnected])

  // Temporary session details received from backend during onboarding
  const [tempSession, setTempSession] = useState<{
    address: string
    challengeId: string | null
    userToken: string
    encryptionKey: string
  } | null>(null)

  // Initialize Circle W3S Web SDK on mount
  // NOTE: getDeviceId() is deferred to challenge execution time because the
  // SDK's internal iframe may not be ready during initial mount, causing
  // "Failed to receive deviceId" errors in dev mode.
  useEffect(() => {
    const initSdk = async () => {
      try {
        const { W3SSdk } = await importWithRetry(() => import('@circle-fin/w3s-pw-web-sdk'))
        const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID || 'bc7e7dbe-d517-591a-b439-368575473966'
        const sdk = new W3SSdk({
          appSettings: { appId }
        });
        sdkRef.current = sdk
        console.log('[Circle Web SDK] SDK instance created successfully')
      } catch (err) {
        console.error('[Circle Web SDK] Failed to initialize Web SDK:', err)
      }
    }
    initSdk()
  }, [])

  // 1. Submit email to register/login user
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      return toast.error('Please enter a valid email address')
    }

    setIsLoading(true)
    toast.info('Connecting to Circle W3S network...', { duration: 1500 })

    try {
      const res = await fetch('/api/wallets/user/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      setTempSession({
        address: data.address || '',
        challengeId: data.challengeId,
        userToken: data.userToken,
        encryptionKey: data.encryptionKey
      })

      setIsLoading(false)

      if (data.challengeId) {
        // New user: must setup secure non-custodial PIN
        setStep('pin_challenge')
        toast.success('Onboarding session initialized! Secure your wallet.')
      } else {
        // Existing user: logged in immediately
        loginWithCircle(email, data.address as `0x${string}`)
        setStep('success')
        toast.success('Welcome back! SME wallet session restored.')
      }
    } catch (err: any) {
      setIsLoading(false)
      toast.error('Failed to initialize session', { description: err.message })
    }
  }

  // 2. Execute secure PIN setup challenge via Circle's overlay UI
  const handleExecutePinChallenge = () => {
    const sdk = sdkRef.current
    if (!sdk || !tempSession?.challengeId || !tempSession?.userToken || !tempSession?.encryptionKey) {
      return toast.error('Circle SDK is not ready or missing session credentials.')
    }

    setIsLoading(true)
    
    sdk.setAuthentication({
      userToken: tempSession.userToken,
      encryptionKey: tempSession.encryptionKey,
    })

    sdk.execute(tempSession.challengeId, async (error: any, result: any) => {
      if (error) {
        setIsLoading(false)
        console.error('[Circle Web SDK] Execute error:', error)
        toast.error('Challenge failed: ' + (error.message || 'Process cancelled by user.'))
        return
      }

      console.log('[Circle Web SDK] Challenge executed successfully:', result)
      toast.info('Verification successful. Retrieving wallet address...')

      // Query the backend to retrieve the newly generated wallet address
      try {
        const res = await fetch('/api/wallets/user/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fetchAddressOnly: true, userToken: tempSession.userToken })
        })
        const data = await res.json()
        setIsLoading(false)

        if (data.error || !data.address) {
          throw new Error(data.error || 'Address not populated yet.')
        }

        loginWithCircle(email, data.address as `0x${string}`)
        setStep('success')
        toast.success('Secure digital dollar wallet created successfully!')
      } catch (err: any) {
        setIsLoading(false)
        toast.error('Failed to fetch registered wallet address', { description: err.message })
      }
    })
  }

  const handleCopy = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    toast.success('Address copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Render Onboarding Modal Steps
  const renderAuthModal = () => {
    switch (step) {
      case 'email':
        return (
          <form onSubmit={handleSendOtp} className="form-group animate-in">
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: 'var(--ff-text)' }}>Business Email Login</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
              Enter your business email address to log in or create a secure corporate treasury wallet.
            </p>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ff-text-muted)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="supplier@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                style={{ paddingLeft: 38 }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} disabled={isLoading}>
              {isLoading ? 'Connecting...' : 'Proceed'}
            </button>
          </form>
        )

      case 'pin_challenge':
        return (
          <div className="form-group animate-in">
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: 'var(--ff-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={18} color="var(--ff-warning)" />
              Set Up Security PIN
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
              For complete security, you will set a secure passkey PIN and security questions in a private verification overlay.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep('email')} disabled={isLoading}>
                Back
              </button>
              <button type="button" className="btn btn-primary" style={{ flex: 2, display: 'flex', justifyContent: 'center' }} onClick={handleExecutePinChallenge} disabled={isLoading}>
                {isLoading ? 'Opening Dialog...' : 'Open PIN Dialog'}
              </button>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="animate-in" style={{ textAlign: 'center', padding: '10px 0' }}>
            <CheckCircle size={44} color="var(--ff-success)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: 'var(--ff-text)' }}>Account Active</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
              Your secure digital wallet is active. You can now request early payments and manage invoices with zero transaction fees.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--ff-bg)', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'left', border: '1px solid var(--ff-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Email:</span>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{circleEmail}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Address:</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)' }}>{truncateAddress(address!)}</span>
              </div>
            </div>
            <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowSettings(false)}>
              Explore Portal
            </button>
          </div>
        )
    }
  }

  // Portals markup for settings and onboarding PIN challenges
  const portals = (
    <>
      {/* Dynamic Security & Pin Settings Modal */}
      {showSettings && isConnected && mounted && typeof window !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: 450, width: '90%', background: '#09090b', borderColor: 'var(--ff-border)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={16} color="var(--ff-primary)" /> Business Account Settings
              </span>
              <button className="btn-close" onClick={() => setShowSettings(false)}><X size={14} /></button>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--ff-bg)', padding: 12, borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginBottom: 2 }}>Non-Custodial Account Email</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{circleEmail}</div>
              </div>

              <div style={{ background: 'var(--ff-bg)', padding: 12, borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Digital Wallet Account Address</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 4 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--ff-mono)', color: 'var(--ff-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>{address}</span>
                  <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-primary)' }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <a href={getExplorerAddressLink(address!)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--ff-primary)', textDecoration: 'none' }} className="hover-underline">
                    View Registry Verification Details →
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, background: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>Full Account Ownership</div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
                    Your account is fully protected by your passkey PIN. We do not hold custody of your funds, ensuring you are in complete control.
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 20px 20px 20px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 14px' }} onClick={() => setShowSettings(false)}>
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Auth Onboarding Overlay Modal */}
      {showSettings && !isConnected && mounted && typeof window !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: 420, width: '90%', background: '#09090b', borderColor: 'var(--ff-border)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -10 }}>
              <button className="btn-close" onClick={() => setShowSettings(false)}>
                <X size={14} />
              </button>
            </div>
            {renderAuthModal()}
          </div>
        </div>,
        document.body
      )}
    </>
  )

  if (headless) {
    return portals
  }

  // Active Embedded User Wallet State
  if (isConnected && providerType === 'circle') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div 
          onClick={() => setShowSettings(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, rgba(0, 117, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(0, 117, 255, 0.3)',
            borderRadius: '20px',
            padding: '4px 12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: 12,
            fontWeight: 500,
          }}
          className="hover-glow"
        >
          <ShieldCheck size={14} color="#10b981" />
          <span>{truncateAddress(address!)}</span>
          <span style={{ fontSize: 10, color: 'var(--ff-text-muted)', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 6 }}>
            Business Account
          </span>
        </div>

        <button 
          onClick={logout}
          className="btn-icon" 
          style={{ background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', padding: 6, borderRadius: '50%' }}
          title="Sign Out"
        >
          <LogOut size={13} color="var(--ff-danger)" />
        </button>
        {portals}
      </div>
    )
  }

  // Not Logged-In Auth UI Trigger Wrapper
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button 
        className="btn btn-secondary" 
        onClick={() => {
          setStep('email')
          setShowSettings(true)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          borderColor: 'var(--ff-primary)',
          color: 'var(--ff-primary)',
          background: 'rgba(0,117,255,0.05)'
        }}
      >
        <Mail size={14} />
        <span className="btn-text-desktop">Business Email Login</span>
        <span className="btn-text-mobile">Web2 Login</span>
      </button>
      {portals}
    </div>
  )
}
