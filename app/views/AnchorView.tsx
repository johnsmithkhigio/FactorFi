'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Building2, CheckCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi, USDC_ADDRESS_ARC, usdcAbi, USDC_DECIMALS } from '@/lib/contracts'
import { getExplorerTxLink } from '@/lib/utils'
import { parseUnits } from 'viem'

export default function AnchorView() {
  const { address } = useAccount()
  const [companyName, setCompanyName] = useState('')
  const [creditRating, setCreditRating] = useState('800')
  const [invoiceIdToApprove, setInvoiceIdToApprove] = useState('')
  const [invoiceIdToSettle, setInvoiceIdToSettle] = useState('')
  const [settleAmount, setSettleAmount] = useState('')

  const { writeContract: registerAnchor, data: regHash, isPending: regPending } = useWriteContract()
  const { isLoading: regConfirming, isSuccess: regSuccess } = useWaitForTransactionReceipt({ hash: regHash })

  const { writeContract: approve, data: apHash, isPending: apPending } = useWriteContract()
  const { isLoading: apConfirming, isSuccess: apSuccess } = useWaitForTransactionReceipt({ hash: apHash })

  const { writeContract: settle, data: stHash, isPending: stPending } = useWriteContract()

  const handleRegister = () => {
    if (!companyName) return toast.error('Enter company name')
    registerAnchor({
      address: FACTORFI_CONTRACT_ADDRESS, abi: factorFiAbi, functionName: 'registerAnchor',
      args: [companyName, BigInt(creditRating)],
    }, {
      onSuccess: (h) => toast.success('Anchor registered!', { action: { label: 'View', onClick: () => window.open(getExplorerTxLink(h), '_blank') } }),
      onError: (e) => toast.error('Failed', { description: e.message.slice(0, 80) }),
    })
  }

  const handleApprove = () => {
    if (!invoiceIdToApprove) return toast.error('Enter invoice ID')
    approve({
      address: FACTORFI_CONTRACT_ADDRESS, abi: factorFiAbi, functionName: 'approveInvoice',
      args: [BigInt(invoiceIdToApprove)],
    }, {
      onSuccess: (h) => toast.success('Invoice approved!', { action: { label: 'View', onClick: () => window.open(getExplorerTxLink(h), '_blank') } }),
      onError: (e) => toast.error('Failed', { description: e.message.slice(0, 80) }),
    })
  }

  const handleSettle = () => {
    if (!invoiceIdToSettle) return toast.error('Enter invoice ID')
    // First approve USDC spending, then settle
    if (settleAmount) {
      const amt = parseUnits(settleAmount, USDC_DECIMALS)
      settle({
        address: USDC_ADDRESS_ARC, abi: usdcAbi, functionName: 'approve',
        args: [FACTORFI_CONTRACT_ADDRESS, amt],
      }, {
        onSuccess: () => {
          toast.info('USDC approved, now settling...')
          settle({
            address: FACTORFI_CONTRACT_ADDRESS, abi: factorFiAbi, functionName: 'settleInvoice',
            args: [BigInt(invoiceIdToSettle)],
          }, {
            onSuccess: (h) => toast.success('Invoice settled!', { action: { label: 'View', onClick: () => window.open(getExplorerTxLink(h), '_blank') } }),
            onError: (e) => toast.error('Settlement failed', { description: e.message.slice(0, 80) }),
          })
        },
        onError: (e) => toast.error('Approval failed', { description: e.message.slice(0, 80) }),
      })
    }
  }

  return (
    <div className="grid-3">
      {/* Register */}
      <div className="card">
        <div className="card-header"><span className="card-title">Register as Anchor</span></div>
        <div className="form-group">
          <label className="form-label">Company Name</label>
          <input className="form-input" placeholder="Acme Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Credit Rating (0-1000)</label>
          <input className="form-input" type="number" min="0" max="1000" value={creditRating} onChange={e => setCreditRating(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleRegister} disabled={regPending || regConfirming}>
          <Building2 size={16} /> {regPending ? 'Signing...' : regConfirming ? 'Confirming...' : 'Register Anchor'}
        </button>
        {regSuccess && regHash && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ff-success)' }}>
            Registered! <a href={getExplorerTxLink(regHash)} target="_blank" className="link-explorer">Arcscan <ExternalLink size={12} /></a>
          </div>
        )}
      </div>

      {/* Approve Invoice */}
      <div className="card">
        <div className="card-header"><span className="card-title">Approve Invoice</span></div>
        <div className="form-group">
          <label className="form-label">Invoice ID</label>
          <input className="form-input" type="number" placeholder="0" value={invoiceIdToApprove} onChange={e => setInvoiceIdToApprove(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleApprove} disabled={apPending || apConfirming}>
          <CheckCircle size={16} /> {apPending ? 'Signing...' : apConfirming ? 'Confirming...' : 'Approve Invoice'}
        </button>
        {apSuccess && apHash && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ff-success)' }}>
            Approved! <a href={getExplorerTxLink(apHash)} target="_blank" className="link-explorer">Arcscan <ExternalLink size={12} /></a>
          </div>
        )}
      </div>

      {/* Settle */}
      <div className="card">
        <div className="card-header"><span className="card-title">Settle Invoice</span></div>
        <div className="form-group">
          <label className="form-label">Invoice ID</label>
          <input className="form-input" type="number" placeholder="0" value={invoiceIdToSettle} onChange={e => setInvoiceIdToSettle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Face Value (USDC)</label>
          <input className="form-input" type="number" step="0.01" placeholder="1000.00" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} />
        </div>
        <button className="btn btn-success" style={{ width: '100%' }} onClick={handleSettle} disabled={stPending}>
          Settle & Pay Investor
        </button>
      </div>
    </div>
  )
}
