'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useUnifiedAccount } from '@/lib/web3-provider'
import { Mail, ShieldAlert, CheckCircle, ShieldCheck, Settings, LogOut, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { truncateAddress, getExplorerAddressLink } from '@/lib/utils'

export default function EmbeddedAuth() {
  const { isConnected, address, circleEmail, providerType, loginWithCircle, logout } = useUnifiedAccount()
  
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'pin_challenge' | 'success'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const sdkRef = useRef<any>(null)

  // Temporary session details received from backend during onboarding
  const [tempSession, setTempSession] = useState<{
    address: string
    challengeId: string | null
    userToken: string
    encryptionKey: string
  } | null>(null)

  // Initialize Circle W3S Web SDK on mount
  useEffect(() => {
    const initSdk = async () => {
      try {
        const { W3SSdk } = await import('@circle-fin/w3s-pw-web-sdk')
        const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID || '6f36533e-751d-5a53-a2a7-d7c587a77a08'
        const sdk = new W3SSdk({ appSettings: { appId } })
        sdkRef.current = sdk

        // Mandatory Device ID registration for iframe session mapping
        const deviceId = await sdk.getDeviceId()
        console.log('[Circle Web SDK] Device ID initialized:', deviceId)
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
        toast.success('Non-custodial smart wallet successfully instantiated on Arc!')
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
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: 'var(--ff-text)' }}>SME Corporate Login</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
              Enter your corporate email address to automatically instantiate your non-custodial wallet on Arc Testnet.
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
              Setup Secure PIN
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
              To ensure full non-custodial custody, Circle will display a secure overlay for you to set your wallet PIN and security questions.
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
            <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: 'var(--ff-text)' }}>Wallet Setup Complete</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
              Your non-custodial smart wallet is registered on Arc Testnet. You can now invoice corporations completely gaslessly!
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
            SME Wallet
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

        {/* Dynamic Security & Pin Settings Modal */}
        {showSettings && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999, backdropFilter: 'blur(4px)'
          }}>
            <div className="card" style={{ maxWidth: 450, width: '90%', background: '#09090b', borderColor: 'var(--ff-border)' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Settings size={16} color="var(--ff-primary)" /> SME Wallet Settings
                </span>
                <button className="btn-close" style={{ color: 'var(--ff-text-muted)', fontSize: 18 }} onClick={() => setShowSettings(false)}>×</button>
              </div>
              <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'var(--ff-bg)', padding: 12, borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginBottom: 2 }}>Non-Custodial Account Email</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{circleEmail}</div>
                </div>

                <div style={{ background: 'var(--ff-bg)', padding: 12, borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginBottom: 4 }}>On-Chain SME Wallet Address (Arc)</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 4 }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--ff-mono)', color: 'var(--ff-text)' }}>{address}</span>
                    <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-primary)' }}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <a href={getExplorerAddressLink(address!)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--ff-primary)', textDecoration: 'none' }} className="hover-underline">
                      View on Arcscan Explorer →
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, background: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>Circle Non-Custodial Encrypted</div>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
                      Your keys are fully shard-encrypted with your passcode PIN. Neither FactorFi nor Circle holds custody of your assets.
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button className="btn btn-secondary" style={{ padding: '6px 14px' }} onClick={() => setShowSettings(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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
        <span>SME Web2 Onboarding</span>
      </button>

      {/* Auth Onboarding Overlay Modal */}
      {showSettings && !isConnected && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: 420, width: '90%', background: '#09090b', borderColor: 'var(--ff-border)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -10 }}>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--ff-text-muted)', fontSize: 22, cursor: 'pointer' }} 
                onClick={() => setShowSettings(false)}
              >
                ×
              </button>
            </div>
            {renderAuthModal()}
          </div>
        </div>
      )}
    </div>
  )
}
