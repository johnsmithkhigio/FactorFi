'use client'

import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { Shield, Search, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi } from '@/lib/contracts'

export default function CreditView() {
  const [lookupAddr, setLookupAddr] = useState('')
  const [searchAddr, setSearchAddr] = useState('')

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
    setSearchAddr(lookupAddr)
    setTimeout(() => refetch(), 100)
  }

  const getCreditGrade = (onTimeRate: number) => {
    if (onTimeRate >= 9500) return { grade: 'A+', color: 'var(--ff-success)' }
    if (onTimeRate >= 9000) return { grade: 'A', color: 'var(--ff-success)' }
    if (onTimeRate >= 8000) return { grade: 'B+', color: 'var(--ff-primary)' }
    if (onTimeRate >= 7000) return { grade: 'B', color: 'var(--ff-warning)' }
    if (onTimeRate >= 5000) return { grade: 'C', color: 'var(--ff-warning)' }
    return { grade: 'D', color: 'var(--ff-danger)' }
  }

  return (
    <>
      {/* Lookup */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">On-Chain Credit Passport Lookup</span>
          <span className="badge badge-funded">Verifiable</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input form-input-mono" placeholder="0x... Enter address to check credit history" value={lookupAddr} onChange={e => setLookupAddr(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={handleLookup}><Search size={16} /> Lookup</button>
        </div>
      </div>

      {profile && searchAddr && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Credit Score Card */}
          <div className="card">
            <div className="card-header"><span className="card-title">Credit Score</span></div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                border: `4px solid ${getCreditGrade(Number(profile.onTimeRateBps)).color}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
              }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: getCreditGrade(Number(profile.onTimeRateBps)).color }}>
                  {getCreditGrade(Number(profile.onTimeRateBps)).grade}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>
                  {(Number(profile.onTimeRateBps) / 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ff-text-secondary)' }}>On-Time Payment Rate</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <div style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{Number(profile.invoicesSettled)}</div>
                <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Settled</div>
              </div>
              <div style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: Number(profile.invoicesDefaulted) > 0 ? 'var(--ff-danger)' : 'var(--ff-text)' }}>
                  {Number(profile.invoicesDefaulted)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Defaulted</div>
              </div>
            </div>
          </div>

          {/* Anchor Info */}
          <div className="card">
            <div className="card-header"><span className="card-title">Entity Details</span></div>
            {anchor && anchor.isRegistered ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 14, background: 'var(--ff-bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Company</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{anchor.name}</div>
                </div>
                <div style={{ padding: 14, background: 'var(--ff-bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Credit Rating</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{Number(anchor.creditRating)} / 1000</div>
                </div>
                <div style={{ padding: 14, background: 'var(--ff-bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Type</div>
                  <span className="badge badge-approved">Registered Anchor</span>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <AlertTriangle size={40} />
                <h3>Not a Registered Anchor</h3>
                <p>This address has not registered as an anchor company.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info about credit passport */}
      <div className="card">
        <div className="card-header"><span className="card-title">What is the Credit Passport?</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { icon: <Shield size={20} />, title: 'On-Chain Verifiable', desc: 'Credit history stored as smart contract state — immutable and publicly auditable on Arc.' },
            { icon: <TrendingUp size={20} />, title: 'Dynamic Scoring', desc: 'Credit grade updates automatically with each invoice settlement or default event.' },
            { icon: <CheckCircle size={20} />, title: 'Composable', desc: 'Any DeFi protocol or lending market can query creditworthiness from this on-chain data.' },
          ].map(item => (
            <div key={item.title} style={{ padding: 16, background: 'var(--ff-bg)', borderRadius: 8 }}>
              <div style={{ color: 'var(--ff-primary)', marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ff-text-secondary)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
