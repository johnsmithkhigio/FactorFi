'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { TrendingUp, ExternalLink, DollarSign, Settings, Play, CheckCircle, Activity, ShieldCheck, Cpu } from 'lucide-react'
import { toast } from 'sonner'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi, USDC_ADDRESS_ARC, usdcAbi, USDC_DECIMALS } from '@/lib/contracts'
import { getExplorerTxLink, formatUSDC, STATUS_LABELS, calculateYield, formatDate } from '@/lib/utils'

export default function InvestorView() {
  const { address } = useAccount()
  const [invoiceId, setInvoiceId] = useState('')
  const [lookupId, setLookupId] = useState('')
  const [discountBps, setDiscountBps] = useState('300') // 3% default
  
  // Vault state
  const [vaultAmount, setVaultAmount] = useState('10000')
  const [minDiscount, setMinDiscount] = useState('2.5')
  const [minScore, setMinScore] = useState('900')
  const [vaultActive, setVaultActive] = useState(false)
  const [scanLogs, setScanLogs] = useState<{time: string, msg: string, type: 'info'|'success'|'warn'}[]>([])

  const { writeContract: approveUSDC, isPending: approvePending } = useWriteContract()
  const { writeContract: fundInvoice, data: fundHash, isPending: fundPending } = useWriteContract()
  const { isLoading: fundConfirming, isSuccess: fundSuccess } = useWaitForTransactionReceipt({ hash: fundHash })

  // Lookup invoice
  const { data: invoiceData, refetch } = useReadContract({
    address: FACTORFI_CONTRACT_ADDRESS,
    abi: factorFiAbi,
    functionName: 'getInvoice',
    args: lookupId ? [BigInt(lookupId)] : undefined,
    query: { enabled: !!lookupId },
  })

  const inv = invoiceData as any



  const handleFund = () => {
    if (!invoiceId || !discountBps) return toast.error('Enter invoice ID and discount')
    if (!inv || inv.status !== 1) return toast.error('Invoice must be in Approved status')

    const fundAmount = inv.amount - (inv.amount * BigInt(discountBps) / BigInt(10000))

    approveUSDC({
      address: USDC_ADDRESS_ARC, abi: usdcAbi, functionName: 'approve',
      args: [FACTORFI_CONTRACT_ADDRESS, fundAmount],
    }, {
      onSuccess: () => {
        toast.info('USDC approved, funding invoice...')
        fundInvoice({
          address: FACTORFI_CONTRACT_ADDRESS, abi: factorFiAbi, functionName: 'fundInvoice',
          args: [BigInt(invoiceId), BigInt(discountBps)],
        }, {
          onSuccess: (h) => toast.success('Invoice funded!', { action: { label: 'View', onClick: () => window.open(getExplorerTxLink(h), '_blank') } }),
          onError: (e) => toast.error('Funding failed', { description: e.message.slice(0, 80) }),
        })
      },
      onError: (e) => toast.error('Approval failed', { description: e.message.slice(0, 80) }),
    })
  }

  const activateVault = () => {
    toast.error('Technical Limitation', {
      description: 'The Programmable Yield Vault requires an active Enterprise Keeper Network (e.g., Chainlink Automation) to execute auto-funding. For this public demo, please use Manual Funding.'
    })
  }

  return (
    <>
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Manual Funding */}
        <div className="card">
          <div className="card-header"><span className="card-title">Manual Funding (Legacy)</span></div>
          <div className="form-group">
            <label className="form-label">Invoice ID</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" type="number" placeholder="0" value={lookupId} onChange={e => { setLookupId(e.target.value); setInvoiceId(e.target.value) }} />
              <button className="btn btn-secondary" onClick={() => refetch()}>Lookup</button>
            </div>
          </div>

          {inv && inv.amount > BigInt(0) ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: 14, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                <table style={{ width: '100%', fontSize: 13 }}>
                  <tbody>
                    {[
                      ['Status', STATUS_LABELS[Number(inv.status)] || 'Unknown'],
                      ['Amount', `$${formatUSDC(inv.amount)} USDC`],
                      ['Anchor', `${String(inv.anchor).slice(0, 10)}...`],
                      ['Due Date', inv.dueDate > 0 ? formatDate(Number(inv.dueDate)) : 'N/A'],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ padding: '6px 0', color: 'var(--ff-text-muted)', width: 100 }}>{label}</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, fontFamily: label === 'Amount' ? 'var(--ff-mono)' : 'inherit' }}>
                          {label === 'Status' ? (
                            <span className={`badge badge-${(value as string).toLowerCase()}`}>{value}</span>
                          ) : value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Discount (basis points) — your profit margin</label>
                <input className="form-input" type="number" placeholder="300" value={discountBps} onChange={e => setDiscountBps(e.target.value)} />
              </div>

              {Number(discountBps) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '12px 14px', background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                  <span>Gross profit:</span>
                  <span style={{ fontWeight: 700, color: 'var(--ff-success)', fontFamily: 'var(--ff-mono)' }}>
                    + ${formatUSDC(inv.amount * BigInt(discountBps) / BigInt(10000))} USDC
                  </span>
                </div>
              )}

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleFund} disabled={approvePending || fundPending || fundConfirming}>
                <DollarSign size={16} /> {approvePending ? 'Approving...' : fundPending ? 'Funding...' : fundConfirming ? 'Confirming...' : 'Fund Invoice'}
              </button>
            </div>
          ) : (
             <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ff-text-muted)', fontSize: 13, border: '1px dashed var(--ff-border)', borderRadius: 8, marginTop: 16 }}>
               Search for an Invoice ID to manually fund it.<br/>For institutional scale, use the Auto-Factor Vault.
             </div>
          )}
        </div>

        {/* Auto-Factor Vault */}
        <div className="card" style={{ background: '#0a0a0a', color: '#fff', borderColor: vaultActive ? 'var(--ff-primary)' : '#333', transition: 'all 0.3s' }}>
          <div className="card-header" style={{ marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 16 }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
              <Cpu size={18} color="var(--ff-primary)" />
              Programmable Yield Vault
              {vaultActive && <span className="pulse" style={{ width: 8, height: 8, background: 'var(--ff-success)', borderRadius: '50%' }} />}
            </span>
            <span style={{ fontSize: 11, background: '#222', padding: '2px 8px', borderRadius: 12 }}>Agentic Execution</span>
          </div>
          
          <div style={{ fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
            Institutional capital doesn't click buttons. Deposit USDC into the vault and define your risk parameters. The AI Oracle will automatically factor matching invoices.
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#ccc' }}>Vault Deposit Amount (USDC)</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="form-input form-input-mono" 
                type="number" 
                value={vaultAmount} 
                onChange={e => setVaultAmount(e.target.value)}
                disabled={vaultActive}
                style={{ paddingLeft: 32, background: '#111', borderColor: '#333', color: '#fff' }}
              />
              <span style={{ position: 'absolute', left: 12, top: 11, color: '#888' }}>$</span>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" style={{ color: '#ccc' }}>Min. Discount (%)</label>
              <input className="form-input form-input-mono" type="number" step="0.1" value={minDiscount} onChange={e => setMinDiscount(e.target.value)} disabled={vaultActive} style={{ background: '#111', borderColor: '#333', color: '#fff' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: '#ccc' }}>Min. Anchor Risk Score</label>
              <input className="form-input form-input-mono" type="text" value={minScore} onChange={e => setMinScore(e.target.value)} disabled={vaultActive} placeholder="e.g. A-" style={{ background: '#111', borderColor: '#333', color: '#fff' }} />
            </div>
          </div>

          <div style={{ padding: 14, background: '#111', borderRadius: 8, border: '1px solid #222', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Smart Rule Engine</div>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--ff-primary)' }}>
              if (invoice.discount &gt;= {minDiscount}% && anchor.score &gt;= {minScore}) {'{'}
              <br />&nbsp;&nbsp;autoFund(invoice.id);
              <br />{'}'}
            </div>
          </div>

            <button className="btn btn-primary" style={{ width: '100%', background: '#fff', color: '#000' }} onClick={activateVault}>
              <Settings size={16} /> Deploy Smart Vault
            </button>
          
          <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: 8 }}>
            <div style={{ color: '#ff4444', fontWeight: 600, marginBottom: 8 }}>[TECHNICAL LIMITATION]</div>
            <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>
              The Auto-Factor Vault feature is disabled in this environment. Fully autonomous yield generation requires an Enterprise Keeper Network to constantly scan the chain state and execute smart contracts automatically.
              <br /><br />
              Please use the <strong>Manual Funding</strong> interface on the left to execute real on-chain investments.
            </div>
          </div>
        </div>
      </div>
      
      {/* Portfolio Stats */}
      <div className="card">
        <div className="card-header"><span className="card-title">My Realized Yield (On-Chain)</span></div>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card" style={{ background: 'var(--ff-bg)' }}>
            <div className="stat-label">Total Realized Profit</div>
            <div className="stat-value" style={{ fontSize: 24, color: 'var(--ff-success)' }}>$0.00</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--ff-bg)' }}>
            <div className="stat-label">Invoices Funded</div>
            <div className="stat-value" style={{ fontSize: 24 }}>0</div>
          </div>
        </div>
      </div>
    </>
  )
}
