'use client'

import { useState, useRef, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { Send, ExternalLink, Zap, UploadCloud, BrainCircuit, CheckCircle2, FileText, CheckCircle, Clock, ShieldAlert, BadgeInfo } from 'lucide-react'
import { toast } from 'sonner'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi } from '@/lib/contracts'
import { getExplorerTxLink } from '@/lib/utils'
import { getSmartAccountAddress } from '@/lib/smart-account'
import { useUnifiedAccount } from '@/lib/web3-provider'
import { SUPPORTED_TOKENS } from '@/lib/token-registry'

const MOCK_FILES = [
  { id: 'apple.pdf', name: 'apple_billets_invoice.pdf' },
  { id: 'tesla.pdf', name: 'tesla_chassis_supply_invoice.pdf' }
]

export default function SupplierView() {
  const { address } = useUnifiedAccount()
  
  // Selected Currency Stablecoin State
  const [selectedToken, setSelectedToken] = useState('USDC')

  // Invoice Form parameters
  const [anchorAddr, setAnchorAddr] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  
  // Dynamic signature verification values
  const [invoiceHash, setInvoiceHash] = useState<string>('')
  const [underwriterSignature, setUnderwriterSignature] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(0)
  const [riskBps, setRiskBps] = useState<number>(0)
  const [anchorRating, setAnchorRating] = useState<number>(0)

  // Account Abstraction / Gasless Toggle
  const [useGasless, setUseGasless] = useState(true)

  // Agent scanning & OCR state
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentComplete, setAgentComplete] = useState(false)
  const [agentLogs, setAgentLogs] = useState<{step: number, message: string, status: 'running' | 'done' | 'pending'}[]>([])
  
  // Paymaster/AA modal
  const [paymasterActive, setPaymasterActive] = useState(false)
  const [paymasterLogs, setPaymasterLogs] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const tokenConfig = SUPPORTED_TOKENS[selectedToken]

  // 1. PDF File Upload Handler
  const handlePdfUpload = async (file: File) => {
    if (!file) return
    
    setAgentRunning(true)
    setAgentComplete(false)
    setAgentLogs([
      { step: 1, message: `Uploading ${file.name} to AI Underwriting Engine...`, status: 'running' },
      { step: 2, message: 'OCR Engine: Parsing layout structures and text...', status: 'pending' },
      { step: 3, message: 'Oracle Node: Checking debtor credit ratings on Arc...', status: 'pending' },
      { step: 4, message: 'Crypto Shield: Generating anti-double factoring signature...', status: 'pending' }
    ])

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('token', tokenConfig.address)

      // Step 1 done
      await new Promise(r => setTimeout(r, 1000))
      setAgentLogs(prev => prev.map(l => l.step === 1 ? { ...l, status: 'done' } : l.step === 2 ? { ...l, status: 'running' } : l))

      const res = await fetch('/api/underwrite/ocr', {
        method: 'POST',
        body: formData
      })

      // Step 2 & 3 done
      await new Promise(r => setTimeout(r, 1200))
      setAgentLogs(prev => prev.map(l => l.step === 2 ? { ...l, status: 'done' } : l.step === 3 ? { ...l, status: 'running' } : l))

      if (!res.ok) {
        throw new Error('OCR Parsing failed')
      }

      const data = await res.json()

      await new Promise(r => setTimeout(r, 1000))
      setAgentLogs(prev => prev.map(l => l.step === 3 ? { ...l, status: 'done' } : l.step === 4 ? { ...l, status: 'running' } : l))

      await new Promise(r => setTimeout(r, 800))
      setAgentLogs(prev => prev.map(l => l.step === 4 ? { ...l, status: 'done' } : l))

      // Update state with parsed values
      setAnchorAddr(data.details.anchor)
      setAmount(data.details.amount)
      
      // format date to yyyy-MM-dd
      const dateStr = new Date(data.details.dueDate * 1000).toISOString().split('T')[0]
      setDueDate(dateStr)
      setDescription(data.details.description)
      
      // cryptographic credentials
      setInvoiceHash(data.invoiceHash)
      setUnderwriterSignature(data.signature)
      setConfidence(data.confidence)
      setRiskBps(data.riskMarginBps)
      setAnchorRating(data.anchorRating)

      setAgentRunning(false)
      setAgentComplete(true)
      toast.success('Invoice OCR analysis finished successfully!')

    } catch (err: any) {
      console.error(err)
      setAgentRunning(false)
      toast.error('AI Underwriter Error', { description: err.message })
    }
  }

  // Trigger file selection dialog
  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  // Handle file select element change
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handlePdfUpload(file)
  }

  // Shortcut simulation uploads
  const simulateSandboxUpload = (type: 'apple' | 'tesla') => {
    const mockFile = new File(['invoice content'], type === 'apple' ? 'apple_wafer_invoice.pdf' : 'tesla_powerwall_invoice.pdf', { type: 'application/pdf' })
    handlePdfUpload(mockFile)
  }

  // 2. Submit Transaction flow (supporting signatures)
  const handleSubmit = async () => {
    if (!address) return toast.error('Connect wallet first')
    if (!anchorAddr || !amount || !dueDate) return toast.error('Fill all required fields')
    
    // Fallbacks if no OCR signature is present (e.g. manual bypass)
    const activeHash = invoiceHash || '0x0000000000000000000000000000000000000000000000000000000000000000'
    const activeSig = underwriterSignature || '0x'

    const amountParsed = parseUnits(amount, tokenConfig.decimals)
    const dueDateUnix = BigInt(Math.floor(new Date(dueDate).getTime() / 1000))

    if (useGasless) {
      setPaymasterActive(true)
      setPaymasterLogs([
        'Initializing Smart Account client (SimpleAccount)...',
      ])

      try {
        const saAddress = getSmartAccountAddress(address as `0x${string}`)
        setPaymasterLogs(prev => [
          ...prev,
          `Determined smart account address: ${saAddress.slice(0, 10)}...${saAddress.slice(-8)}`,
          'Requesting transaction gas sponsorship from /api/paymaster/sponsor...',
        ])

        await new Promise(r => setTimeout(r, 600))
        
        const response = await fetch('/api/paymaster/sponsor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplier: address,
            anchor: anchorAddr,
            amount: amount,
            dueDate: dueDate,
            description: description || 'AI Sponsored Invoice',
            invoiceHash: activeHash,
            signature: activeSig,
            token: tokenConfig.address
          }),
        })

        const resData = await response.json()
        if (!response.ok) throw new Error(resData.error || 'Failed to connect to paymaster server')

        setPaymasterLogs(prev => [
          ...prev,
          `Sponsorship Approved by Paymaster: ${resData.paymaster.slice(0, 10)}...`,
          `Broadcasting UserOperation (${tokenConfig.symbol} Gas Fee sponsored by Circle Gas Station)...`,
          `Transaction Confirmed! Hash: ${resData.hash}`,
        ])

        toast.success('Invoice submitted successfully!', {
          description: `Gas sponsored by FactorFi Paymaster. Asset: ${tokenConfig.symbol}`,
          action: { label: 'View Tx', onClick: () => window.open(getExplorerTxLink(resData.hash), '_blank') },
        })

        setTimeout(() => setPaymasterActive(false), 3000)

      } catch (err: any) {
        console.error(err)
        setPaymasterLogs(prev => [...prev, `Execution failed: ${err.message.slice(0, 70)}`])
        toast.error('Transaction failed', { description: err.message.slice(0, 80) })
        setTimeout(() => setPaymasterActive(false), 4500)
      }
    } else {
      writeContract({
        address: FACTORFI_CONTRACT_ADDRESS,
        abi: factorFiAbi,
        functionName: 'submitInvoice',
        args: [
          anchorAddr as `0x${string}`, 
          amountParsed, 
          dueDateUnix, 
          description || 'Invoice',
          activeHash as `0x${string}`,
          activeSig as `0x${string}`,
          tokenConfig.address as `0x${string}`
        ],
      }, {
        onSuccess: (hash) => {
          toast.success('Invoice submitted successfully!', {
            action: { label: 'View Tx', onClick: () => window.open(getExplorerTxLink(hash), '_blank') },
          })
        },
        onError: (err) => {
          toast.error('Transaction failed', { description: err.message.slice(0, 80) })
        },
      })
    }
  }

  return (
    <>
      {paymasterActive && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: 500, width: '90%', background: '#09090b', borderColor: 'var(--ff-primary)' }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--ff-border)' }}>
              <Zap size={18} color="var(--ff-primary)" className="pulse" />
              <span className="card-title">Arc Paymaster Sponsor Execution</span>
            </div>
            <div style={{ padding: '16px 0', fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ff-text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paymasterLogs.map((l, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--ff-primary)' }}>&gt;</span>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OCR AI Scanner Dashboard Section */}
      <div className="card" style={{ marginBottom: 24, border: '1px solid var(--ff-border)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrainCircuit size={18} color="var(--ff-primary)" /> Autonomous OCR Underwriter Portal
          </span>
          <span className="badge badge-approved">AI Verification Enabled</span>
        </div>
        
        <div className="grid-2" style={{ marginTop: 12, gap: 20 }}>
          {/* File drag-drop input zone */}
          <div 
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed var(--ff-border)', padding: 24, borderRadius: 8, cursor: 'pointer',
              background: 'rgba(255,255,255,0.01)', transition: 'border-color 0.2s'
            }}
            onClick={triggerFileSelect}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="application/pdf"
              onChange={onFileChange}
            />
            <UploadCloud size={36} color="var(--ff-primary)" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ff-text)' }}>Upload PDF Corporate Invoice</div>
            <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginTop: 4 }}>Drag & drop standard PDF files or click to open browser</div>
            
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ height: 26, fontSize: 10, padding: '0 8px' }}
                onClick={(e) => { e.stopPropagation(); simulateSandboxUpload('apple') }}
              >
                Mock Apple Invoice
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ height: 26, fontSize: 10, padding: '0 8px' }}
                onClick={(e) => { e.stopPropagation(); simulateSandboxUpload('tesla') }}
              >
                Mock Tesla Invoice
              </button>
            </div>
          </div>

          {/* Running progress logs */}
          <div style={{ background: '#050505', border: '1px solid var(--ff-border)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ff-text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 12 }}>
              Agentic Scan Monitor
            </span>
            {agentRunning ? (
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {agentLogs.map((log) => (
                  <div key={log.step} style={{ display: 'flex', gap: 8, color: log.status === 'done' ? 'var(--ff-success)' : log.status === 'running' ? 'var(--ff-primary)' : '#444' }}>
                    <span>{log.status === 'done' ? '✓' : log.status === 'running' ? '●' : '○'}</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            ) : agentComplete ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ff-success)', fontSize: 12, fontWeight: 700 }}>
                  <CheckCircle size={14} /> OCR Scan successfully parsed and cryptographically validated!
                </div>
                
                <table style={{ width: '100%', fontSize: 11 }}>
                  <tbody>
                    <tr>
                      <td style={{ color: 'var(--ff-text-muted)', padding: '2px 0' }}>AI Confidence Rating</td>
                      <td style={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>{(confidence * 100).toFixed(0)}%</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--ff-text-muted)', padding: '2px 0' }}>Debtor rating on Arc</td>
                      <td style={{ fontWeight: 700, color: 'var(--ff-success)', textAlign: 'right' }}>{anchorRating} / 1000</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--ff-text-muted)', padding: '2px 0' }}>Invoice Signature</td>
                      <td style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ff-primary)', textAlign: 'right' }}>
                        {underwriterSignature ? `${underwriterSignature.slice(0, 16)}...` : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--ff-text-muted)', fontSize: 12 }}>
                <BadgeInfo size={20} style={{ margin: '0 auto 8px', color: '#666' }} />
                No invoice currently scanned. Select mock shortcuts or upload an invoice PDF file above to execute underwriting parser.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Verification & Edit Fields form */}
        <div className="card" style={{ borderColor: useGasless ? 'var(--ff-primary)' : 'var(--ff-border)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Parsed Metadata Verification</span>
            
            <div 
              style={{ 
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500,
                background: useGasless ? 'var(--ff-primary-subtle)' : 'var(--ff-bg)', 
                color: useGasless ? 'var(--ff-primary)' : 'var(--ff-text-muted)',
                padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${useGasless ? 'var(--ff-primary)' : 'var(--ff-border)'}`
              }}
              onClick={() => setUseGasless(!useGasless)}
            >
              <Zap size={12} fill={useGasless ? 'currentColor' : 'none'} />
              Gasless Execution
            </div>
          </div>

          <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)' }}>
            Confirm or adjust parsed OCR parameters prior to blockchain submission.
          </p>

          <div className="form-group">
            <label className="form-label">Currency Stablecoin *</label>
            <select 
              className="form-select" 
              value={selectedToken} 
              onChange={e => setSelectedToken(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--ff-bg)',
                color: 'var(--ff-text)',
                border: '1px solid var(--ff-border)',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none'
              }}
            >
              {Object.keys(SUPPORTED_TOKENS).map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol} — {SUPPORTED_TOKENS[symbol].name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Anchor Address *</label>
            <input className="form-input form-input-mono" value={anchorAddr} onChange={e => setAnchorAddr(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Amount ({tokenConfig.icon} {tokenConfig.symbol}) *</label>
            <input className="form-input" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Due Date *</label>
            <input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Invoice Number</label>
            <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleSubmit} disabled={isPending || isConfirming || !address}>
            {useGasless ? <Zap size={16} /> : <Send size={16} />}
            {isPending ? 'Signing...' : isConfirming ? 'Confirming...' : useGasless ? `Execute via Paymaster (Free ${tokenConfig.symbol})` : 'Submit Invoice'}
          </button>

          {isSuccess && txHash && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--ff-success-subtle)', fontSize: 13 }}>
              <span style={{ color: 'var(--ff-success)', fontWeight: 600 }}>{tokenConfig.symbol} Settled On-Chain!</span>
              <a href={getExplorerTxLink(txHash)} target="_blank" rel="noopener noreferrer" className="link-explorer" style={{ marginLeft: 8 }}>
                View on Arcscan <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Dynamic Risk Analysis Metrics */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-header"><span className="card-title">Dynamic Risk Analysis & Security</span></div>
          
          <div style={{ padding: 14, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: 'var(--ff-primary)', marginBottom: 6 }}>
              <CheckCircle2 size={14} /> Double Factoring Protection
            </div>
            <div style={{ fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.5 }}>
              On-chain hashes prevent suppliers from submission duplication. 
              {invoiceHash ? (
                <div style={{ marginTop: 8, fontFamily: 'var(--ff-mono)', fontSize: 10, background: '#111', padding: '6px 10px', borderRadius: 4, border: '1px solid #222', wordBreak: 'break-all' }}>
                  Hash: {invoiceHash}
                </div>
              ) : (
                ' A cryptographic checksum of parsed details is generated and validated against historical mappings.'
              )}
            </div>
          </div>

          <div style={{ padding: 14, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: 'var(--ff-success)', marginBottom: 6 }}>
              <Zap size={14} /> Gasless Auto-Verification
            </div>
            <div style={{ fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.5 }}>
              Approved invoices qualify for automatic ERC-4337 gas sponsorship sponsored by the FactorFi paymaster registry. Suppliers incur $0 in gas.
            </div>
          </div>

          <div style={{ padding: 14, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: 'var(--ff-warn)', marginBottom: 6 }}>
              <ShieldAlert size={14} color="var(--ff-primary)" /> Anti-Fraud Compliance
            </div>
            <div style={{ fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.5 }}>
              Verification checks require signatures from registered AI underwriter agents. Submissions lacking valid signatures will fail.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
