'use client'

import React, { useState } from 'react'
import MarketingHeader from '../components/MarketingHeader'
import MarketingFooter from '../components/MarketingFooter'
import { useModal, mapErrorToFriendlyMessage } from '../components/ModalProvider'
import { CheckCircle2, Cpu, Terminal } from 'lucide-react'

export default function TestModalsClient() {
  const { showModal, hideModal, updateModal } = useModal()
  const [simulationActive, setSimulationActive] = useState(false)

  // 1. Confirm Modal
  const triggerConfirm = () => {
    showModal({
      type: 'confirm',
      title: 'Deploy Smart Contract Invoice?',
      message: 'Are you sure you want to register and serialize Invoice #INV-2026-904 on the Arc chain? This action requires signing with your smart wallet.',
      confirmText: 'Sign & Deploy',
      cancelText: 'Go Back',
      showCloseButton: true,
      onConfirm: async () => {
        // Simulates async operation
        await new Promise((resolve) => setTimeout(resolve, 1500))
        showModal({
          type: 'success',
          title: 'Invoice Registered Successfully',
          message: 'Invoice #INV-2026-904 has been committed to the FactorFi ledger at Block #8,940,201.',
          autoCloseMs: 3000
        })
      }
    })
  }

  // 2. Loading Modal
  const triggerLoading = () => {
    showModal({
      type: 'loading',
      title: 'Parsing Invoice Attachment',
      message: 'Processing document via our AI OCR Underwriter. Please hold while we extract transaction attributes...',
      loadingText: 'Reading metadata (45% completed)...',
    })

    // Simulate update during processing
    setTimeout(() => {
      updateModal({ loadingText: 'Running OFAC Sanctions Screen (85% completed)...' })
    }, 2000)

    // Complete processing
    setTimeout(() => {
      showModal({
        type: 'success',
        title: 'Document Decoded',
        message: 'Underwriter has successfully decoded Invoice value of 50,000 USDC from debtor Anchor Corp.',
        autoCloseMs: 3000
      })
    }, 4000)
  }

  // 3. Success Modal
  const triggerSuccess = () => {
    showModal({
      type: 'success',
      title: 'Settlement Completed',
      message: '50,000 USDC principal has been disbursed to the supplier. Debt liability has been transferred to Anchor Corp.',
      showCloseButton: true,
    })
  }

  // 4. Warning Modal
  const triggerWarning = () => {
    showModal({
      type: 'warning',
      title: 'Exceeding Credit Allocation Limit',
      message: 'Funding this invoice will exceed the Anchor Corporate limit of 500,000 USDC by 15,000 USDC. Continuing may impact liquidity risk scoring.',
      confirmText: 'Proceed Anyway',
      cancelText: 'Review Limits',
      onConfirm: () => {
        showModal({
          type: 'success',
          title: 'Invoice Underwritten',
          message: 'Invoice has been added to the pool despite allocation warnings.',
        })
      }
    })
  }

  // 5. Blockchain status simulation
  const triggerBlockchainSimulation = () => {
    setSimulationActive(true)
    showModal({
      type: 'blockchain',
      title: 'Submitting Claim to Arc network',
      message: 'Broadcasting transaction payload to the mempool. Please sign inside your wallet.',
      blockchainStatus: 'pending',
    })

    // Simulate confirmed in mempool
    setTimeout(() => {
      updateModal({
        title: 'Confirming Invoices Block',
        message: 'Transaction successfully included. Waiting for sub-second block finality and attestation...',
        blockchainStatus: 'confirming',
        txHash: '0x9d4a83ff201be9c3f9b2d398f5b8c9d0a1b2c3d4e5f67890abcdef1234567890'
      })
    }, 2000)

    // Complete success state
    setTimeout(() => {
      updateModal({
        title: 'On-Chain Attestation Succeeded',
        message: 'The transaction has reached full L1 finality on Arc Testnet.',
        blockchainStatus: 'success'
      })
      setSimulationActive(false)
    }, 4500)
  }

  // 6. User Rejection mapping
  const triggerRejection = () => {
    const error = new Error('User rejected the transaction signature.')
    const mapped = mapErrorToFriendlyMessage(error)
    showModal({
      type: 'error',
      title: mapped.title,
      message: mapped.message,
    })
  }

  // 7. Insufficient Funds mapping
  const triggerInsufficientFunds = () => {
    const error = new Error('RPC Error: execution reverted. Insufficient funds for gas * price + value.')
    const mapped = mapErrorToFriendlyMessage(error)
    showModal({
      type: 'error',
      title: mapped.title,
      message: mapped.message,
      retryAction: () => triggerConfirm()
    })
  }

  return (
    <div className="app-shell" style={{ background: 'var(--ff-bg)', color: 'var(--ff-text)' }}>
      <MarketingHeader />

      <main style={{ maxWidth: 1000, margin: '60px auto', width: '100%', padding: '0 24px', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Unified Modal Playground</h2>
          <p style={{ color: 'var(--ff-text-secondary)', fontSize: 14.5, marginTop: 8 }}>
            Interactive testing suite for transaction flows, warnings, loading sequences, and error handlers.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }} className="test-grid">
          
          {/* Left panel: Trigger buttons */}
          <section className="card" style={{ background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Interact with Modal Types</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--ff-border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>1. Confirm Action</div>
                  <div style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Confirmations with async loading states</div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={triggerConfirm}>
                  Test Confirm
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--ff-border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>2. Processing Sequence</div>
                  <div style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Animated spinner with step updates</div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={triggerLoading}>
                  Test Loading
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--ff-border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>3. Success Modal</div>
                  <div style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Action completed visual feedback</div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={triggerSuccess}>
                  Test Success
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--ff-border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>4. Warning / Risk Action</div>
                  <div style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Risk confirmation prompts</div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={triggerWarning}>
                  Test Warning
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--ff-border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>5. Blockchain Transaction Lifecycle</div>
                  <div style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Simulates: Pending → Confirming → Success</div>
                </div>
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12.5, background: 'var(--ff-primary)' }} onClick={triggerBlockchainSimulation} disabled={simulationActive}>
                  Run Simulation
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--ff-border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>6. Error: Wallet Rejection</div>
                  <div style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Auto-mapped cancellation message</div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={triggerRejection}>
                  Test Rejection
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>7. Error: Insufficient Gas/USDC</div>
                  <div style={{ fontSize: 12, color: 'var(--ff-text-muted)' }}>Low balance warning with Retry button</div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={triggerInsufficientFunds}>
                  Test Insufficient
                </button>
              </div>

            </div>
          </section>

          {/* Right panel: Code implementation guidelines */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div className="card" style={{ background: '#070c17', border: '1px solid var(--ff-border)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Terminal size={16} color="var(--ff-primary)" />
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Developer Hook Usage</span>
              </div>
              <pre style={{ color: '#88e0ff', fontSize: 12, overflowX: 'auto', background: '#000', padding: 14, borderRadius: 6, fontFamily: 'var(--ff-mono)' }}>
{`import { useModal } from '@/app/components/ModalProvider'

const MyComponent = () => {
  const { showModal } = useModal()

  const handleAction = () => {
    showModal({
      type: 'confirm',
      title: 'Execute Repayment',
      message: 'Are you sure you want to return 5,000 USDC?',
      onConfirm: async () => {
        await executeTransaction()
      }
    })
  }
}`}
              </pre>
            </div>

            <div className="card" style={{ background: 'var(--ff-surface)', border: '1px solid var(--ff-border)', padding: 20 }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={16} color="var(--ff-violet)" />
                <span>Modal State Best Practices</span>
              </div>
              <ul style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', paddingLeft: 16, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li><strong>Queue Safeguards</strong>: Successive <code>showModal</code> invocations are buffered inside a FIFO Queue array, preventing UI clipping.</li>
                <li><strong>Dynamic Transitions</strong>: Keep modal open by updating options via <code>{"updateModal({ title, blockchainStatus })"}</code> for multi-step sequences.</li>
                <li><strong>Accessibility (A11y)</strong>: Esc key closes confirm/warning modals; backdrop-click acts as cancel action.</li>
                <li><strong>Robots Blocking</strong>: This testing viewport blocks crawlers indexing under <code>noindex, nofollow</code> configuration rules.</li>
              </ul>
            </div>

          </aside>

        </div>
      </main>

      <MarketingFooter />

      <style jsx global>{`
        @media (max-width: 768px) {
          .test-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
