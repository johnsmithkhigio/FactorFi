'use client'

import { useState, useRef, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { Send, ExternalLink, Zap, UploadCloud, BrainCircuit, CheckCircle2, FileText, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi, USDC_DECIMALS } from '@/lib/contracts'
import { getExplorerTxLink } from '@/lib/utils'
import { getSmartAccountAddress } from '@/lib/smart-account'
import { useUnifiedAccount } from '@/lib/web3-provider'


const MOCK_INVOICES = [
  {
    id: 'apple',
    name: 'Apple Inc. — Aluminium Payout',
    amount: '85000.00',
    anchor: '0x32A398Da1243C8b991abA311a7db8fd860c234a5',
    dueDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    description: 'Invoice #AP-2026-091 — Grade A primary aluminum billets',
    creditScore: '980',
    grade: 'A+'
  },
  {
    id: 'tesla',
    name: 'Tesla Inc. — Chassis Components',
    amount: '42000.00',
    anchor: '0x7e83E412A43C8a215e57b149D70fd66a295D69a2',
    dueDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
    description: 'Invoice #TS-CH-8891 — Die-cast frame structural parts',
    creditScore: '940',
    grade: 'A'
  },
  {
    id: 'nvidia',
    name: 'NVIDIA Corp — PCB Assembly Payout',
    amount: '150000.00',
    anchor: '0x99aF9EC27D1D8AecF15e57b149D70fD66AA295d6',
    dueDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    description: 'Invoice #NV-AI-2026 — PCB assembly and testing services',
    creditScore: '995',
    grade: 'A++'
  }
]

export default function SupplierView() {
  const { address } = useUnifiedAccount()
  const [anchorAddr, setAnchorAddr] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  
  // Account Abstraction / Gasless Toggle
  const [useGasless, setUseGasless] = useState(true)

  // Agent State
  const [selectedMock, setSelectedMock] = useState<string>('')
  const [agentLogs, setAgentLogs] = useState<{step: number, message: string, status: 'running' | 'done' | 'pending'}[]>([])
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentComplete, setAgentComplete] = useState(false)
  const [agentResult, setAgentResult] = useState<any>(null)
  
  // Paymaster / AA log modal during submit
  const [paymasterActive, setPaymasterActive] = useState(false)
  const [paymasterLogs, setPaymasterLogs] = useState<string[]>([])

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agentLogs])

  const runAgenticAnalysis = async (invoiceId: string) => {
    const selected = MOCK_INVOICES.find(inv => inv.id === invoiceId)
    if (!selected) return

    setAgentRunning(true)
    setAgentComplete(false)
    setAgentResult(null)
    setAgentLogs([
      { step: 1, message: 'Initializing autonomous underwriting instance...', status: 'running' },
      { step: 2, message: 'OCR Module: Processing PDF structure...', status: 'pending' },
      { step: 3, message: 'OCR Module: Parsing debtor, amount, and due date...', status: 'pending' },
      { step: 4, message: 'Oracle Module: Validating dynamic credit rating on Arc...', status: 'pending' },
      { step: 5, message: 'Rules Module: Generating smart-discount recommendation...', status: 'pending' },
    ])

    // Step 1
    await new Promise(r => setTimeout(r, 1200))
    setAgentLogs(prev => prev.map(l => l.step === 1 ? { ...l, status: 'done' } : l.step === 2 ? { ...l, status: 'running' } : l))

    // Step 2
    await new Promise(r => setTimeout(r, 1500))
    setAgentLogs(prev => prev.map(l => l.step === 2 ? { ...l, status: 'done' } : l.step === 3 ? { ...l, status: 'running' } : l))

    // Step 3
    await new Promise(r => setTimeout(r, 1200))
    setAgentLogs(prev => prev.map(l => l.step === 3 ? { ...l, status: 'done' } : l.step === 4 ? { ...l, status: 'running' } : l))

    // Step 4
    await new Promise(r => setTimeout(r, 1500))
    setAgentLogs(prev => prev.map(l => l.step === 4 ? { ...l, status: 'done' } : l.step === 5 ? { ...l, status: 'running' } : l))

    // Step 5
    await new Promise(r => setTimeout(r, 1000))
    setAgentLogs(prev => prev.map(l => l.step === 5 ? { ...l, status: 'done' } : l))

    setAgentRunning(false)
    setAgentComplete(true)
    setAgentResult(selected)

    // Auto-fill manual form fields
    setAnchorAddr(selected.anchor)
    setAmount(selected.amount)
    setDueDate(selected.dueDate)
    setDescription(selected.description)

    toast.success('Agent analysis complete! Fields populated.')
  }

  const handleMockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedMock(val)
    if (val) {
      runAgenticAnalysis(val)
    }
  }

  const handleDemoUpload = () => {
    // Dropzone acts as a shortcut to Apple Inc. Mock Invoice
    setSelectedMock('apple')
    runAgenticAnalysis('apple')
    toast.info('Ingested sample invoice PDF structure. Running AI parser...')
  }

  const handleSubmit = async () => {
    if (!address) return toast.error('Connect wallet first')
    if (!anchorAddr || !amount || !dueDate) return toast.error('Fill all required fields')

    const amountParsed = parseUnits(amount, USDC_DECIMALS)
    const dueDateUnix = BigInt(Math.floor(new Date(dueDate).getTime() / 1000))

    if (useGasless) {
      setPaymasterActive(true)
      setPaymasterLogs([
        'Initializing Smart Account client (SimpleAccount)...',
      ])

      try {
        // 1. Calculate user's Smart Account address dynamically
        const saAddress = getSmartAccountAddress(address as `0x${string}`)
        setPaymasterLogs(prev => [
          ...prev,
          `Determined smart account address: ${saAddress.slice(0, 10)}...${saAddress.slice(-8)}`,
          'Formulating ERC-4337 UserOperation callData payload...',
        ])

        await new Promise(r => setTimeout(r, 600))
        
        setPaymasterLogs(prev => [
          ...prev,
          'Requesting transaction gas sponsorship from /api/paymaster/sponsor...',
        ])

        // 2. Make post request to backend paymaster endpoint to execute sponsored tx
        const response = await fetch('/app/api/paymaster/sponsor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supplier: address,
            anchor: anchorAddr,
            amount: amount,
            dueDate: dueDate,
            description: description || 'Sponsored Invoice',
          }),
        })

        // Handle path fallback in Next.js App vs Pages router structure
        let resData = await response.json()
        if (response.status === 404 || !response.ok) {
          // Retry under absolute relative path
          const retryResponse = await fetch('/api/paymaster/sponsor', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              supplier: address,
              anchor: anchorAddr,
              amount: amount,
              dueDate: dueDate,
              description: description || 'Sponsored Invoice',
            }),
          })
          resData = await retryResponse.json()
          if (!retryResponse.ok) {
            throw new Error(resData.error || 'Failed to connect to paymaster server')
          }
        }

        if (resData.error) {
          throw new Error(resData.error)
        }

        setPaymasterLogs(prev => [
          ...prev,
          `Sponsorship Approved by Paymaster: ${resData.paymaster.slice(0, 10)}...`,
          `Broadcasting UserOperation, sponsored fee (${resData.sponsoredGas}) by Circle Gas Station...`,
          `Transaction Confirmed! Hash: ${resData.hash}`,
        ])

        toast.success('Invoice submitted successfully!', {
          description: 'Gas sponsored by FactorFi Paymaster.',
          action: { label: 'View Tx', onClick: () => window.open(getExplorerTxLink(resData.hash), '_blank') },
        })

        setTimeout(() => {
          setPaymasterActive(false)
        }, 4000)

      } catch (err: any) {
        console.error(err)
        setPaymasterLogs(prev => [...prev, `Execution failed: ${err.message.slice(0, 60)}`])
        toast.error('Transaction failed', { description: err.message.slice(0, 80) })
        setTimeout(() => {
          setPaymasterActive(false)
        }, 5000)
      }
    } else {
      writeContract({
        address: FACTORFI_CONTRACT_ADDRESS,
        abi: factorFiAbi,
        functionName: 'submitInvoice',
        args: [anchorAddr as `0x${string}`, amountParsed, dueDateUnix, description || 'Invoice'],
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <span className="pulse" style={{ fontSize: 11, color: 'var(--ff-text-muted)', background: 'var(--ff-surface)', padding: '4px 10px', borderRadius: 4 }}>
                Sponsoring transaction...
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Manual Form */}
        <div className="card" style={{ borderColor: useGasless ? 'var(--ff-primary)' : 'var(--ff-border)', transition: 'all 0.3s' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Manual Submission</span>
            
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

          <div className="form-group">
            <label className="form-label">Anchor Company Address *</label>
            <input className="form-input form-input-mono" placeholder="0x..." value={anchorAddr} onChange={e => setAnchorAddr(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Invoice Amount (USDC) *</label>
            <input className="form-input" type="number" step="0.01" placeholder="1000.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Due Date *</label>
            <input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" placeholder="Invoice #1234 — Raw materials" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleSubmit} disabled={isPending || isConfirming || !address}>
            {useGasless ? <Zap size={16} /> : <Send size={16} />}
            {isPending ? 'Signing...' : isConfirming ? 'Confirming...' : useGasless ? 'Execute via Paymaster (Free)' : 'Submit Invoice'}
          </button>

          {isSuccess && txHash && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--ff-success-subtle)', fontSize: 13 }}>
              <span style={{ color: 'var(--ff-success)', fontWeight: 600 }}>USDC Settled On-Chain!</span>
              <a href={getExplorerTxLink(txHash)} target="_blank" rel="noopener noreferrer" className="link-explorer" style={{ marginLeft: 8 }}>
                View on Arcscan <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Dynamic AI Underwriter */}
        <div className="card" style={{ background: '#0a0a0a', color: '#fff', borderColor: '#333', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #333', paddingBottom: 16 }}>
            <BrainCircuit size={18} color="var(--ff-primary)" />
            <span className="card-title" style={{ color: '#fff' }}>Agentic Underwriter AI</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, background: '#222', padding: '2px 8px', borderRadius: 12 }}>v2.0 (Arc Enabled)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className="form-label" style={{ color: '#ccc' }}>Select Invoice for AI Ingestion</label>
            <select className="form-input" style={{ background: '#111', borderColor: '#333', color: '#fff' }} value={selectedMock} onChange={handleMockChange} disabled={agentRunning}>
              <option value="">-- Choose Corporate Invoice --</option>
              {MOCK_INVOICES.map(inv => (
                <option key={inv.id} value={inv.id}>{inv.name} (${parseFloat(inv.amount).toLocaleString()})</option>
              ))}
            </select>
          </div>

          <div style={{ textAlign: 'center', padding: '24px 16px', background: '#050505', border: '1px dashed #333', borderRadius: 8, cursor: 'pointer' }} onClick={handleDemoUpload}>
            <UploadCloud size={32} color="#888" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500 }}>Ingest PDF Invoice</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Drag & drop or click to run auto-OCR (Sandbox Mode)</div>
          </div>

          {agentRunning && (
            <div style={{ padding: 14, background: '#000', borderRadius: 6, border: '1px solid #222', fontFamily: 'var(--ff-mono)', fontSize: 11 }}>
              <div style={{ color: 'var(--ff-primary)', marginBottom: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} className="pulse" /> Running autonomous risk models...
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {agentLogs.map((log) => (
                  <div key={log.step} style={{ display: 'flex', gap: 8, color: log.status === 'done' ? '#666' : log.status === 'running' ? 'var(--ff-primary)' : '#444' }}>
                    <span>{log.status === 'done' ? '✓' : log.status === 'running' ? '●' : '○'}</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {agentComplete && agentResult && (
            <div style={{ padding: 16, background: 'var(--ff-success-subtle)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ff-success)', fontWeight: 600, marginBottom: 12 }}>
                <CheckCircle2 size={16} />
                <span>AI Underwriting Approved!</span>
              </div>
              <table style={{ width: '100%', fontSize: 12 }}>
                <tbody>
                  {[
                    ['Subject', agentResult.name],
                    ['Debtor Rating', `${agentResult.grade} (${agentResult.creditScore}/1000)`],
                    ['Double Factoring Risk', 'Negligible (Clean On-Chain Hist.)'],
                    ['Optimal BPS Discount', '300 BPS (3.0% yield)'],
                  ].map(([lbl, val]) => (
                    <tr key={lbl}>
                      <td style={{ padding: '4px 0', color: 'var(--ff-text-secondary)', width: 140 }}>{lbl}</td>
                      <td style={{ padding: '4px 0', fontWeight: 600, color: lbl === 'Debtor Rating' ? 'var(--ff-success)' : '#fff' }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ff-text-muted)', fontStyle: 'italic' }}>
                * Standard fields have been populated in the Manual Submission form on the left. Click "Execute via Paymaster" to finalize.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
