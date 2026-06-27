'use client'

import React, { useState } from 'react'
import { Check, Copy, Play, Loader } from 'lucide-react'

export default function ApiDocsClient() {
  const [activeEndpoint, setActiveEndpoint] = useState<'createInvoice' | 'getBalances'>('createInvoice')
  const [copiedText, setCopiedText] = useState<string | null>(null)
  
  // Playground state
  const [isLoading, setIsLoading] = useState(false)
  const [playgroundResponse, setPlaygroundResponse] = useState<any>(null)
  
  // Param state
  const [paramInvoiceId, setParamInvoiceId] = useState('inv_55219')
  const [paramAmount, setParamAmount] = useState('1500.00')
  const [paramAnchorAddress, setParamAnchorAddress] = useState('0x627d2c382103f6f96be881b7e65df3cf8b005be2')

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const handleExecute = () => {
    setIsLoading(true)
    setPlaygroundResponse(null)
    
    setTimeout(() => {
      if (activeEndpoint === 'createInvoice') {
        setPlaygroundResponse({
          success: true,
          invoiceId: paramInvoiceId,
          amount: parseFloat(paramAmount),
          currency: "USDC",
          anchor: paramAnchorAddress,
          status: "Pending_Approval",
          onchainHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          riskRating: "A+",
          underwritten: false
        })
      } else {
        setPlaygroundResponse({
          success: true,
          walletAddress: "0xc8d9889a6b49e96951309fc0291e652d005be3f9",
          balances: {
            confirmedUSDC: 245000.50,
            pendingUSDC: 12500.00,
            vaultLpTokens: 9800.00,
            accruedYieldUSDC: 412.35
          },
          lastSyncBlock: 1209384
        })
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
          API Reference & Playground
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
          Interact with FactorFi's backend services and smart contract relayer engine. Use our playground on the right to simulate live REST API calls against our sandbox environment.
        </p>
      </div>

      {/* API Hub Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40 }} className="api-grid">
        
        {/* Left Side: Endpoint Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          
          {/* Endpoint selection tabs */}
          <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--ff-border)', paddingBottom: 16 }}>
            <button
              onClick={() => { setActiveEndpoint('createInvoice'); setPlaygroundResponse(null); }}
              style={{
                background: activeEndpoint === 'createInvoice' ? 'rgba(56,189,248,0.1)' : 'transparent',
                color: activeEndpoint === 'createInvoice' ? 'var(--ff-primary)' : 'var(--ff-text-secondary)',
                border: '1px solid',
                borderColor: activeEndpoint === 'createInvoice' ? 'var(--ff-primary)' : 'transparent',
                borderRadius: 'var(--ff-radius-sm)',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--ff-transition)'
              }}
            >
              POST /api/invoices
            </button>
            <button
              onClick={() => { setActiveEndpoint('getBalances'); setPlaygroundResponse(null); }}
              style={{
                background: activeEndpoint === 'getBalances' ? 'rgba(167,139,250,0.1)' : 'transparent',
                color: activeEndpoint === 'getBalances' ? 'var(--ff-violet)' : 'var(--ff-text-secondary)',
                border: '1px solid',
                borderColor: activeEndpoint === 'getBalances' ? 'var(--ff-violet)' : 'transparent',
                borderRadius: 'var(--ff-radius-sm)',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--ff-transition)'
              }}
            >
              GET /api/wallet/balances
            </button>
          </div>

          {activeEndpoint === 'createInvoice' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <span style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--ff-primary)', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, marginRight: 10 }}>POST</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 14, color: '#fff' }}>/api/invoices</span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
                Submit an anchor-approved invoice PDF metadata structure to the database. This calculates initial risk ratings and triggers ECDSA message generation for underwriter verification.
              </p>

              {/* Parameter Table */}
              <h3 style={{ fontSize: 15, color: '#fff', borderBottom: '1px solid var(--ff-border)', paddingBottom: 8 }}>Request Parameters</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: 'var(--ff-text-secondary)', borderBottom: '1px solid var(--ff-border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Param</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Req</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--ff-border-subtle)' }}>
                    <td style={{ fontFamily: 'var(--ff-mono)', padding: '10px 0', color: 'var(--ff-primary)' }}>invoiceId</td>
                    <td style={{ color: 'var(--ff-text-muted)' }}>string</td>
                    <td style={{ color: 'var(--ff-danger)' }}>Yes</td>
                    <td style={{ color: 'var(--ff-text-secondary)' }}>Unique invoice tracking code.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--ff-border-subtle)' }}>
                    <td style={{ fontFamily: 'var(--ff-mono)', padding: '10px 0', color: 'var(--ff-primary)' }}>amount</td>
                    <td style={{ color: 'var(--ff-text-muted)' }}>string</td>
                    <td style={{ color: 'var(--ff-danger)' }}>Yes</td>
                    <td style={{ color: 'var(--ff-text-secondary)' }}>Face value in USDC units (e.g. 1500.00).</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--ff-border-subtle)' }}>
                    <td style={{ fontFamily: 'var(--ff-mono)', padding: '10px 0', color: 'var(--ff-primary)' }}>anchor</td>
                    <td style={{ color: 'var(--ff-text-muted)' }}>string</td>
                    <td style={{ color: 'var(--ff-danger)' }}>Yes</td>
                    <td style={{ color: 'var(--ff-text-secondary)' }}>EVM address of corporate debtor.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <span style={{ background: 'rgba(167,139,250,0.12)', color: 'var(--ff-violet)', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, marginRight: 10 }}>GET</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 14, color: '#fff' }}>/api/wallet/balances</span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--ff-text-secondary)', lineHeight: 1.6 }}>
                Fetch multi-chain ledger cache and live on-chain balances for the authenticated merchant wallet (MSCA). Returns confirmed/pending USDC allocations.
              </p>
              
              <h3 style={{ fontSize: 15, color: '#fff', borderBottom: '1px solid var(--ff-border)', paddingBottom: 8 }}>Query Parameters</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: 'var(--ff-text-secondary)', borderBottom: '1px solid var(--ff-border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Param</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Req</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--ff-border-subtle)' }}>
                    <td style={{ fontFamily: 'var(--ff-mono)', padding: '10px 0', color: 'var(--ff-violet)' }}>address</td>
                    <td style={{ color: 'var(--ff-text-muted)' }}>string</td>
                    <td style={{ color: 'var(--ff-danger)' }}>Yes</td>
                    <td style={{ color: 'var(--ff-text-secondary)' }}>EVM address of merchant MSCA.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Playground Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 24, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--ff-border-highlight)' }}>
            <h3 style={{ fontSize: 16, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Play size={16} style={{ color: 'var(--ff-primary)' }} /> Interactive Playground
            </h3>

            {/* Test input parameters */}
            {activeEndpoint === 'createInvoice' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>invoiceId</label>
                  <input type="text" value={paramInvoiceId} onChange={e => setParamInvoiceId(e.target.value)} style={{ background: '#000', border: '1px solid var(--ff-border)', padding: '8px 12px', borderRadius: 6, color: '#fff', fontSize: 12.5 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>amount (USDC)</label>
                  <input type="text" value={paramAmount} onChange={e => setParamAmount(e.target.value)} style={{ background: '#000', border: '1px solid var(--ff-border)', padding: '8px 12px', borderRadius: 6, color: '#fff', fontSize: 12.5 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>anchor (EVM Address)</label>
                  <input type="text" value={paramAnchorAddress} onChange={e => setParamAnchorAddress(e.target.value)} style={{ background: '#000', border: '1px solid var(--ff-border)', padding: '8px 12px', borderRadius: 6, color: '#fff', fontSize: 12.5 }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>address</label>
                  <input type="text" disabled value="0xc8d9889a6b49e96951309fc0291e652d005be3f9" style={{ background: '#000', border: '1px solid var(--ff-border)', padding: '8px 12px', borderRadius: 6, color: 'var(--ff-text-muted)', fontSize: 12.5 }} />
                </div>
              </div>
            )}

            {/* Actions button */}
            <button
              onClick={handleExecute}
              disabled={isLoading}
              style={{
                width: '100%',
                background: 'var(--ff-primary)',
                border: 'none',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: 'var(--ff-radius-sm)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 20
              }}
            >
              {isLoading ? (
                <>
                  <Loader size={14} className="spin-loader" /> Executing request...
                </>
              ) : (
                <>
                  Send Request
                </>
              )}
            </button>

            {/* Response Output Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Response Output</span>
              <pre style={{
                background: '#000',
                padding: 16,
                borderRadius: 8,
                overflowX: 'auto',
                fontFamily: 'var(--ff-mono)',
                fontSize: 11.5,
                color: playgroundResponse ? 'var(--ff-success)' : 'var(--ff-text-muted)',
                minHeight: 120,
                border: '1px solid var(--ff-border)'
              }}>
                {playgroundResponse ? JSON.stringify(playgroundResponse, null, 2) : "// Click 'Send Request' to view payload"}
              </pre>
            </div>

          </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin-loader {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 992px) {
          .api-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
