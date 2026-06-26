'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useReadContract, useAccount } from 'wagmi'
import { ShieldAlert, ShieldCheck, RefreshCw, Cpu, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi } from '@/lib/contracts'

interface ComplianceModalProps {
  onVerificationComplete: () => void
}

export default function ComplianceModal({ onVerificationComplete }: ComplianceModalProps) {
  const { address, isConnected } = useAccount()
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1: Welcome/Ready, 2: Fetching Signatures/KYC, 3: Submit to Chain
  const [loading, setLoading] = useState(false)
  const [complianceResult, setComplianceResult] = useState<{
    compliant: boolean
    timestamp: string
    signature: string
  } | null>(null)

  // Query blockchain compliance state
  const { data: isCompliantOnChain, refetch: refetchOnChainCompliance } = useReadContract({
    address: FACTORFI_CONTRACT_ADDRESS,
    abi: factorFiAbi,
    functionName: 'isCompliant',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { writeContract: writeCompliance, isPending: txPending } = useWriteContract()

  // Auto-dismiss or notify when already compliant
  useEffect(() => {
    if (isCompliantOnChain) {
      onVerificationComplete()
    }
  }, [isCompliantOnChain, onVerificationComplete])

  const startScreening = async () => {
    if (!address) return
    setLoading(true)
    setStep(2)
    
    try {
      // Fetch status and cryptographic signature from Circle Compliance API adapter
      const res = await fetch(`/api/compliance/status?address=${address}`)
      if (!res.ok) throw new Error('Compliance endpoint failed')
      
      const data = await res.json()
      setComplianceResult(data)

      if (data.compliant) {
        toast.success('Verification successful! Save to your profile.')
        setStep(3)
      } else {
        toast.error('Verification failed. Please contact support or try a different payment account.', { duration: 8000 })
        setStep(1)
      }
    } catch (err: any) {
      toast.error('Verification system temporarily unavailable. Please try again shortly.', { description: err.message })
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const registerOnChain = () => {
    if (!complianceResult || !address) return

    writeCompliance({
      address: FACTORFI_CONTRACT_ADDRESS,
      abi: factorFiAbi,
      functionName: 'updateComplianceStatusWithSignature',
      args: [
        address as `0x${string}`,
        complianceResult.compliant,
        BigInt(complianceResult.timestamp),
        complianceResult.signature as `0x${string}`
      ]
    }, {
      onSuccess: () => {
        toast.success('Verification status registered successfully!')
        refetchOnChainCompliance()
      },
      onError: (e) => {
        toast.error('Profile registration failed', { description: e.message.slice(0, 80) })
      }
    })
  }

  if (!isConnected || isCompliantOnChain) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: 16
    }}>
      <div className="card" style={{ maxWidth: 460, width: '100%', border: '1px solid var(--ff-primary)', boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 54, height: 54, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <ShieldAlert size={28} style={{ color: 'var(--ff-primary)' }} />
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700 }}>Compliance Verification</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ff-text-muted)' }}>
            Compliance verification is required to access invoice financing and investment pools.
          </p>
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)', fontSize: 12, lineHeight: 1.5 }}>
              🔒 <strong>Verification Screening</strong> checks your account address against international sanctions lists to ensure secure transactions.
            </div>
            
            <button className="btn btn-primary" onClick={startScreening} disabled={loading} style={{ width: '100%', gap: 8 }}>
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Cpu size={16} />}
              Verify Identity & Address
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--ff-primary)' }} />
            <div style={{ fontSize: 13, fontWeight: 500 }}>Verifying credentials via compliance registries...</div>
            <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', fontFamily: 'var(--ff-mono)' }}>{address}</div>
          </div>
        )}

        {step === 3 && complianceResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(74, 222, 128, 0.08)', border: '1px solid var(--ff-success)', borderRadius: 8 }}>
              <ShieldCheck size={20} style={{ color: 'var(--ff-success)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ff-success)' }}>Verification Passed!</div>
                <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Security verification reference generated successfully.</div>
              </div>
            </div>

            <div style={{ padding: 10, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)', fontSize: 11, fontFamily: 'var(--ff-mono)', overflowX: 'auto', maxHeight: 80 }}>
              <span style={{ color: 'var(--ff-text-muted)' }}>Reference: </span>
              {complianceResult.signature}
            </div>

            <button className="btn btn-primary" onClick={registerOnChain} disabled={txPending} style={{ width: '100%', gap: 8 }}>
              {txPending ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Register Compliance Profile
            </button>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--ff-border)', marginTop: 20, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ff-text-muted)' }}>
          <span>Verified via Compliance Registry</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Payment Infrastructure <ExternalLink size={10} />
          </span>
        </div>
      </div>
    </div>
  )
}
