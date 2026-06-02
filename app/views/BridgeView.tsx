'use client'

import { useState } from 'react'
import { useWalletClient } from 'wagmi'
import { ArrowRight, Globe, CheckCircle, CircleDashed, ExternalLink, Activity } from 'lucide-react'
import { toast } from 'sonner'

const CHAINS = [
  { id: 'Arc_Testnet', name: 'Arc Testnet', chainId: 5042002, color: '#0075ff' },
  { id: 'Ethereum_Sepolia', name: 'Ethereum Sepolia', chainId: 11155111, color: '#627EEA' },
  { id: 'Base_Sepolia', name: 'Base Sepolia', chainId: 84532, color: '#2151F5' },
  { id: 'Arbitrum_Sepolia', name: 'Arbitrum Sepolia', chainId: 421614, color: '#28A0F0' },
]

type BridgeStep = 'idle' | 'approving' | 'burning' | 'attesting' | 'minting' | 'done' | 'error'

const STEP_LABELS = {
  idle: 'Ready to bridge',
  approving: 'Approving USDC for CCTP...',
  burning: 'Burning USDC on source chain...',
  attesting: 'Waiting for Circle Attestation (IRIS)...',
  minting: 'Minting USDC on Arc Testnet...',
  done: 'Bridge Complete!',
  error: 'Bridge Failed',
}

export default function BridgeView() {
  const [sourceChain, setSourceChain] = useState('Ethereum_Sepolia')
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<BridgeStep>('idle')
  const [progress, setProgress] = useState(0)
  const [bridgeLogs, setBridgeLogs] = useState<string[]>([])
  
  const { data: walletClient } = useWalletClient()

  const addLog = (msg: string) => {
    setBridgeLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const handleBridge = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount')
    if (!walletClient) return toast.error('Please connect your wallet')
    
    setBridgeLogs([])
    
    try {
      // If we have a key in env, use real SDK, otherwise fallback to high-fidelity simulation
      const KIT_KEY = process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY
      
      if (KIT_KEY && KIT_KEY !== 'placeholder') {
        const appKitModule = await import('@circle-fin/app-kit')
        const adapterModule = await import('@circle-fin/adapter-viem-v2')
        
        // @ts-ignore - Bypass type error for viem adapter params
        const adapter = await adapterModule.createViemAdapterFromProvider({ provider: typeof window !== 'undefined' ? (window as any).ethereum : null })
        
        // @ts-ignore
        const kit = new appKitModule.AppKit({ apiKey: KIT_KEY })
        setStep('approving')
        addLog('Connecting to Circle App Kit client...')
        
        // Real bridge call
        // @ts-ignore
        const result = await kit.bridge({
          from: { adapter, chain: sourceChain as any },
          to: { adapter, chain: 'Arc_Testnet' },
          amount: amount,
        })
        console.log('Bridge result:', result)
        setStep('done')
        setProgress(100)
        toast.success(`Bridged ${amount} USDC successfully!`)
      } else {
        // High-Fidelity Simulation Fallback
        addLog('API key absent. Initializing secure CCTP high-fidelity visualizer sandbox...')
        
        // Step 1: Approving
        setStep('approving')
        setProgress(5)
        addLog('Initiating ERC-20 token approval signature on source chain...')
        await new Promise(r => setTimeout(r, 1800))
        setProgress(25)
        addLog('Approve TX Confirmed! Spender: Circle TokenMessenger contract')

        // Step 2: Burning
        setStep('burning')
        addLog('Calling depositForBurn() on Circle Bridge contract...')
        await new Promise(r => setTimeout(r, 2200))
        setProgress(50)
        addLog('USDC Burned! Tx hash: 0x5e8c2817d2e3f57b149d70fd66aa295d69a2f7c00e12361284')
        addLog('Circle message emitted with source nonce #918239')

        // Step 3: Attesting
        setStep('attesting')
        addLog('Polling Circle Iris Attestation service for verification signature...')
        await new Promise(r => setTimeout(r, 3500))
        setProgress(75)
        addLog('IRIS Service: Message attestation signature retrieved successfully!')
        addLog('Attestation Proof: 0x991f82e3c09b83b1029c29d01243ab98d1a10c9a29188e738c82a17f')

        // Step 4: Minting
        setStep('minting')
        addLog('Calling receiveMessage() on Arc Testnet MessageTransmitter...')
        await new Promise(r => setTimeout(r, 1800))
        setProgress(100)
        setStep('done')
        addLog(`Successfully minted ${amount} USDC on Arc Testnet!`)
        addLog('Settle Tx on Arcscan: 0x82fa12ce818c39d8e788b71d9a57be3d8f8d6896')
        
        toast.success(`Bridging Complete! Mocked ${amount} USDC to Arc Testnet.`, {
          description: 'CCTP Contract flow simulated successfully.'
        })
      }
    } catch (err: any) {
      console.error('App Kit bridge error:', err)
      setStep('error')
      addLog(`Bridge error: ${err.message}`)
      toast.error('Bridge failed. Check console.')
    }
  }

  const isBridging = !['idle', 'done', 'error'].includes(step)

  return (
    <>
      <div className="grid-2">
        {/* Bridge Action Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cross-Border Capital Inflow</span>
            <span className="badge badge-approved">Instant Settlement</span>
          </div>

          <div className="form-group">
            <label className="form-label">Source Chain</label>
            <select 
              className="form-input" 
              value={sourceChain} 
              onChange={e => setSourceChain(e.target.value)}
              disabled={isBridging}
            >
              {CHAINS.filter(c => c.id !== 'Arc_Testnet').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--ff-text-secondary)' }}>
              <div style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--ff-bg)', fontWeight: 600, border: '1px solid var(--ff-border)' }}>
                {CHAINS.find(c => c.id === sourceChain)?.name}
              </div>
              <ArrowRight size={20} color="var(--ff-primary)" />
              <div style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--ff-primary-subtle)', fontWeight: 600, color: 'var(--ff-primary)', border: '1px solid var(--ff-primary)' }}>
                Arc Testnet
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (USDC)</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="form-input form-input-mono" 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                disabled={isBridging}
                style={{ paddingLeft: 32, fontSize: 16 }}
              />
              <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--ff-text-muted)', fontWeight: 600 }}>$</span>
              <button 
                onClick={() => setAmount('1000')} 
                style={{ position: 'absolute', right: 8, top: 8, background: 'var(--ff-bg)', border: '1px solid var(--ff-border)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--ff-text-secondary)', cursor: 'pointer' }}
              >
                Max
              </button>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: 14 }} 
            onClick={handleBridge} 
            disabled={isBridging || !amount}
          >
            <Globe size={18} /> 
            {isBridging ? 'Bridging...' : 'Initiate Bridge'}
          </button>

          {/* Interactive Progress Visualizer */}
          {step !== 'idle' && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: step === 'error' ? 'var(--ff-danger)' : 'var(--ff-primary)' }}>{STEP_LABELS[step]}</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--ff-surface)', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ height: '100%', background: step === 'error' ? 'var(--ff-danger)' : 'linear-gradient(90deg, var(--ff-primary), var(--ff-success))', width: `${progress}%`, transition: 'width 0.3s ease' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                {[
                  { id: 'approving', label: 'Approve USDC Spend' },
                  { id: 'burning', label: 'Burn on Source Chain' },
                  { id: 'attesting', label: 'Circle IRIS Attestation' },
                  { id: 'minting', label: 'Mint on Arc Testnet' },
                ].map((s, idx) => {
                  const isDone = progress > (idx * 25)
                  const isActive = step === s.id
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, color: isDone ? 'var(--ff-text)' : isActive ? 'var(--ff-primary)' : 'var(--ff-text-muted)' }}>
                      {isDone ? <CheckCircle size={14} color="var(--ff-success)" /> : isActive ? <CircleDashed size={14} className="pulse" /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--ff-border)' }} />}
                      <span style={{ fontWeight: isDone || isActive ? 500 : 400 }}>{s.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Global Liquidity Metrics & Logs */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Bridge Audit Logger</span>
            <Activity size={16} color="var(--ff-primary)" />
          </div>
          
          {bridgeLogs.length > 0 ? (
            <div style={{
              flex: 1, background: '#000', borderRadius: 8, padding: 12,
              fontFamily: 'var(--ff-mono)', fontSize: 11, color: '#00ff66',
              display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto'
            }}>
              {bridgeLogs.map((l, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#fff' }}>&gt;</span>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 16, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border-subtle)' }}>
              <div style={{ fontWeight: 600, color: 'var(--ff-primary)', marginBottom: 6 }}>Cross-Border Capital Efficiency</div>
              <div style={{ color: 'var(--ff-text-secondary)', lineHeight: 1.6, fontSize: 13 }}>
                FactorFi automatically routes liquidity from global markets into your local SME supply chain. By tapping into cross-chain capital, we ensure your invoices are funded instantly regardless of where the investor's capital originates.
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border-subtle)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ff-text)', marginBottom: 4 }}>{'<'} 10s</div>
              <div style={{ color: 'var(--ff-text-muted)', fontSize: 11 }}>Average Settlement Time</div>
            </div>
            <div style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border-subtle)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ff-text)', marginBottom: 4 }}>$0.00</div>
              <div style={{ color: 'var(--ff-text-muted)', fontSize: 11 }}>Slippage / Spread Fees</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border-subtle)' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>1:1 Fiat Backed</div>
              <div style={{ color: 'var(--ff-text-muted)', fontSize: 11 }}>All capital is fully reserved and redeemable.</div>
            </div>
            <div style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border-subtle)' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Multi-Market</div>
              <div style={{ color: 'var(--ff-text-muted)', fontSize: 11 }}>Investors from 4+ networks actively funding.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Chains Grid */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header"><span className="card-title">Supported Source Chains for Investor Liquidity</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {CHAINS.map(c => (
            <div key={c.id} style={{ padding: 16, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0, boxShadow: `0 0 10px ${c.color}` }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', fontFamily: 'var(--ff-mono)' }}>Chain {c.chainId}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
