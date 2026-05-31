'use client'

import { useEffect, useState } from 'react'
import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import { formatUnits } from 'viem'
import {
  DollarSign, FileText, TrendingUp, CheckCircle, Clock,
  ArrowUpRight, ArrowDownLeft, ExternalLink, Activity, Users, Download
} from 'lucide-react'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi, USDC_ADDRESS_ARC, usdcAbi, USDC_DECIMALS } from '@/lib/contracts'
import { formatUSDC, truncateAddress, getExplorerTxLink, getExplorerAddressLink, STATUS_LABELS, timeAgo } from '@/lib/utils'
import { toast } from 'sonner'

interface InvoiceEvent {
  type: 'submitted' | 'approved' | 'funded' | 'settled'
  invoiceId: number
  from: string
  amount?: bigint
  txHash: string
  timestamp: number
}

export default function DashboardView() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [recentEvents, setRecentEvents] = useState<InvoiceEvent[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  // Protocol stats from contract
  const { data: stats } = useReadContract({
    address: FACTORFI_CONTRACT_ADDRESS,
    abi: factorFiAbi,
    functionName: 'getProtocolStats',
    query: { refetchInterval: 8000 },
  })

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS_ARC,
    abi: usdcAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  })

  const { data: anchorData } = useReadContract({
    address: FACTORFI_CONTRACT_ADDRESS,
    abi: factorFiAbi,
    functionName: 'getAnchor',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: creditData } = useReadContract({
    address: FACTORFI_CONTRACT_ADDRESS,
    abi: factorFiAbi,
    functionName: 'getCreditProfile',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const totalFactored = stats ? (stats as any)[0] : BigInt(0)
  const totalSettled = stats ? (stats as any)[1] : BigInt(0)
  const totalInvoices = stats ? Number((stats as any)[2]) : 0
  const feeBps = stats ? Number((stats as any)[3]) : 0
  const anchor = anchorData as any
  const credit = creditData as any

  const settlementRate = totalFactored > BigInt(0)
    ? Number((totalSettled * BigInt(10000)) / totalFactored) / 100
    : 0

  // Fetch recent on-chain events
  useEffect(() => {
    async function fetchEvents() {
      if (!publicClient) return
      setLoadingEvents(true)
      try {
        const blockNumber = await publicClient.getBlockNumber()
        const fromBlock = blockNumber > BigInt(5000) ? blockNumber - BigInt(5000) : BigInt(0)

        const [submitted, approved, funded, settled] = await Promise.all([
          publicClient.getLogs({
            address: FACTORFI_CONTRACT_ADDRESS,
            event: {
              type: 'event', name: 'InvoiceSubmitted',
              inputs: [
                { indexed: true, name: 'invoiceId', type: 'uint256' },
                { indexed: true, name: 'supplier', type: 'address' },
                { indexed: true, name: 'anchor', type: 'address' },
                { indexed: false, name: 'amount', type: 'uint256' },
                { indexed: false, name: 'dueDate', type: 'uint256' },
                { indexed: false, name: 'description', type: 'string' },
              ],
            },
            fromBlock,
          }).catch(() => []),
          publicClient.getLogs({
            address: FACTORFI_CONTRACT_ADDRESS,
            event: {
              type: 'event', name: 'InvoiceApproved',
              inputs: [
                { indexed: true, name: 'invoiceId', type: 'uint256' },
                { indexed: true, name: 'anchor', type: 'address' },
              ],
            },
            fromBlock,
          }).catch(() => []),
          publicClient.getLogs({
            address: FACTORFI_CONTRACT_ADDRESS,
            event: {
              type: 'event', name: 'InvoiceFunded',
              inputs: [
                { indexed: true, name: 'invoiceId', type: 'uint256' },
                { indexed: true, name: 'investor', type: 'address' },
                { indexed: false, name: 'fundedAmount', type: 'uint256' },
                { indexed: false, name: 'discountBps', type: 'uint256' },
              ],
            },
            fromBlock,
          }).catch(() => []),
          publicClient.getLogs({
            address: FACTORFI_CONTRACT_ADDRESS,
            event: {
              type: 'event', name: 'InvoiceSettled',
              inputs: [
                { indexed: true, name: 'invoiceId', type: 'uint256' },
                { indexed: true, name: 'anchor', type: 'address' },
                { indexed: false, name: 'investorPayout', type: 'uint256' },
                { indexed: false, name: 'protocolFee', type: 'uint256' },
              ],
            },
            fromBlock,
          }).catch(() => []),
        ])

        const events: InvoiceEvent[] = [
          ...submitted.map((e: any) => ({
            type: 'submitted' as const,
            invoiceId: Number(e.args.invoiceId),
            from: e.args.supplier,
            amount: e.args.amount,
            txHash: e.transactionHash,
            timestamp: Date.now() / 1000,
          })),
          ...approved.map((e: any) => ({
            type: 'approved' as const,
            invoiceId: Number(e.args.invoiceId),
            from: e.args.anchor,
            txHash: e.transactionHash,
            timestamp: Date.now() / 1000,
          })),
          ...funded.map((e: any) => ({
            type: 'funded' as const,
            invoiceId: Number(e.args.invoiceId),
            from: e.args.investor,
            amount: e.args.fundedAmount,
            txHash: e.transactionHash,
            timestamp: Date.now() / 1000,
          })),
          ...settled.map((e: any) => ({
            type: 'settled' as const,
            invoiceId: Number(e.args.invoiceId),
            from: e.args.anchor,
            amount: e.args.investorPayout,
            txHash: e.transactionHash,
            timestamp: Date.now() / 1000,
          })),
        ]

        setRecentEvents(events.slice(-20).reverse())
      } catch (err) {
        console.log('Events fetch:', err)
      }
      setLoadingEvents(false)
    }

    fetchEvents()
    const interval = setInterval(fetchEvents, 15000)
    return () => clearInterval(interval)
  }, [publicClient])

  // Fetch recent invoices
  useEffect(() => {
    async function fetchInvoices() {
      if (!publicClient || totalInvoices === 0) return
      const fetched: any[] = []
      const count = Math.min(totalInvoices, 8)
      for (let i = totalInvoices - 1; i >= totalInvoices - count && i >= 0; i--) {
        try {
          const inv = await publicClient.readContract({
            address: FACTORFI_CONTRACT_ADDRESS,
            abi: factorFiAbi,
            functionName: 'getInvoice',
            args: [BigInt(i)],
          })
          fetched.push(inv)
        } catch { break }
      }
      setInvoices(fetched)
    }
    fetchInvoices()
  }, [publicClient, totalInvoices])

  const handleExportCSV = () => {
    if (invoices.length === 0) return toast.error('No data to export')
    
    const headers = ['Invoice ID', 'Supplier', 'Anchor', 'Face Value (USDC)', 'Status', 'Discount (%)', 'Due Date']
    const rows = invoices.map(inv => [
      Number(inv.id),
      inv.supplier,
      inv.anchor,
      formatUSDC(inv.amount),
      STATUS_LABELS[Number(inv.status)] || 'Unknown',
      Number(inv.discountBps) > 0 ? (Number(inv.discountBps) / 100).toFixed(1) : '0',
      Number(inv.dueDate) > 0 ? new Date(Number(inv.dueDate) * 1000).toISOString().split('T')[0] : 'N/A'
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `FactorFi_Settlement_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Report exported successfully')
  }

  const EVENT_LABELS: Record<string, { label: string; color: string }> = {
    submitted: { label: 'SUBMITTED', color: 'var(--ff-warning)' },
    approved: { label: 'APPROVED', color: 'var(--ff-primary)' },
    funded: { label: 'FUNDED', color: 'var(--ff-violet)' },
    settled: { label: 'SETTLED', color: 'var(--ff-success)' },
  }

  return (
    <>
      {/* Protocol Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><DollarSign size={14} /> Factored Volume</div>
          <div className="stat-value">${formatUSDC(totalFactored)}</div>
          <div className="stat-change positive">Total invoices funded</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><CheckCircle size={14} /> Settled Volume</div>
          <div className="stat-value">${formatUSDC(totalSettled)}</div>
          <div className="stat-change positive">Repaid to investors</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><FileText size={14} /> Invoices Processed</div>
          <div className="stat-value">{totalInvoices}</div>
          <div className="stat-change">Across all anchors</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><TrendingUp size={14} /> Settlement Rate</div>
          <div className="stat-value">{settlementRate.toFixed(1)}%</div>
          <div className="stat-change positive">{feeBps} bps protocol fee</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Your Account */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Your Account</span>
          </div>
          {address ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--ff-bg)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginBottom: 2 }}>USDC Balance</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    ${usdcBalance ? formatUSDC(usdcBalance as bigint) : '0.00'}
                  </div>
                </div>
                <a href={getExplorerAddressLink(address)} target="_blank" rel="noopener noreferrer" className="link-explorer">
                  View on Arcscan <ExternalLink size={12} />
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '12px 14px', background: 'var(--ff-bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Role</div>
                  <span className={`badge ${anchor?.isRegistered ? 'badge-approved' : 'badge-submitted'}`}>
                    {anchor?.isRegistered ? `Anchor — ${anchor.name}` : 'Unregistered'}
                  </span>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--ff-bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Credit Score</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {credit && Number(credit.invoicesSettled) > 0
                      ? `${(Number(credit.onTimeRateBps) / 100).toFixed(0)}%`
                      : 'No history'}
                  </div>
                </div>
              </div>

              {credit && Number(credit.invoicesSettled) > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div style={{ padding: '10px 14px', background: 'var(--ff-bg)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ff-success)' }}>{Number(credit.invoicesSettled)}</div>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Settled</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'var(--ff-bg)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: Number(credit.invoicesDefaulted) > 0 ? 'var(--ff-danger)' : 'var(--ff-text)' }}>
                      {Number(credit.invoicesDefaulted)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Defaulted</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'var(--ff-bg)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{Number(credit.totalVolume)}</div>
                    <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Total Txns</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <Users size={40} />
              <h3>Connect your wallet</h3>
              <p>Connect to view your balance, role, and credit history.</p>
            </div>
          )}
        </div>

        {/* Recent Activity — Live Event Feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
            <span style={{ fontSize: 11, color: 'var(--ff-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Activity size={12} /> Live from Arc
            </span>
          </div>
          <div className="event-feed">
            {loadingEvents ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--ff-text-muted)', fontSize: 12 }}>
                Loading on-chain events...
              </div>
            ) : recentEvents.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--ff-text-muted)', fontSize: 12 }}>
                No activity yet. Submit your first invoice to get started.
              </div>
            ) : (
              recentEvents.map((evt, i) => (
                <div className="event-item" key={`${evt.txHash}-${i}`}>
                  <span className="event-type" style={{ color: EVENT_LABELS[evt.type].color, minWidth: 72 }}>
                    {EVENT_LABELS[evt.type].label}
                  </span>
                  <span className="event-detail" style={{ flex: 1 }}>
                    Invoice #{evt.invoiceId}
                    {evt.amount ? ` — $${formatUSDC(evt.amount)}` : ''}
                    {' '}by {truncateAddress(evt.from)}
                  </span>
                  <a href={getExplorerTxLink(evt.txHash)} target="_blank" rel="noopener noreferrer" className="link-explorer">
                    <ExternalLink size={11} />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="card-title">Recent Invoices</span>
            <span style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>{totalInvoices} total</span>
          </div>
          
          <button 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 12 }}
            onClick={handleExportCSV}
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
        
        {invoices.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Anchor</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Discount</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={Number(inv.id)}>
                  <td style={{ fontWeight: 600 }}>#{Number(inv.id)}</td>
                  <td>
                    <a href={getExplorerAddressLink(inv.supplier)} target="_blank" rel="noopener noreferrer" className="link-explorer">
                      {truncateAddress(inv.supplier)}
                    </a>
                  </td>
                  <td>
                    <a href={getExplorerAddressLink(inv.anchor)} target="_blank" rel="noopener noreferrer" className="link-explorer">
                      {truncateAddress(inv.anchor)}
                    </a>
                  </td>
                  <td className="amount-usdc">${formatUSDC(inv.amount)}</td>
                  <td>
                    <span className={`badge badge-${(STATUS_LABELS[Number(inv.status)] || 'submitted').toLowerCase()}`}>
                      {STATUS_LABELS[Number(inv.status)] || 'Unknown'}
                    </span>
                  </td>
                  <td>{Number(inv.discountBps) > 0 ? `${(Number(inv.discountBps) / 100).toFixed(1)}%` : '—'}</td>
                  <td style={{ color: 'var(--ff-text-secondary)' }}>
                    {Number(inv.dueDate) > 0
                      ? new Date(Number(inv.dueDate) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <FileText size={36} />
            <h3>No invoices yet</h3>
            <p>Go to Supplier Portal to submit your first invoice, or Anchor Portal to register your company.</p>
          </div>
        )}
      </div>
    </>
  )
}
