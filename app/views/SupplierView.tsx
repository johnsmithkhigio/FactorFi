'use client'

import { useState, useRef, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useSignMessage } from 'wagmi'
import { parseUnits } from 'viem'
import { Send, ExternalLink, Zap, UploadCloud, BrainCircuit, CheckCircle2, FileText, CheckCircle, Clock, ShieldAlert, BadgeInfo, Wallet, PlusCircle, Database, Check, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi, USDC_ADDRESS_ARC, usdcAbi } from '@/lib/contracts'
import { getExplorerTxLink } from '@/lib/utils'
import { getSmartAccountAddress } from '@/lib/smart-account'
import { useUnifiedAccount } from '@/lib/web3-provider'
import { SUPPORTED_TOKENS } from '@/lib/token-registry'

const MOCK_FILES = [
  { id: 'apple.pdf', name: 'apple_billets_invoice.pdf' },
  { id: 'tesla.pdf', name: 'tesla_chassis_supply_invoice.pdf' }
]

export default function SupplierView() {
  const { address, providerType } = useUnifiedAccount()
  
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
  const [reactAgentLogs, setReactAgentLogs] = useState<{timestamp: number, type: 'thought' | 'action' | 'observation' | 'output', message: string}[]>([])
  const [vaultLiquidity, setVaultLiquidity] = useState<string>('0')
  
  // Paymaster/AA modal
  const [paymasterActive, setPaymasterActive] = useState(false)
  const [paymasterLogs, setPaymasterLogs] = useState<string[]>([])

  // Gateway Nanopayments states
  const { signMessageAsync } = useSignMessage()
  const [gatewayBalance, setGatewayBalance] = useState<number | null>(null)
  const [depositAmount, setDepositAmount] = useState('0.05')
  const [depositing, setDepositing] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingLedger, setLoadingLedger] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const tokenConfig = SUPPORTED_TOKENS[selectedToken]

  // Fetch Gateway nanopayments info
  const fetchGatewayData = async () => {
    if (!address) return
    setLoadingLedger(true)
    try {
      const res = await fetch(`/api/underwrite/gateway/deposit?address=${address}`)
      if (res.ok) {
        const data = await res.json()
        setGatewayBalance(data.balance)
        setTransactions(data.transactions)
      }
    } catch (err) {
      console.error('Error fetching gateway data:', err)
    } finally {
      setLoadingLedger(false)
    }
  }

  useEffect(() => {
    fetchGatewayData()
  }, [address])

  // Process nanopayments deposit to backend
  const handleDeposit = async () => {
    if (!address) return toast.error('Connect wallet first')
    const parsedAmount = parseFloat(depositAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return toast.error('Invalid deposit amount')

    setDepositing(true)
    const toastId = toast.loading('Initiating USDC deposit transaction...')

    if (providerType === 'circle') {
      // Circle Programmable Wallet instant credit sandbox bypass
      try {
        const mockHash = '0xmock_circle_deposit_' + Date.now().toString(16) + Math.random().toString(16).slice(2, 8)
        
        await new Promise(r => setTimeout(r, 1200))

        const response = await fetch('/api/underwrite/gateway/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            amount: parsedAmount,
            txHash: mockHash
          })
        })

        if (response.ok) {
          toast.success(`Sandbox Deposit of ${depositAmount} USDC credited successfully!`, { id: toastId })
          fetchGatewayData()
        } else {
          toast.error('Failed to register deposit on backend', { id: toastId })
        }
        setDepositing(false)
      } catch (err: any) {
        toast.error(`Error: ${err.message}`, { id: toastId })
        setDepositing(false)
      }
      return
    }

    try {
      writeContract({
        address: USDC_ADDRESS_ARC,
        abi: usdcAbi,
        functionName: 'transfer',
        args: [FACTORFI_CONTRACT_ADDRESS, parseUnits(depositAmount, 6)]
      }, {
        onSuccess: async (hash) => {
          toast.loading('Confirming transaction on-chain...', { id: toastId })
          await new Promise(r => setTimeout(r, 2500))

          const response = await fetch('/api/underwrite/gateway/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address,
              amount: parsedAmount,
              txHash: hash
            })
          })

          if (response.ok) {
            toast.success(`Deposited ${depositAmount} USDC successfully!`, { id: toastId })
            fetchGatewayData()
          } else {
            toast.error('Failed to register deposit on backend', { id: toastId })
          }
          setDepositing(false)
        },
        onError: (err) => {
          toast.error(`Deposit rejected: ${err.message.slice(0, 60)}`, { id: toastId })
          setDepositing(false)
        }
      })
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: toastId })
      setDepositing(false)
    }
  }

  // 1. PDF File Upload Handler with x402 Handshake
  const handlePdfUpload = async (file: File) => {
    if (!file) return
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }
    
    setAgentRunning(true)
    setAgentComplete(false)
    setReactAgentLogs([])
    setAgentLogs([
      { step: 1, message: 'Checking Gateway Nanopayment Balance...', status: 'running' },
      { step: 2, message: 'Negotiating x402 payment handshake...', status: 'pending' },
      { step: 3, message: 'Signing nanopayment proof for OCR analysis...', status: 'pending' },
      { step: 4, message: 'Uploading file with x402 proof to AI Underwriting engine...', status: 'pending' },
      { step: 5, message: 'Oracle Node: Checking debtor credit ratings on Arc...', status: 'pending' },
      { step: 6, message: 'Crypto Shield: Generating anti-double factoring signature...', status: 'pending' }
    ])

    try {
      // Step 1: Check balance
      await new Promise(r => setTimeout(r, 600))
      const balanceRes = await fetch(`/api/underwrite/gateway/deposit?address=${address}`)
      if (!balanceRes.ok) throw new Error('Failed to verify balance')
      const balanceData = await balanceRes.json()
      
      if (balanceData.balance < 0.0001) {
        setAgentLogs(prev => prev.map(l => l.step === 1 ? { ...l, status: 'pending', message: '❌ Insufficient Gateway balance. Please deposit USDC.' } : l))
        throw new Error('Insufficient Gateway balance. Min $0.0001 USDC required.')
      }

      setAgentLogs(prev => prev.map(l => l.step === 1 ? { ...l, status: 'done' } : l.step === 2 ? { ...l, status: 'running' } : l))

      // Step 2: Handshake & signature generation
      await new Promise(r => setTimeout(r, 600))
      setAgentLogs(prev => prev.map(l => l.step === 2 ? { ...l, status: 'done' } : l.step === 3 ? { ...l, status: 'running' } : l))

      const timestamp = Date.now()
      const nonce = Math.floor(Math.random() * 1000000).toString()
      const amountVal = '0.0001'
      const message = `Circle Nanopayment: ${address.toLowerCase()} pays ${amountVal} USDC. Nonce: ${nonce}. Timestamp: ${timestamp}`
      
      let signature: string
      if (providerType === 'circle') {
        // Circle Webauthn embedded wallets require PIN user verification for signatures.
        // We use a bypass signature in the sandbox to prevent prompting the user for a PIN during a background OCR scan.
        signature = '0xcircle_bypass'
      } else {
        signature = await signMessageAsync({ message })
      }
      
      const proof = {
        signature,
        timestamp,
        nonce,
        address,
        amount: amountVal
      }
      const proofHeader = JSON.stringify(proof)

      setAgentLogs(prev => prev.map(l => l.step === 3 ? { ...l, status: 'done' } : l.step === 4 ? { ...l, status: 'running' } : l))

      // Step 3: Post file to OCR route with X-Nanopayment headers
      const formData = new FormData()
      formData.append('file', file)
      formData.append('token', tokenConfig.address)

      const res = await fetch('/api/underwrite/ocr', {
        method: 'POST',
        headers: {
          'X-Nanopayment-Proof': proofHeader,
          'X-Nanopayment-Address': address
        },
        body: formData
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || errorData.details || 'OCR Parsing failed')
      }

      const data = await res.json()

      // Update state balance
      if (data.newBalance !== undefined) {
        setGatewayBalance(data.newBalance)
      }

      setAgentLogs(prev => prev.map(l => l.step === 4 ? { ...l, status: 'done' } : l.step === 5 ? { ...l, status: 'running' } : l))
      await new Promise(r => setTimeout(r, 800))
      
      setAgentLogs(prev => prev.map(l => l.step === 5 ? { ...l, status: 'done' } : l.step === 6 ? { ...l, status: 'running' } : l))
      await new Promise(r => setTimeout(r, 600))

      setAgentLogs(prev => prev.map(l => l.step === 6 ? { ...l, status: 'done' } : l))

      // Update state with parsed values
      setAnchorAddr(data.details.anchor)
      setAmount(data.details.amount)
      
      const dateStr = new Date(data.details.dueDate * 1000).toISOString().split('T')[0]
      setDueDate(dateStr)
      setDescription(data.details.description)
      
      setInvoiceHash(data.invoiceHash)
      setUnderwriterSignature(data.signature)
      setConfidence(data.confidence)
      setRiskBps(data.riskMarginBps)
      setAnchorRating(data.anchorRating)
      setReactAgentLogs(data.logs || [])
      setVaultLiquidity(data.vaultLiquidity || '0')

      setAgentRunning(false)
      setAgentComplete(true)
      toast.success('Invoice OCR analysis finished successfully! Fee: $0.0001 USDC')
      
      fetchGatewayData() // reload transaction history
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

      {/* ═══ AI Document Intelligence Pipeline ═══ */}
      <div className="card" style={{ marginBottom: 24, border: '1px solid var(--ff-border)', overflow: 'hidden' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrainCircuit size={18} color="var(--ff-primary)" /> AI Document Intelligence
          </span>
          {agentRunning && <div className="ai-shimmer-bar" style={{ width: 80 }} />}
          {agentComplete && <span className="ai-decision ai-decision--approved"><CheckCircle size={13} /> Approved</span>}
          {!agentRunning && !agentComplete && <span className="badge badge-default" style={{ fontSize: 10 }}>Awaiting Upload</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* LEFT: Upload + Pipeline Steps */}
          <div style={{ padding: '20px 24px', borderRight: '1px solid var(--ff-border)' }}>
            {!agentRunning && !agentComplete ? (
              <div className="ai-dropzone" onClick={triggerFileSelect}>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={onFileChange} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(56,189,248,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UploadCloud size={22} color="var(--ff-primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ff-text)' }}>Import Invoice Document</div>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginTop: 2 }}>PDF up to 10MB — AI extracts all fields automatically</div>
                  </div>
                </div>
                <div className="ai-caps">
                  <div className="ai-cap-item"><Check size={11} /> OCR every page</div>
                  <div className="ai-cap-item"><Check size={11} /> Detect invoice fields</div>
                  <div className="ai-cap-item"><Check size={11} /> Verify supplier identity</div>
                  <div className="ai-cap-item"><Check size={11} /> Cross-check treasury</div>
                  <div className="ai-cap-item"><Check size={11} /> Calculate risk score</div>
                  <div className="ai-cap-item"><Check size={11} /> Generate underwriting</div>
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}>
                  <button type="button" className="btn btn-sm btn-secondary" style={{ fontSize: 10 }} onClick={(e) => { e.stopPropagation(); simulateSandboxUpload('apple') }}>
                    <FileText size={11} /> Apple Invoice
                  </button>
                  <button type="button" className="btn btn-sm btn-secondary" style={{ fontSize: 10 }} onClick={(e) => { e.stopPropagation(); simulateSandboxUpload('tesla') }}>
                    <FileText size={11} /> Tesla Invoice
                  </button>
                </div>
              </div>
            ) : (
              <div className="ai-file-thumb" style={{ marginBottom: 16 }}>
                <div className="ai-file-icon"><FileText size={18} /></div>
                <div className="ai-file-meta">
                  <div className="ai-file-name">{description?.toLowerCase().includes('apple') ? 'apple_wafer_invoice.pdf' : 'tesla_powerwall_invoice.pdf'}</div>
                  <div className="ai-file-size">{agentRunning ? 'Processing...' : 'Analysis complete'}</div>
                </div>
                {agentComplete && <CheckCircle size={16} color="var(--ff-success)" />}
              </div>
            )}

            {(agentRunning || agentComplete) && (
              <div className="ai-pipeline" style={{ marginTop: 4 }}>
                {agentLogs.map((log, idx) => {
                  const isLast = idx === agentLogs.length - 1
                  const nodeClass = log.status === 'done' ? 'ai-step-node--done' : log.status === 'running' ? 'ai-step-node--active' : 'ai-step-node--pending'
                  const connClass = log.status === 'done' ? 'ai-step-connector--done' : log.status === 'running' ? 'ai-step-connector--active' : ''
                  return (
                    <div className="ai-step" key={log.step} style={{ animationDelay: `${idx * 0.08}s` }}>
                      <div className="ai-step-indicator">
                        <div className={`ai-step-node ${nodeClass}`}>
                          {log.status === 'done' ? <Check size={14} /> : log.status === 'running' ? <Bot size={14} /> : <span style={{ fontSize: 11 }}>{log.step}</span>}
                        </div>
                        {!isLast && <div className={`ai-step-connector ${connClass}`} />}
                      </div>
                      <div className="ai-step-body">
                        <div className={`ai-step-title ${log.status === 'pending' ? 'ai-step-title--pending' : log.status === 'running' ? 'ai-step-title--active' : ''}`}>
                          {log.message}
                          {log.status === 'running' && (
                            <span className="ai-thinking"><span className="ai-thinking-dot" /><span className="ai-thinking-dot" /><span className="ai-thinking-dot" /></span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Document Preview + Results */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
            {agentRunning && (
              <div className="ai-doc-scan" style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
                <div className="ai-doc-scan-line" />
                <FileText size={48} color="var(--ff-text-muted)" style={{ opacity: 0.4 }} />
                <div style={{ fontSize: 13, color: 'var(--ff-primary)', marginTop: 14, fontWeight: 600 }}>
                  Analyzing document<span className="ai-thinking"><span className="ai-thinking-dot" /><span className="ai-thinking-dot" /><span className="ai-thinking-dot" /></span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginTop: 4 }}>Extracting entities and verifying signatures</div>
              </div>
            )}

            {agentComplete && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div className="ai-score-gauge">
                    <svg width="110" height="110" viewBox="0 0 110 110">
                      <circle className="ai-score-track" cx="55" cy="55" r="45" />
                      <circle className="ai-score-fill" cx="55" cy="55" r="45" stroke="var(--ff-success)" strokeDasharray="283" strokeDashoffset={283 - (283 * (anchorRating / 1000))} />
                    </svg>
                    <div className="ai-score-label">
                      <div className="ai-score-number" style={{ color: 'var(--ff-success)' }}>{anchorRating}</div>
                      <div className="ai-score-unit">/ 1000</div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Debtor Credit Score</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ff-success)', marginTop: 2 }}>
                      {anchorRating >= 700 ? 'Excellent' : anchorRating >= 500 ? 'Good' : 'Elevated Risk'}
                    </div>
                    <div className="ai-decision ai-decision--approved" style={{ marginTop: 8 }}><CheckCircle size={12} /> Underwriting Approved</div>
                  </div>
                </div>

                <div className="ai-result-panel">
                  <div className="ai-result-row"><span className="ai-result-key">OCR Confidence</span><span className="ai-result-value" style={{ color: 'var(--ff-success)' }}>{(confidence * 100).toFixed(0)}%</span></div>
                  <div className="ai-result-row"><span className="ai-result-key">Risk Margin</span><span className="ai-result-value">{riskBps} bps</span></div>
                  <div className="ai-result-row"><span className="ai-result-key">Vault Liquidity</span><span className="ai-result-value">{vaultLiquidity} USDC</span></div>
                  <div className="ai-result-row"><span className="ai-result-key">Verification Code</span><span className="ai-result-value" style={{ color: 'var(--ff-primary)', fontSize: 10 }}>{underwriterSignature ? `${underwriterSignature.slice(0, 14)}...` : 'N/A'}</span></div>
                </div>

                {reactAgentLogs.length > 0 && (
                  <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--ff-border)', borderRadius: 8, padding: '10px 14px', maxHeight: 130, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: 'var(--ff-primary)', marginBottom: 6 }}><Bot size={11} /> AI Reasoning Trace</div>
                    {reactAgentLogs.map((log, idx) => {
                      const c = log.type === 'action' ? '#3b82f6' : log.type === 'observation' ? '#a855f7' : log.type === 'output' ? 'var(--ff-success)' : 'var(--ff-text-muted)'
                      return (
                        <div key={idx} style={{ fontSize: 9.5, fontFamily: 'var(--ff-mono)', lineHeight: 1.35, marginBottom: 3 }}>
                          <span style={{ color: c, fontWeight: 700, marginRight: 4 }}>{log.type.toUpperCase()}:</span>
                          <span style={{ color: '#d1d5db' }}>{log.message}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {!agentRunning && !agentComplete && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px 16px', minHeight: 280 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <BrainCircuit size={28} color="var(--ff-primary)" style={{ opacity: 0.6 }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ff-text)', marginBottom: 4 }}>AI Analysis Ready</div>
                <div style={{ fontSize: 12, color: 'var(--ff-text-muted)', maxWidth: 260, lineHeight: 1.5 }}>
                  Upload an invoice to watch the AI extract fields, verify entities, and calculate risk scores in real time.
                </div>
                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(52,211,153,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} color="var(--ff-success)" style={{ opacity: 0.6 }} /></div>
                    <span style={{ fontSize: 9, color: 'var(--ff-text-muted)' }}>OCR</span>
                  </div>
                  <div style={{ color: 'var(--ff-text-muted)', alignSelf: 'center', fontSize: 10 }}>→</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(56,189,248,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldAlert size={14} color="var(--ff-primary)" style={{ opacity: 0.6 }} /></div>
                    <span style={{ fontSize: 9, color: 'var(--ff-text-muted)' }}>Verify</span>
                  </div>
                  <div style={{ color: 'var(--ff-text-muted)', alignSelf: 'center', fontSize: 10 }}>→</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={14} color="var(--ff-violet)" style={{ opacity: 0.6 }} /></div>
                    <span style={{ fontSize: 9, color: 'var(--ff-text-muted)' }}>Score</span>
                  </div>
                </div>
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
            Confirm or adjust invoice details prior to submitting request for funding.
          </p>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Currency Stablecoin *</label>
              <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 11 }}>
                ⓘ
                <span className="tooltip-content">
                  Select the stablecoin you wish to receive funding in (e.g., USDC or EURC).
                </span>
              </div>
            </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Anchor Address *</label>
              <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 11 }}>
                ⓘ
                <span className="tooltip-content">
                  The 42-character Ethereum/Arc network address of the buyer/debtor who owes this invoice (e.g., 0x70997970C51812dc3A010C7d01b50e0d17dc79C8).
                </span>
              </div>
            </div>
            <input 
              className="form-input form-input-mono" 
              placeholder="e.g. 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
              value={anchorAddr} 
              onChange={e => setAnchorAddr(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Amount ({tokenConfig.icon} {tokenConfig.symbol}) *</label>
              <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 11 }}>
                ⓘ
                <span className="tooltip-content">
                  The face value of the invoice to be financed. Ensure this matches the amount specified in your PDF document.
                </span>
              </div>
            </div>
            <input 
              className="form-input" 
              type="number" 
              step="0.01" 
              placeholder="e.g. 1500.00"
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Due Date *</label>
              <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 11 }}>
                ⓘ
                <span className="tooltip-content">
                  The maturity/due date of the invoice. Payout discount rates are calculated based on the days remaining until maturity.
                </span>
              </div>
            </div>
            <input 
              className="form-input" 
              type="date" 
              placeholder="Select due date"
              value={dueDate} 
              onChange={e => setDueDate(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Description / Invoice Number</label>
              <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 11 }}>
                ⓘ
                <span className="tooltip-content">
                  Optional reference identifier or brief description (e.g., INV-2026-0042 / Wafer Supply Shipment).
                </span>
              </div>
            </div>
            <input 
              className="form-input" 
              placeholder="e.g. INV-2026-0042 / Wafer Supply Shipment"
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleSubmit} disabled={isPending || isConfirming || !address}>
            {useGasless ? <Zap size={16} /> : <Send size={16} />}
            {isPending ? 'Signing...' : isConfirming ? 'Confirming...' : useGasless ? `Request Early Payment (No Network Fee)` : 'Submit Invoice'}
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
              <Zap size={14} /> Fee-Free Automated Verification
            </div>
            <div style={{ fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.5 }}>
              Approved invoices qualify for direct transaction fee sponsorship. Suppliers pay zero network processing fees.
            </div>
          </div>

          <div style={{ padding: 14, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: 'var(--ff-warn)', marginBottom: 6 }}>
              <ShieldAlert size={14} color="var(--ff-primary)" /> Risk Policy Verification
            </div>
            <div style={{ fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.5 }}>
              Verification checks require approval signatures from authenticated underwriting agents.
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Nanopayments Dashboard */}
      <div className="grid-2" style={{ marginTop: 24, gap: 20 }}>
        {/* Deposit Portal & Balance Widget */}
        <div className="card" style={{ border: '1px solid var(--ff-border)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wallet size={18} color="var(--ff-primary)" /> Analysis Credits Balance
            </span>
            <span className={`badge ${gatewayBalance !== null && gatewayBalance > 0 ? 'badge-approved' : 'badge-default'}`}>
              {gatewayBalance !== null && gatewayBalance > 0 ? 'Active' : 'No Balance'}
            </span>
          </div>

          <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--ff-border)', marginTop: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--ff-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Available Analysis Credits
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0' }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontFamily: 'var(--ff-mono)' }}>
                ${gatewayBalance !== null ? gatewayBalance.toFixed(4) : '0.0000'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ff-primary)' }}>USDC</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ff-text-muted)', margin: 0 }}>
              Pricing Rate: <strong>$0.0001 USDC</strong> per automated risk analysis page. Funded automatically.
            </p>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Fund Analysis Credits</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="number"
                  className="form-input"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.05"
                  step="0.01"
                  style={{ paddingRight: 50 }}
                  disabled={depositing || !address}
                />
                <span style={{ position: 'absolute', right: 12, top: 10, fontSize: 12, fontWeight: 600, color: 'var(--ff-text-muted)' }}>
                  USDC
                </span>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleDeposit}
                disabled={depositing || !address || !depositAmount}
                style={{ display: 'flex', gap: 6, alignItems: 'center' }}
              >
                <PlusCircle size={16} />
                {depositing ? 'Depositing...' : 'Deposit'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginTop: 6, marginInline: 2 }}>
              Requires standard USDC ERC-20 approval and wallet signature transfer.
            </p>
          </div>
        </div>

        {/* Dynamic Billing Ledger */}
        <div className="card" style={{ border: '1px solid var(--ff-border)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={18} color="var(--ff-success)" /> Activity and Billing History
            </span>
            <span style={{ fontSize: 11, color: 'var(--ff-text-muted)', fontWeight: 600 }}>
              Volume: {transactions.filter(t => t.type === 'spend').length} scans
            </span>
          </div>

          <div style={{ marginTop: 12, maxHeight: 220, overflowY: 'auto' }}>
            {loadingLedger ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ff-text-muted)', fontSize: 13 }}>
                Loading ledger records...
              </div>
            ) : transactions.length > 0 ? (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ff-border)', color: 'var(--ff-text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 4px', fontWeight: 600 }}>Time</th>
                    <th style={{ padding: '6px 4px', fontWeight: 600 }}>Activity</th>
                    <th style={{ padding: '6px 4px', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '6px 4px', fontWeight: 600, textAlign: 'right' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice().reverse().map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '8px 4px', color: 'var(--ff-text-muted)', fontFamily: 'var(--ff-mono)', fontSize: 10 }}>
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td style={{ padding: '8px 4px', fontWeight: 500 }}>
                        {t.type === 'deposit' ? 'Fund Credits' : 'Analysis Processing'}
                      </td>
                      <td style={{ padding: '8px 4px', fontFamily: 'var(--ff-mono)', fontWeight: 600, color: t.type === 'deposit' ? 'var(--ff-success)' : 'var(--ff-primary)' }}>
                        {t.type === 'deposit' ? '+' : '-'}${t.amount.toFixed(4)}
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                        {t.txHash ? (
                          <a href={getExplorerTxLink(t.txHash)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ff-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            Explorer <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ff-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                            <Check size={10} /> Signed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ff-text-muted)', fontSize: 12 }}>
                No billing history found.<br />Funding credits and processing invoices will populate records.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
