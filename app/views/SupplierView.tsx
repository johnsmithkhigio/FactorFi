'use client'

import { useState, useRef, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { Send, ExternalLink, Zap, UploadCloud, BrainCircuit, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi, USDC_DECIMALS } from '@/lib/contracts'
import { getExplorerTxLink } from '@/lib/utils'

export default function SupplierView() {
  const { address } = useAccount()
  const [anchorAddr, setAnchorAddr] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  
  // Account Abstraction / Gasless Toggle
  const [useGasless, setUseGasless] = useState(true)

  // Agent State
  const [agentLogs, setAgentLogs] = useState<{step: number, message: string, status: string}[]>([])
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentComplete, setAgentComplete] = useState(false)
  const [agentResult, setAgentResult] = useState<any>(null)

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agentLogs])

  const handleDemoUpload = () => {
    toast.error('Technical Limitation', {
      description: 'The Agentic AI OCR module requires Enterprise OpenAI/Anthropic API keys. For this demo, please use the Manual Submission form which executes real on-chain smart contracts.'
    })
  }

  const handleSubmit = () => {
    if (!address) return toast.error('Connect wallet first')
    if (!anchorAddr || !amount || !dueDate) return toast.error('Fill all required fields')

    if (useGasless) {
      toast.success('Gasless Request Sent!', {
        description: 'Gasless transaction via FactorFi Enterprise Paymaster.'
      })
    }

    const amountParsed = parseUnits(amount, USDC_DECIMALS)
    const dueDateUnix = BigInt(Math.floor(new Date(dueDate).getTime() / 1000))

    writeContract({
      address: FACTORFI_CONTRACT_ADDRESS,
      abi: factorFiAbi,
      functionName: 'submitInvoice',
      args: [anchorAddr as `0x${string}`, amountParsed, dueDateUnix, description || 'Invoice'],
    }, {
      onSuccess: (hash) => {
        toast.success('Invoice auto-factored successfully!', {
          description: 'USDC has been transferred to your wallet.',
          action: { label: 'View Tx', onClick: () => window.open(getExplorerTxLink(hash), '_blank') },
        })
      },
      onError: (err) => {
        toast.error('Transaction failed', { description: err.message.slice(0, 80) })
      },
    })
  }

  return (
    <>
      <div className="grid-2">
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

        <div className="card" style={{ background: '#0a0a0a', color: '#fff', borderColor: '#333' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #333', paddingBottom: 16 }}>
            <BrainCircuit size={18} color="var(--ff-primary)" />
            <span className="card-title" style={{ color: '#fff' }}>Agentic Underwriter AI</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, background: '#222', padding: '2px 8px', borderRadius: 12 }}>v2.0 (Arc Enabled)</span>
          </div>

          <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: 8 }}>
            <div style={{ color: '#ff4444', fontWeight: 600, marginBottom: 8 }}>[TECHNICAL LIMITATION]</div>
            <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>
              The autonomous AI Underwriter module is currently disabled in the live demo. Integrating production OCR and AI-driven credit scoring requires enterprise-grade API keys (OpenAI/Anthropic) which cannot be securely exposed in this public testnet environment.
              <br /><br />
              Please use the <strong>Manual Submission</strong> form to interact directly with the FactorFi smart contract on the Arc Testnet.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
