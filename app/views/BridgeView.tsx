'use client'

import { useState, useEffect } from 'react'
import { useWalletClient, useAccount } from 'wagmi'
import { ArrowRight, Globe, CheckCircle, CircleDashed, ExternalLink, Activity, RefreshCw, AlertTriangle, ShieldCheck, Download } from 'lucide-react'
import { toast } from 'sonner'
import { CCTPBridgeService, CCTP_CHAINS, CachedTransfer } from '@/lib/cctp-service'
import { createPublicClient, http, formatUnits, parseUnits } from 'viem'
import { USDC_DECIMALS } from '@/lib/contracts'

const CHAINS = [
  { id: 'Ethereum_Sepolia', name: 'Ethereum Sepolia', chainId: 11155111, color: '#627EEA' },
  { id: 'Base_Sepolia', name: 'Base Sepolia', chainId: 84532, color: '#2151F5' },
  { id: 'Arbitrum_Sepolia', name: 'Arbitrum Sepolia', chainId: 421614, color: '#28A0F0' },
]

type BridgeStep = 'idle' | 'approving' | 'burning' | 'attesting' | 'minting' | 'done' | 'error'

const STEP_LABELS = {
  idle: 'Ready to bridge',
  approving: 'Approving USDC spend limits on source...',
  burning: 'Submitting burn transaction to TokenMessenger...',
  attesting: 'Polling Circle Iris Attestation signature...',
  minting: 'Executing mint transaction on Arc Testnet...',
  done: 'Transfer Complete!',
  error: 'Transaction failed',
}

export default function BridgeView() {
  const [sourceChain, setSourceChain] = useState('Ethereum_Sepolia')
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<BridgeStep>('idle')
  const [progress, setProgress] = useState(0)
  const [bridgeLogs, setBridgeLogs] = useState<string[]>([])
  const [cachedTransfers, setCachedTransfers] = useState<CachedTransfer[]>([])
  const [resumingId, setResumingId] = useState<string | null>(null)
  
  const { data: walletClient } = useWalletClient()
  const { address: userAddress } = useAccount()

  // Load cached transfers from LocalStorage on mount
  useEffect(() => {
    setCachedTransfers(CCTPBridgeService.getCachedTransfers())
  }, [step])

  const addLog = (msg: string) => {
    setBridgeLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  // Handles real Circle SDK CCTP bridging
  const handleBridge = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount')
    if (!walletClient) return toast.error('Please connect your wallet')
    
    setBridgeLogs([])
    const transferId = 'cctp_' + Date.now()

    // 1. Initial State Caching in LocalStorage
    const initialTransfer: CachedTransfer = {
      id: transferId,
      sourceChain: sourceChain,
      amount: amount,
      burnTxHash: '',
      messageHash: '',
      status: 'burning',
      timestamp: Date.now()
    }
    CCTPBridgeService.saveTransfer(initialTransfer)
    setCachedTransfers(CCTPBridgeService.getCachedTransfers())

    try {
      addLog('Connecting to Circle App Kit client provider...')
      const appKitModule = await import('@circle-fin/app-kit')
      const adapterModule = await import('@circle-fin/adapter-viem-v2')
      
      const provider = typeof window !== 'undefined' ? (window as any).ethereum : null
      if (!provider) {
        throw new Error('EIP-1193 provider not found. Connect wallet.')
      }

      const adapter = await adapterModule.createViemAdapterFromProvider({ provider })
      const kit = new appKitModule.AppKit()
      
      // Subscribe to real-time events to update progress & logs
      kit.on('bridge.approve', (payload) => {
        setStep('approving')
        setProgress(15)
        addLog(`USDC spender approval transaction sent: ${payload.values.txHash}`)
      })

      kit.on('bridge.burn', (payload) => {
        setStep('burning')
        setProgress(40)
        addLog(`USDC successfully burned on source chain: ${payload.values.txHash}`)
        
        const updated: CachedTransfer = {
          ...initialTransfer,
          burnTxHash: payload.values.txHash || '',
          status: 'attesting',
        }
        CCTPBridgeService.saveTransfer(updated)
        setCachedTransfers(CCTPBridgeService.getCachedTransfers())
      })

      kit.on('bridge.fetchAttestation', (payload) => {
        setStep('attesting')
        setProgress(70)
        if (payload.values.state === 'success') {
          addLog(`Circle CCTP Attestation signature retrieved successfully!`)
        } else {
          addLog(`Polling Circle Iris Attestation... (Status: ${payload.values.state})`)
        }
      })

      kit.on('bridge.mint', (payload) => {
        setStep('minting')
        setProgress(85)
        addLog(`Minting transaction submitted to Arc Testnet: ${payload.values.txHash}`)
      })

      setStep('approving')
      setProgress(5)
      addLog(`Initiating TokenMessenger allowance approval for ${amount} USDC...`)

      // Real cross-chain bridge execution
      // @ts-ignore
      const result = await kit.bridge({
        from: { adapter, chain: sourceChain as any },
        to: { adapter, chain: 'Arc_Testnet' },
        amount: amount,
      })

      console.log('App Kit bridge transaction resolved:', result)
      
      // Cache transaction result data
      const updated: CachedTransfer = {
        ...initialTransfer,
        burnTxHash: result.steps?.find(s => s.name === 'burn')?.txHash || '',
        messageHash: (result as any)?.messageHash || '',
        status: 'completed'
      }
      CCTPBridgeService.saveTransfer(updated)
      
      setStep('done')
      setProgress(100)
      addLog('USDC successfully minted on destination chain (Arc Testnet)!')
      toast.success(`Cross-chain CCTP bridging of ${amount} USDC complete!`)
    } catch (err: any) {
      console.error('App Kit bridge error:', err)
      setStep('error')
      addLog(`Bridge error: ${err.message}`)
      toast.error('CCTP Bridge failed', { description: err.message })
    }
  }

  // Automatic CCTP Error Recovery Resumer using App Kit retry API
  const handleResumeTransfer = async (tx: CachedTransfer) => {
    if (!walletClient) return toast.error('Connect wallet to resume CCTP transaction')
    setResumingId(tx.id)
    setBridgeLogs([])
    setStep(tx.status as BridgeStep)
    
    addLog(`=== Resuming Stalled CCTP Transfer: ${tx.id} ===`)
    addLog(`Cached amount: ${tx.amount} USDC from chain: ${tx.sourceChain}`)
    addLog(`Cached Burn Tx: ${tx.burnTxHash.slice(0, 16)}...`)

    try {
      const appKitModule = await import('@circle-fin/app-kit')
      const adapterModule = await import('@circle-fin/adapter-viem-v2')
      
      const provider = typeof window !== 'undefined' ? (window as any).ethereum : null
      if (!provider) throw new Error('EIP-1193 provider not found')

      const adapter = await adapterModule.createViemAdapterFromProvider({ provider })
      const kit = new appKitModule.AppKit()

      // Reconstruct the bridging result state object for the SDK to retry
      const mockResult: any = {
        amount: tx.amount,
        token: 'USDC',
        state: 'error',
        provider: 'CCTPV2BridgingProvider',
        config: {
          transferSpeed: 'FAST'
        },
        source: {
          address: userAddress,
          chain: {
            type: 'evm',
            chain: tx.sourceChain,
          }
        },
        destination: {
          address: userAddress,
          chain: {
            type: 'evm',
            chain: 'Arc_Testnet',
          }
        },
        steps: [
          {
            name: 'approve',
            state: 'success'
          },
          {
            name: 'burn',
            state: 'success',
            txHash: tx.burnTxHash
          },
          {
            name: 'fetchAttestation',
            state: tx.attestationSignature ? 'success' : 'error',
            data: tx.attestationSignature ? { attestation: tx.attestationSignature } : undefined
          },
          {
            name: 'mint',
            state: 'idle'
          }
        ]
      }

      kit.on('bridge.fetchAttestation', (payload) => {
        setStep('attesting')
        setProgress(70)
        if (payload.values.state === 'success') {
          addLog(`Circle Iris Attestation retrieved successfully!`)
        } else {
          addLog(`Polling Circle Iris Attestation signature... (Status: ${payload.values.state})`)
        }
      })

      kit.on('bridge.mint', (payload) => {
        setStep('minting')
        setProgress(85)
        addLog(`Minting transaction submitted to Arc Testnet: ${payload.values.txHash}`)
      })

      setStep('attesting')
      setProgress(50)
      addLog('Re-initializing CCTP resumption pipeline...')

      const retryResult = await (kit as any).retry(mockResult, {
        from: adapter,
        to: adapter
      })

      console.log('App Kit bridge retry transaction resolved:', retryResult)

      tx.status = 'completed'
      CCTPBridgeService.saveTransfer(tx)
      setCachedTransfers(CCTPBridgeService.getCachedTransfers())

      setStep('done')
      setProgress(100)
      addLog(`Resumption Successful! ${tx.amount} USDC minted on Arc Testnet for ${userAddress}.`)
      toast.success('Stalled transaction recovered and minted successfully!')

    } catch (e: any) {
      addLog(`Recovery error: ${e.message}`)
      toast.error('Failed to recover transfer', { description: e.message })
    } finally {
      setResumingId(null)
    }
  }

  const isBridging = !['idle', 'done', 'error'].includes(step)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="grid-2">
        {/* Bridge Action Card */}
        <div className="card" data-tour="bridge-assets">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={18} color="var(--ff-primary)" /> Cross-Border Capital Inflow (Circle CCTP)
            </span>
            <span className="badge badge-approved" style={{ background: 'var(--ff-success-subtle)', color: 'var(--ff-success)' }}>Native Burn-Mint</span>
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Source Chain</label>
            <select 
              className="form-input" 
              value={sourceChain} 
              onChange={e => setSourceChain(e.target.value)}
              disabled={isBridging}
              style={{ height: 40, fontSize: 13 }}
            >
              {CHAINS.map(c => (
                <option key={c.id} value={c.id}>{c.name} (Chain {c.chainId})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--ff-text-secondary)' }}>
              <div style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--ff-bg)', fontWeight: 600, border: '1px solid var(--ff-border)' }}>
                {CHAINS.find(c => c.id === sourceChain)?.name}
              </div>
              <ArrowRight size={16} color="var(--ff-primary)" />
              <div style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--ff-primary-subtle)', fontWeight: 600, color: 'var(--ff-primary)', border: '1px solid var(--ff-primary)' }}>
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
                style={{ paddingLeft: 30, fontSize: 15, height: 40 }}
              />
              <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--ff-text-muted)', fontWeight: 600, fontSize: 13 }}>$</span>
              <button 
                onClick={() => setAmount('100')} 
                style={{ position: 'absolute', right: 8, top: 8, background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: 'var(--ff-text-secondary)', cursor: 'pointer' }}
              >
                Max
              </button>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '11px', fontSize: 13, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }} 
            onClick={handleBridge} 
            disabled={isBridging || !amount}
          >
            <Globe size={15} /> 
            {isBridging ? 'Bridging USDC...' : 'Initiate Bridge'}
          </button>

          {/* Interactive Progress Visualizer */}
          {step !== 'idle' && (
            <div style={{ marginTop: 20, padding: 14, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 11, fontWeight: 600 }}>
                <span style={{ color: step === 'error' ? 'var(--ff-danger)' : 'var(--ff-primary)' }}>{STEP_LABELS[step]}</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--ff-surface)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', background: step === 'error' ? 'var(--ff-danger)' : 'linear-gradient(90deg, var(--ff-primary), var(--ff-success))', width: `${progress}%`, transition: 'width 0.3s ease' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
                {[
                  { id: 'approving', label: 'Approve USDC Spend Limits' },
                  { id: 'burning', label: 'Initiate Source Chain Burn' },
                  { id: 'attesting', label: 'IRIS Message Validation' },
                  { id: 'minting', label: 'Mint USDC on Arc Testnet' },
                ].map((s, idx) => {
                  const isDone = progress > (idx * 25)
                  const isActive = step === s.id
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDone ? 'var(--ff-text)' : isActive ? 'var(--ff-primary)' : 'var(--ff-text-muted)' }}>
                      {isDone ? <CheckCircle size={13} color="var(--ff-success)" /> : isActive ? <CircleDashed size={13} className="pulse" /> : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid var(--ff-border)' }} />}
                      <span style={{ fontWeight: isDone || isActive ? 500 : 400 }}>{s.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Audit Logs panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ fontSize: 13 }}>CCTP Client Logger</span>
            <Activity size={14} color="var(--ff-primary)" />
          </div>
          
          {bridgeLogs.length > 0 ? (
            <div style={{
              flex: 1, background: '#000', borderRadius: 8, padding: 12,
              fontFamily: 'var(--ff-mono)', fontSize: 11, color: '#00ff66',
              display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto'
            }}>
              {bridgeLogs.map((l, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 6 }}>
                  <span style={{ color: '#fff' }}>&gt;</span>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 16, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border-subtle)', flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--ff-primary)', marginBottom: 6, fontSize: 12 }}>Native Cross-Chain Transfers</div>
              <div style={{ color: 'var(--ff-text-secondary)', lineHeight: 1.6, fontSize: 12 }}>
                Circle's CCTP does not lock tokens on a multi-sig bridge. It securely burns USDC on the source network and mints it natively on Arc, removing third-party lock-and-mint bridge risks completely.
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ padding: 10, background: 'var(--ff-bg)', borderRadius: 6, border: '1px solid var(--ff-border-subtle)' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ff-text)', marginBottom: 2 }}>{'<'} 20s</div>
              <div style={{ color: 'var(--ff-text-muted)', fontSize: 10 }}>Attestation Speed</div>
            </div>
            <div style={{ padding: 10, background: 'var(--ff-bg)', borderRadius: 6, border: '1px solid var(--ff-border-subtle)' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ff-text)', marginBottom: 2 }}>$0.00</div>
              <div style={{ color: 'var(--ff-text-muted)', fontSize: 10 }}>Mint Gas Sponsoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active transfers LocalStorage recovery dashboard */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color="var(--ff-success)" /> Active Transfers & Attestation Recovery Cache
          </span>
          <span className="badge badge-approved" style={{ background: 'var(--ff-success-subtle)', color: 'var(--ff-success)' }}>LocalStorage Protected</span>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
          CCTP transactions that are interrupted during the Circle attestation phase are saved here. You can manually re-trigger the attestation fetch and mint settlement at any time.
        </p>

        {cachedTransfers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cachedTransfers.map(tx => (
              <div 
                key={tx.id} 
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: 12, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' 
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{tx.amount} USDC</span>
                    <span style={{ fontSize: 10, color: 'var(--ff-text-muted)' }}>from {tx.sourceChain}</span>
                    <span className={`badge ${tx.status === 'completed' ? 'badge-settled' : 'badge-funded'}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                      {tx.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', fontFamily: 'var(--ff-mono)' }}>
                    Burn Tx: {tx.burnTxHash ? `${tx.burnTxHash.slice(0, 20)}...` : 'not generated yet'}
                  </div>
                </div>

                {tx.status !== 'completed' && (
                  <button 
                    onClick={() => handleResumeTransfer(tx)}
                    disabled={resumingId === tx.id}
                    className="btn btn-secondary" 
                    style={{ fontSize: 11, padding: '5px 12px', height: 28, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <RefreshCw size={11} className={resumingId === tx.id ? 'spin' : ''} />
                    {resumingId === tx.id ? 'Resuming...' : 'Resume Attestation / Mint'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ff-text-muted)', background: 'var(--ff-bg)', borderRadius: 8, border: '1px dashed var(--ff-border)' }}>
            <AlertTriangle size={24} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--ff-text-muted)' }} />
            <div style={{ fontSize: 12 }}>No cached or stalled CCTP transfers found in browser memory.</div>
          </div>
        )}
      </div>

      {/* Supported Chains Grid */}
      <div className="card">
        <div className="card-header"><span className="card-title">Supported Source Chains for Investor Liquidity</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {CHAINS.map(c => {
            const config = CCTP_CHAINS[c.id]
            return (
              <div key={c.id} style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0, boxShadow: `0 0 10px ${c.color}` }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', fontFamily: 'var(--ff-mono)' }}>USDC: {config?.usdcAddress.slice(0, 10)}...</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
