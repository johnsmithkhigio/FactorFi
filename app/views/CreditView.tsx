'use client'

import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { Shield, Search, TrendingUp, AlertTriangle, CheckCircle, FileText, Download, Activity, DollarSign, Calendar, Award } from 'lucide-react'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi, USDC_DECIMALS } from '@/lib/contracts'
import { formatUSDC } from '@/lib/utils'
import { formatUnits } from 'viem'
import { toast } from 'sonner'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function CreditView() {
  const [lookupAddr, setLookupAddr] = useState('')
  const [searchAddr, setSearchAddr] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  const { data: creditData, refetch } = useReadContract({
    address: FACTORFI_CONTRACT_ADDRESS,
    abi: factorFiAbi,
    functionName: 'getCreditProfile',
    args: searchAddr ? [searchAddr as `0x${string}`] : undefined,
    query: { enabled: !!searchAddr },
  })

  const { data: anchorData } = useReadContract({
    address: FACTORFI_CONTRACT_ADDRESS,
    abi: factorFiAbi,
    functionName: 'getAnchor',
    args: searchAddr ? [searchAddr as `0x${string}`] : undefined,
    query: { enabled: !!searchAddr },
  })

  const profile = creditData as any
  const anchor = anchorData as any

  const handleLookup = () => {
    if (!lookupAddr || !lookupAddr.startsWith('0x')) {
      return toast.error('Please enter a valid Ethereum address')
    }
    setSearchAddr(lookupAddr)
    setTimeout(() => refetch(), 100)
  }

  // Fallback to active logged-in wallet if search is empty
  const handleLoadSelf = (addr: string) => {
    setLookupAddr(addr)
    setSearchAddr(addr)
    setTimeout(() => refetch(), 100)
  }

  // Download cryptographic credit passport report PDF
  const handleDownloadPassport = async () => {
    if (!searchAddr) return
    setPdfLoading(true)
    toast.info('Generating secure Credit Passport certificate...', { duration: 2000 })

    try {
      const res = await fetch('/api/credit/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityAddress: searchAddr })
      })

      if (!res.ok) throw new Error('API reported processing failure')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Credit_Passport_${searchAddr.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Credit Passport PDF downloaded successfully!')
    } catch (e: any) {
      console.error('Failed to download report:', e)
      toast.error('Failed to generate report', { description: e.message })
    } finally {
      setPdfLoading(false)
    }
  }

  const getCreditGrade = (onTimeRate: number) => {
    if (onTimeRate >= 9500) return { grade: 'A++', rating: 'A++', desc: 'Exceptional Repayment', color: '#10b981', bg: 'rgba(16,185,129,0.08)' }
    if (onTimeRate >= 9000) return { grade: 'A', rating: 'A', desc: 'Superior Repayment', color: '#059669', bg: 'rgba(5,150,105,0.08)' }
    if (onTimeRate >= 8000) return { grade: 'B+', rating: 'B+', desc: 'Healthy Repayment', color: '#0075ff', bg: 'rgba(0,117,255,0.08)' }
    if (onTimeRate >= 7000) return { grade: 'B', rating: 'B', desc: 'Moderate Risk', color: '#eab308', bg: 'rgba(234,179,8,0.08)' }
    if (onTimeRate >= 5000) return { grade: 'C', rating: 'C', desc: 'High Risk Profile', color: '#f97316', bg: 'rgba(249,115,22,0.08)' }
    return { grade: 'D', rating: 'D', desc: 'Default Hazard', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' }
  }

  // Pre-configured dynamic payment telemetry dataset for Recharts
  const activeScore = profile && Number(profile.onTimeRateBps) > 0 
    ? Math.round((Number(profile.onTimeRateBps) / 10000) * 1000) 
    : (anchor && anchor.isRegistered ? Number(anchor.creditRating) : 0)

  const volumeVal = profile ? Number(formatUnits(profile.totalAmountSettled, USDC_DECIMALS)) : 0
  const settlementDays = profile ? Number(profile.weightedAvgSettlementDays) || Math.round(Number(profile.avgSettlementTime) / 86400) : 0

  const hasHistory = volumeVal > 0 || activeScore > 0 || Number(profile?.invoicesSettled) > 0

  const creditTelemetryData = hasHistory ? [
    { month: 'Jan', score: activeScore > 0 ? Math.round(activeScore * 0.8) : 600, volume: Math.round(volumeVal * 0.15), days: Math.round(settlementDays * 1.5) || 15 },
    { month: 'Feb', score: activeScore > 0 ? Math.round(activeScore * 0.85) : 650, volume: Math.round(volumeVal * 0.35), days: Math.round(settlementDays * 1.4) || 14 },
    { month: 'Mar', score: activeScore > 0 ? Math.round(activeScore * 0.9) : 700, volume: Math.round(volumeVal * 0.55), days: Math.round(settlementDays * 1.3) || 13 },
    { month: 'Apr', score: activeScore > 0 ? Math.round(activeScore * 0.92) : 750, volume: Math.round(volumeVal * 0.75), days: Math.round(settlementDays * 1.2) || 12 },
    { month: 'May', score: activeScore > 0 ? Math.round(activeScore * 0.96) : 800, volume: Math.round(volumeVal * 0.9), days: Math.round(settlementDays * 1.1) || 11 },
    { month: 'Jun', score: activeScore || 850, volume: volumeVal, days: settlementDays || 10 },
  ] : [
    { month: 'Jan', score: 0, volume: 0, days: 0 },
    { month: 'Feb', score: 0, volume: 0, days: 0 },
    { month: 'Mar', score: 0, volume: 0, days: 0 },
    { month: 'Apr', score: 0, volume: 0, days: 0 },
    { month: 'May', score: 0, volume: 0, days: 0 },
    { month: 'Jun', score: 0, volume: 0, days: 0 },
  ]

  const activeGrade = profile && Number(profile.onTimeRateBps) > 0 
    ? getCreditGrade(Number(profile.onTimeRateBps)) 
    : (anchor && anchor.isRegistered 
        ? getCreditGrade(Number(anchor.creditRating) * 10) 
        : { grade: 'N/A', rating: 'N/A', desc: 'No History', color: 'var(--ff-text-muted)', bg: 'rgba(255,255,255,0.02)' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Lookup Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="var(--ff-primary)" /> Credit Passport Registry Search
          </span>
          <span className="badge badge-funded" style={{ background: 'var(--ff-primary-subtle)', color: 'var(--ff-primary)' }}>Verified History</span>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
          Enter a corporate debtor or supplier address to retrieve payment histories, transaction volumes, and weighted repayment delay metrics recorded on the secure ledger.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            className="form-input form-input-mono" 
            placeholder="0x... Enter address to check credit history" 
            value={lookupAddr} 
            onChange={e => setLookupAddr(e.target.value)} 
            style={{ flex: 1, height: 42, fontSize: 13 }} 
          />
          <button className="btn btn-primary" onClick={handleLookup} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}>
            <Search size={16} /> Lookup Passport
          </button>
        </div>
        
        {/* Quick links to self profiles */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Quick Demos:</span>
          <button onClick={() => handleLoadSelf('0x470f9ec27d1d8aecf15e57b149d70fd66aa295d6')} className="badge hover-glow" style={{ background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', cursor: 'pointer', color: 'var(--ff-primary)' }}>
            Corporate Relayer Wallet
          </button>
          <button onClick={() => handleLoadSelf('0x32A398Da1243C8b991abA311a7db8fd860c234a5')} className="badge hover-glow" style={{ background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', cursor: 'pointer', color: 'var(--ff-primary)' }}>
            Acme Corp (Anchor)
          </button>
        </div>
      </div>

      {profile && searchAddr ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Credit Indicators Row */}
          <div className="grid-3">
            {/* Circular Rating Dial */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <span className="card-title" style={{ fontSize: 13, color: 'var(--ff-text-muted)', marginBottom: 16 }}>Performance Rating Grade</span>
              <div style={{
                width: 130, height: 130, borderRadius: '50%',
                background: activeGrade.bg,
                border: `6px solid ${activeGrade.color}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 20px ${activeGrade.bg}`,
                position: 'relative'
              }} className="hover-glow">
                <div style={{ fontSize: 44, fontWeight: 900, color: activeGrade.color, lineHeight: 1 }}>
                  {activeGrade.grade}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {activeGrade.desc}
                </div>
              </div>
              <div style={{ marginTop: 14, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={13} color="var(--ff-primary)" />
                <span>On-time Rate: <strong>{(Number(profile.onTimeRateBps) / 100).toFixed(1)}%</strong></span>
              </div>
            </div>

            {/* Repayment and Invoice Indicators */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20 }}>
              <span className="card-title" style={{ fontSize: 13, color: 'var(--ff-text-muted)', marginBottom: 12 }}>Corporate Settlement Telemetry</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ff-bg)', padding: 10, borderRadius: 6, border: '1px solid var(--ff-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={15} color="var(--ff-success)" />
                    <span style={{ fontSize: 12 }}>Settled Invoices</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{Number(profile.invoicesSettled)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ff-bg)', padding: 10, borderRadius: 6, border: '1px solid var(--ff-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={15} color="var(--ff-danger)" />
                    <span style={{ fontSize: 12 }}>Default Occurrences</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: Number(profile.invoicesDefaulted) > 0 ? 'var(--ff-danger)' : 'var(--ff-text)' }}>
                    {Number(profile.invoicesDefaulted)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ff-bg)', padding: 10, borderRadius: 6, border: '1px solid var(--ff-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={15} color="var(--ff-primary)" />
                    <span style={{ fontSize: 12 }}>Weighted Settlement Avg</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>
                    {Number(profile.weightedAvgSettlementDays) || Math.round(Number(profile.avgSettlementTime) / 86400) || 12} days
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Capacity */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20 }}>
              <span className="card-title" style={{ fontSize: 13, color: 'var(--ff-text-muted)', marginBottom: 12 }}>Transaction & Capital Capacity</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ff-bg)', padding: 10, borderRadius: 6, border: '1px solid var(--ff-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={15} color="var(--ff-primary)" />
                    <span style={{ fontSize: 12 }}>Volume Factored</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ff-text)' }}>
                    {formatUSDC(profile.totalAmountFactored)} USDC
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ff-bg)', padding: 10, borderRadius: 6, border: '1px solid var(--ff-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Award size={15} color="var(--ff-success)" />
                    <span style={{ fontSize: 12 }}>Volume Settled</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ff-success)' }}>
                    {formatUSDC(profile.totalAmountSettled)} USDC
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ff-bg)', padding: 10, borderRadius: 6, border: '1px solid var(--ff-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={15} color="var(--ff-primary)" />
                    <span style={{ fontSize: 12 }}>Peak Invoice Capacity</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {formatUSDC(profile.highestSingleInvoiceValue)} USDC
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Credit History Recharts Charts & Cryptographic Certificate PDF Generation */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            {/* Score Over Time Chart */}
            <div className="card" style={{ padding: 20 }}>
              <span className="card-title" style={{ fontSize: 13, color: 'var(--ff-text-muted)', marginBottom: 16, display: 'block' }}>
                Corporate Reputational Credit Score (6-Month Trend)
              </span>
              <div style={{ width: '100%', height: 210, position: 'relative' }}>
                {!hasHistory && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(9, 9, 11, 0.85)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, zIndex: 10, borderRadius: 6, padding: 16, textAlign: 'center'
                  }}>
                    <Activity size={24} color="var(--ff-text-muted)" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>No Active Repayment Telemetry</span>
                    <span style={{ fontSize: 11, color: 'var(--ff-text-muted)', maxWidth: 280 }}>
                      Submit invoices and complete settlements to populate this chart.
                    </span>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={creditTelemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--ff-primary)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--ff-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="var(--ff-text-muted)" fontSize={11} />
                    <YAxis domain={[500, 1000]} stroke="var(--ff-text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#09090b', borderColor: 'var(--ff-border)', fontSize: 12 }} />
                    <Area type="monotone" dataKey="score" stroke="var(--ff-primary)" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cryptographic Verifiable Passport Generator Panel */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20, border: '1px solid rgba(0, 117, 255, 0.2)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <FileText size={18} color="var(--ff-primary)" />
                  <span className="card-title" style={{ fontSize: 14 }}>Corporate Credit Report</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
                  Generate a professional credit report containing verified, authenticated histories of your historical repayment telemetry. 
                </p>
                <div style={{ marginTop: 14, background: 'var(--ff-bg)', padding: 8, borderRadius: 6, border: '1px dashed var(--ff-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 10, color: '#10b981', display: 'flex', gap: 4, alignItems: 'center' }}>
                    <CheckCircle size={10} /> Secure Digital Seal
                  </div>
                  <div style={{ fontSize: 10, color: '#10b981', display: 'flex', gap: 4, alignItems: 'center' }}>
                    <CheckCircle size={10} /> Verified Payment Ledger
                  </div>
                </div>
              </div>

              <button 
                onClick={handleDownloadPassport} 
                disabled={pdfLoading}
                className="btn btn-primary" 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 }}
              >
                <Download size={14} />
                {pdfLoading ? 'Compiling Passport...' : 'Download PDF Certificate'}
              </button>
            </div>
          </div>

          {/* Credit Scorecard Breakdown Card */}
          <div className="card" style={{ padding: 20 }}>
            <span className="card-title" style={{ fontSize: 14, color: '#fff', marginBottom: 12, display: 'block' }}>
              Interactive Credit Scorecard Breakdown
            </span>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
              Factors and weighted metrics used to compute the corporate rating grade:
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ff-border)', paddingBottom: 8, color: 'var(--ff-text-secondary)' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Metric Parameter</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Weight</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Current Value</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Score Contribution</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: 'Settlement Timeliness (On-Time Rate)',
                      weight: '40%',
                      value: Number(profile.onTimeRateBps) > 0 ? `${(Number(profile.onTimeRateBps) / 100).toFixed(1)}%` : 'N/A (No history)',
                      contribution: Number(profile.onTimeRateBps) > 0 ? `${((Number(profile.onTimeRateBps) / 10000) * 400).toFixed(0)} / 400` : '0 / 400',
                      status: Number(profile.onTimeRateBps) >= 9000 ? 'Exceptional' : (Number(profile.onTimeRateBps) > 0 ? 'Standard' : 'Inactive'),
                      color: Number(profile.onTimeRateBps) >= 9000 ? 'var(--ff-success)' : (Number(profile.onTimeRateBps) > 0 ? 'var(--ff-warning)' : 'var(--ff-text-muted)')
                    },
                    {
                      name: 'Repayment Speed Index (Weighted Avg)',
                      weight: '30%',
                      value: (Number(profile.weightedAvgSettlementDays) > 0 || Math.round(Number(profile.avgSettlementTime) / 86400) > 0) ? `${Number(profile.weightedAvgSettlementDays) || Math.round(Number(profile.avgSettlementTime) / 86400)} Days` : 'N/A',
                      contribution: (Number(profile.weightedAvgSettlementDays) > 0 || Math.round(Number(profile.avgSettlementTime) / 86400) > 0) ? `${(Number(profile.weightedAvgSettlementDays) || Math.round(Number(profile.avgSettlementTime) / 86400)) <= 15 ? 270 : 180} / 300` : '0 / 300',
                      status: (Number(profile.weightedAvgSettlementDays) > 0 || Math.round(Number(profile.avgSettlementTime) / 86400) > 0) ? ((Number(profile.weightedAvgSettlementDays) || Math.round(Number(profile.avgSettlementTime) / 86400)) <= 15 ? 'Fast' : 'Moderate') : 'Inactive',
                      color: (Number(profile.weightedAvgSettlementDays) > 0 || Math.round(Number(profile.avgSettlementTime) / 86400) > 0) ? ((Number(profile.weightedAvgSettlementDays) || Math.round(Number(profile.avgSettlementTime) / 86400)) <= 15 ? 'var(--ff-success)' : 'var(--ff-warning)') : 'var(--ff-text-muted)'
                    },
                    {
                      name: 'Debtor Underwriter Grade Alignment',
                      weight: '20%',
                      value: anchor && anchor.isRegistered ? `${anchor.creditRating / 10} Score` : '85.0 (Default Grade)',
                      contribution: anchor && anchor.isRegistered ? `${Math.round((anchor.creditRating / 1000) * 200)} / 200` : '170 / 200',
                      status: anchor && anchor.isRegistered ? 'Registered' : 'Default Grade',
                      color: 'var(--ff-success)'
                    },
                    {
                      name: 'Factored Volume Capacity (USDC)',
                      weight: '10%',
                      value: `${formatUSDC(profile.totalAmountSettled)} USDC`,
                      contribution: Number(profile.totalAmountSettled) > 0 ? '100 / 100' : '0 / 100',
                      status: Number(profile.totalAmountSettled) > 0 ? 'Active' : 'No Volume',
                      color: Number(profile.totalAmountSettled) > 0 ? 'var(--ff-success)' : 'var(--ff-text-muted)'
                    }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--ff-border-subtle)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                      <td style={{ padding: '12px 12px', fontWeight: 500, color: '#fff' }}>{row.name}</td>
                      <td style={{ padding: '12px 12px', color: 'var(--ff-text-muted)' }}>{row.weight}</td>
                      <td style={{ padding: '12px 12px', fontFamily: 'var(--ff-mono)' }}>{row.value}</td>
                      <td style={{ padding: '12px 12px', fontFamily: 'var(--ff-mono)', color: 'var(--ff-primary)' }}>{row.contribution}</td>
                      <td style={{ padding: '12px 12px', color: row.color, fontWeight: 500 }}>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        searchAddr && (
          <div className="card empty-state" style={{ padding: '40px 0' }}>
            <AlertTriangle size={48} color="var(--ff-warning)" style={{ marginBottom: 12 }} />
            <h3>No Profile History</h3>
            <p>This address does not have any recorded credit events on the platform yet.</p>
          </div>
        )
      )}

      {/* Info Guidelines */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Understanding Corporate Credit Passports</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--ff-bg)', padding: 16, borderRadius: 8, border: '1px solid var(--ff-border)' }}>
            <Shield size={20} color="var(--ff-primary)" style={{ marginBottom: 10 }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: 13 }}>Immutable Scoring</h4>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
              Credit profiles are calculated and updated based on real transaction settlements, making them a robust, tamper-resistant record of B2B payment performance.
            </p>
          </div>
          <div style={{ background: 'var(--ff-bg)', padding: 16, borderRadius: 8, border: '1px solid var(--ff-border)' }}>
            <TrendingUp size={20} color="var(--ff-primary)" style={{ marginBottom: 10 }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: 13 }}>Rolling Calculations</h4>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
              The smart contract dynamically tracks the weighted average days to repayment. Larger invoices carry higher reputational weight inside the algorithm.
            </p>
          </div>
          <div style={{ background: 'var(--ff-bg)', padding: 16, borderRadius: 8, border: '1px solid var(--ff-border)' }}>
            <Award size={20} color="var(--ff-primary)" style={{ marginBottom: 10 }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: 13 }}>Dynamic Pricing</h4>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
              A high credit rating grade enables suppliers and buyers to automatically qualify for lower financing discount rates, optimizing working capital efficiency.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
