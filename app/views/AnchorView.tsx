'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { Building2, CheckCircle, ExternalLink, ShieldCheck, HelpCircle, Terminal, Bot, Copy, Check, Power, Send, Key, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi, USDC_ADDRESS_ARC, usdcAbi, USDC_DECIMALS } from '@/lib/contracts'
import { getExplorerTxLink, formatUSDC } from '@/lib/utils'
import { parseUnits, formatUnits } from 'viem'
import { useUnifiedAccount } from '@/lib/web3-provider'

export default function AnchorView() {
  const { address } = useUnifiedAccount()
  const publicClient = usePublicClient()
  
  // EOA Manual State
  const [companyName, setCompanyName] = useState('')
  const [creditRating, setCreditRating] = useState('800')
  const [invoiceIdToApprove, setInvoiceIdToApprove] = useState('')
  const [invoiceIdToSettle, setInvoiceIdToSettle] = useState('')
  const [settleAmount, setSettleAmount] = useState('')
  const [settleStep, setSettleStep] = useState<'idle' | 'approved_usdc' | 'settled'>('idle')

  const { writeContract: registerAnchor, data: regHash, isPending: regPending } = useWriteContract()
  const { isLoading: regConfirming, isSuccess: regSuccess } = useWaitForTransactionReceipt({ hash: regHash })

  const { writeContract: approve, data: apHash, isPending: apPending } = useWriteContract()
  const { isLoading: apConfirming, isSuccess: apSuccess } = useWaitForTransactionReceipt({ hash: apHash })

  const { writeContract: approveUSDC, data: approveUSDCHash, isPending: approveUSDCPending } = useWriteContract()
  const { isLoading: approveUSDCConfirming, isSuccess: approveUSDCSuccess } = useWaitForTransactionReceipt({ hash: approveUSDCHash })

  const { writeContract: settleInvoice, data: stHash, isPending: stPending } = useWriteContract()
  const { isLoading: stConfirming, isSuccess: stSuccess } = useWaitForTransactionReceipt({ hash: stHash })

  // Programmatic Wallet State
  const [apiLogs, setApiLogs] = useState<string[]>([
    'System initialized. Standing by for API ERP webhook integrations...'
  ])
  const [autoApproved, setAutoApproved] = useState(false)
  const [progWallet, setProgWallet] = useState<{
    walletId: string
    address: string
    encryptedKey: string
    apiKey: string
    companyName: string
  } | null>(null)
  
  const [progBalance, setProgBalance] = useState<string>('0.00')
  const [copiedKey, setCopiedKey] = useState<'address' | 'api' | 'secret' | null>(null)

  // API Call Execution State
  const [apiAction, setApiAction] = useState<'approve' | 'settle'>('approve')
  const [apiInvoiceId, setApiInvoiceId] = useState('')
  const [apiLoading, setApiLoading] = useState(false)

  // Load persisted programmatic wallet on mount
  useEffect(() => {
    const saved = localStorage.getItem('ff_prog_anchor_wallet')
    if (saved) {
      try {
        setProgWallet(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load programmatic wallet:', e)
      }
    }
  }, [])

  // Poll balance of programmatic wallet
  useEffect(() => {
    if (!progWallet || !publicClient) return
    
    const fetchBalance = async () => {
      try {
        const bal = await publicClient.readContract({
          address: USDC_ADDRESS_ARC,
          abi: usdcAbi,
          functionName: 'balanceOf',
          args: [progWallet.address as `0x${string}`]
        }) as bigint
        setProgBalance(formatUnits(bal, USDC_DECIMALS))
      } catch (err) {
        console.error('Failed to check programmatic balance:', err)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 10000)
    return () => clearInterval(interval)
  }, [progWallet, publicClient])

  // Deploy Programmatic Wallet
  const handleDeployProgrammatic = async () => {
    if (!companyName) return toast.error('Enter company name')
    
    setApiLogs(prev => [...prev, `[INIT] Generating Developer-Controlled Non-Custodial Wallet for ${companyName}...`])
    
    try {
      const res = await fetch('/api/anchor/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, creditRating })
      })
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)

      setProgWallet(data)
      localStorage.setItem('ff_prog_anchor_wallet', JSON.stringify(data))
      
      setApiLogs(prev => [
        ...prev,
        `[SUCCESS] Programmatic Wallet generated: ${data.address}`,
        `[SUCCESS] On-chain Anchor Registered! Tx Hash: ${data.registrationHash.slice(0, 16)}...`,
        `[KEY] Bearer Access Key issued. Encrypted private key successfully stored in KMS.`
      ])
      
      toast.success('Corporate treasury wallet successfully deployed & registered!')
    } catch (err: any) {
      setApiLogs(prev => [...prev, `[ERROR] Programmatic wallet creation failed: ${err.message}`])
      toast.error('Deployment failed', { description: err.message })
    }
  }

  // Trigger Programmatic Invoice Action from UI Console
  const handleExecuteApiAction = async () => {
    if (!progWallet) return toast.error('Deploy programmatic wallet first')
    if (!apiInvoiceId) return toast.error('Enter Invoice ID')

    setApiLoading(true)
    setApiLogs(prev => [...prev, `[ERP TRIGGER] [POST] /api/anchor/invoice/action { action: "${apiAction}", invoiceId: ${apiInvoiceId} }`])
    
    try {
      const res = await fetch('/api/anchor/invoice/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${progWallet.apiKey}`
        },
        body: JSON.stringify({
          action: apiAction,
          invoiceId: Number(apiInvoiceId),
          encryptedKey: progWallet.encryptedKey
        })
      })
      
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setApiLogs(prev => [
        ...prev,
        `[OK] 200 SUCCESS - ${apiAction === 'approve' ? 'Approved' : 'Settled'} Invoice #${apiInvoiceId}`,
        `[TX] Broadcasted to Arc Testnet. Confirmed Hash: ${data.hash}`
      ])

      toast.success(`Invoice #${apiInvoiceId} successfully ${apiAction}d via API!`)
      setApiInvoiceId('')
    } catch (err: any) {
      setApiLogs(prev => [...prev, `[ERROR] API execution failed: ${err.message}`])
      toast.error('API action failed', { description: err.message })
    } finally {
      setApiLoading(false)
    }
  }

  const handleCopy = (text: string, type: 'address' | 'api' | 'secret') => {
    navigator.clipboard.writeText(text)
    setCopiedKey(type)
    toast.success('Copied successfully!')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleClearProgSession = () => {
    localStorage.removeItem('ff_prog_anchor_wallet')
    setProgWallet(null)
    setProgBalance('0.00')
    setApiLogs(['Session cleared. Standing by for next corporate credentials...'])
    toast.success('Programmatic session cleared successfully')
  }

  const handleRegister = () => {
    if (!companyName) return toast.error('Enter company name')
    registerAnchor({
      address: FACTORFI_CONTRACT_ADDRESS, abi: factorFiAbi, functionName: 'registerAnchor',
      args: [companyName, BigInt(creditRating)],
    }, {
      onSuccess: (h) => toast.success('Anchor registered!', { action: { label: 'View', onClick: () => window.open(getExplorerTxLink(h), '_blank') } }),
      onError: (e) => toast.error('Registration failed', { description: e.message.slice(0, 80) }),
    })
  }

  const handleApprove = () => {
    if (!invoiceIdToApprove) return toast.error('Enter invoice ID')
    approve({
      address: FACTORFI_CONTRACT_ADDRESS, abi: factorFiAbi, functionName: 'approveInvoice',
      args: [BigInt(invoiceIdToApprove)],
    }, {
      onSuccess: (h) => toast.success('Invoice approved!', { action: { label: 'View', onClick: () => window.open(getExplorerTxLink(h), '_blank') } }),
      onError: (e) => toast.error('Approval failed', { description: e.message.slice(0, 80) }),
    })
  }

  const handleApproveUSDC = () => {
    if (!invoiceIdToSettle || !settleAmount) return toast.error('Enter invoice ID and Face Value')
    const amt = parseUnits(settleAmount, USDC_DECIMALS)

    approveUSDC({
      address: USDC_ADDRESS_ARC, abi: usdcAbi, functionName: 'approve',
      args: [FACTORFI_CONTRACT_ADDRESS, amt],
    }, {
      onSuccess: () => {
        setSettleStep('approved_usdc')
        toast.success('USDC Approval successful! Ready for final settlement.')
      },
      onError: (e) => toast.error('Approval failed', { description: e.message.slice(0, 80) }),
    })
  }

  const handleSettleInvoice = () => {
    if (!invoiceIdToSettle) return toast.error('Enter invoice ID')
    
    settleInvoice({
      address: FACTORFI_CONTRACT_ADDRESS, abi: factorFiAbi, functionName: 'settleInvoice',
      args: [BigInt(invoiceIdToSettle)],
    }, {
      onSuccess: (h) => {
        setSettleStep('settled')
        toast.success('Invoice settled & Investor repaid successfully!', {
          action: { label: 'View Tx', onClick: () => window.open(getExplorerTxLink(h), '_blank') }
        })
      },
      onError: (e) => toast.error('Settlement failed', { description: e.message.slice(0, 80) }),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Enterprise Programmatic Treasury Control Panel */}
      <div className="card" style={{ borderLeft: '4px solid var(--ff-primary)', background: 'linear-gradient(to bottom right, #09090b, rgba(0, 117, 255, 0.02))' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot size={22} color="var(--ff-primary)" className="pulse" />
            <div>
              <span className="card-title" style={{ fontSize: 16 }}>Enterprise Automated ERP API Settings</span>
              <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginTop: 2 }}>Circle Developer-Controlled Programmable Corporate Wallets</div>
            </div>
          </div>
          {progWallet && (
            <button 
              onClick={handleClearProgSession}
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: 11, borderColor: 'var(--ff-danger)', color: 'var(--ff-danger)' }}
            >
              Disconnect ERP
            </button>
          )}
        </div>

        {progWallet ? (
          <div style={{ padding: '16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Wallet Info & Keyring */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--ff-bg)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Corporate Entity Address</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--ff-mono)' }}>{progWallet.address.slice(0, 16)}...{progWallet.address.slice(-14)}</span>
                    <button onClick={() => handleCopy(progWallet.address, 'address')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-text-secondary)' }}>
                      {copiedKey === 'address' ? <Check size={12} color="var(--ff-success)" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
                <div style={{ background: 'var(--ff-bg)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--ff-border)', textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>USDC Balance</div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ff-primary)' }}>${progBalance}</span>
                </div>
              </div>

              <div style={{ background: 'var(--ff-bg)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>ERP Bearer Token (Authorization)</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: 6, borderRadius: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--ff-success)' }}>{progWallet.apiKey}</span>
                  <button onClick={() => handleCopy(progWallet.apiKey, 'api')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-text-secondary)' }}>
                    {copiedKey === 'api' ? <Check size={12} color="var(--ff-success)" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div style={{ background: 'var(--ff-bg)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KMS Encrypted Key (Encrypted Secret Vault)</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: 6, borderRadius: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)' }}>{progWallet.encryptedKey.slice(0, 48)}...</span>
                  <button onClick={() => handleCopy(progWallet.encryptedKey, 'secret')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-text-secondary)' }}>
                    {copiedKey === 'secret' ? <Check size={12} color="var(--ff-success)" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* API Sandbox Test Tools */}
              <div style={{ borderTop: '1px solid var(--ff-border)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ff-text)', marginBottom: 8 }}>ERP Programmatic Execution Test Console</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select 
                    className="form-input" 
                    value={apiAction} 
                    onChange={e => setApiAction(e.target.value as 'approve' | 'settle')}
                    style={{ flex: 1, padding: '4px 8px', fontSize: 12, height: 32 }}
                  >
                    <option value="approve">[POST] Approve Invoice</option>
                    <option value="settle">[POST] Settle Invoice</option>
                  </select>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Invoice ID" 
                    value={apiInvoiceId}
                    onChange={e => setApiInvoiceId(e.target.value)}
                    style={{ flex: 1, padding: '4px 8px', fontSize: 12, height: 32 }}
                  />
                  <button 
                    onClick={handleExecuteApiAction}
                    disabled={apiLoading}
                    className="btn btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 32, fontSize: 12 }}
                  >
                    {apiLoading ? <RefreshCw className="pulse" size={13} /> : <Send size={13} />}
                    Trigger
                  </button>
                </div>
              </div>
            </div>

            {/* Programmatic API logs screen */}
            <div style={{ display: 'flex', flexDirection: 'column', height: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--ff-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Terminal size={12} /> ERP API Interaction logs
                </span>
                <span className="pulse" style={{ fontSize: 9, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 6px', borderRadius: 4 }}>
                  Auto-sync active
                </span>
              </div>
              <div style={{
                flex: 1,
                background: '#040405',
                border: '1px solid var(--ff-border)',
                borderRadius: 6,
                padding: 12,
                fontFamily: 'var(--ff-mono)',
                fontSize: 10,
                color: '#10b981',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                {apiLogs.map((l, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--ff-primary)' }}>&gt;</span>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <Building2 size={36} color="var(--ff-text-muted)" style={{ margin: '0 auto 10px auto' }} />
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--ff-text)' }}>Programmatic ERP Setup Needed</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.4 }}>
              To instantiate automated corporate actions, please fill the "Register as Anchor" form below and select "Deploy Corporate Programmatic Wallet" to launch the ERP listener.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={handleDeployProgrammatic} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={16} /> Deploy Corporate Programmatic Wallet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Interface Controls (Standard Layout) */}
      <div className="grid-3">
        {/* Register */}
        <div className="card">
          <div className="card-header"><span className="card-title">Register as Anchor (Manual)</span></div>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input className="form-input" placeholder="Acme Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Credit Rating (0-1000)</label>
            <input className="form-input" type="number" min="0" max="1000" value={creditRating} onChange={e => setCreditRating(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleRegister} disabled={regPending || regConfirming}>
              <Building2 size={16} /> {regPending ? 'Signing...' : regConfirming ? 'Confirming...' : 'Register EOA Anchor'}
            </button>
            {!progWallet && (
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleDeployProgrammatic}>
                <Bot size={16} /> Deploy Programmatic Wallet
              </button>
            )}
          </div>
          {regSuccess && regHash && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ff-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} />
              <span>Registered!</span>
              <a href={getExplorerTxLink(regHash)} target="_blank" rel="noopener noreferrer" className="link-explorer" style={{ marginLeft: 'auto' }}>
                Arcscan <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Approve Invoice */}
        <div className="card">
          <div className="card-header"><span className="card-title">Approve Invoice (Manual)</span></div>
          <div className="form-group">
            <label className="form-label">Invoice ID</label>
            <input className="form-input" type="number" placeholder="0" value={invoiceIdToApprove} onChange={e => setInvoiceIdToApprove(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleApprove} disabled={apPending || apConfirming}>
            <CheckCircle size={16} /> {apPending ? 'Signing...' : apConfirming ? 'Confirming...' : 'Approve Invoice'}
          </button>
          {apSuccess && apHash && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ff-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} />
              <span>Approved!</span>
              <a href={getExplorerTxLink(apHash)} target="_blank" rel="noopener noreferrer" className="link-explorer" style={{ marginLeft: 'auto' }}>
                Arcscan <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Two-step Settle */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Settle Invoice (Manual)</span>
            <span className="badge badge-funded" style={{ background: 'var(--ff-primary-subtle)', color: 'var(--ff-primary)' }}>2-Step Flow</span>
          </div>
          <div className="form-group">
            <label className="form-label">Invoice ID</label>
            <input className="form-input" type="number" placeholder="0" value={invoiceIdToSettle} onChange={e => setInvoiceIdToSettle(e.target.value)} disabled={settleStep !== 'idle'} />
          </div>
          <div className="form-group">
            <label className="form-label">Face Value (USDC)</label>
            <input className="form-input" type="number" step="0.01" placeholder="1000.00" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} disabled={settleStep !== 'idle'} />
          </div>

          {settleStep === 'idle' && (
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }} 
              onClick={handleApproveUSDC} 
              disabled={approveUSDCPending || approveUSDCConfirming}
            >
              {approveUSDCPending ? 'Signing Approval...' : approveUSDCConfirming ? 'Confirming Approval...' : '1. Approve USDC Spending'}
            </button>
          )}

          {settleStep === 'approved_usdc' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--ff-success)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={14} /> USDC Spending Approved!
              </div>
              <button 
                className="btn btn-success" 
                style={{ width: '100%' }} 
                onClick={handleSettleInvoice} 
                disabled={stPending || stConfirming}
              >
                {stPending ? 'Signing Settlement...' : stConfirming ? 'Confirming Settlement...' : '2. Execute Settlement'}
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', fontSize: 11, padding: '4px' }} 
                onClick={() => setSettleStep('idle')}
              >
                Reset Flow
              </button>
            </div>
          )}

          {settleStep === 'settled' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--ff-success)', padding: '10px', background: 'var(--ff-success-subtle)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} /> Settlement Complete!
              </div>
              {stHash && (
                <a href={getExplorerTxLink(stHash)} target="_blank" rel="noopener noreferrer" className="link-explorer" style={{ textAlign: 'center', fontSize: 12 }}>
                  View on Arcscan <ExternalLink size={12} />
                </a>
              )}
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: 8 }} 
                onClick={() => {
                  setSettleStep('idle')
                  setInvoiceIdToSettle('')
                  setSettleAmount('')
                }}
              >
                Settle Another Invoice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
