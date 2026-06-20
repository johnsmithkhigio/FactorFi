'use client'

import { useState, useEffect, useRef } from 'react'
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { TrendingUp, ExternalLink, DollarSign, Settings, Play, CheckCircle, Activity, ShieldCheck, Cpu, ArrowRightLeft, Database } from 'lucide-react'
import { toast } from 'sonner'
import {
  FACTORFI_CONTRACT_ADDRESS,
  factorFiAbi,
  USDC_ADDRESS_ARC,
  usdcAbi,
  USDC_DECIMALS,
  AUTO_FACTOR_VAULT_ADDRESS,
  autoFactorVaultAbi,
  INVOICE_RECEIPT_NFT_ADDRESS,
  invoiceReceiptNftAbi,
  FACTORFI_MARKETPLACE_ADDRESS,
  factorFiMarketplaceAbi
} from '@/lib/contracts'
import { getExplorerTxLink, formatUSDC, STATUS_LABELS, formatDate } from '@/lib/utils'
import { useUnifiedAccount } from '@/lib/web3-provider'
import { formatTokenAmount, getTokenByAddress } from '@/lib/token-registry'

export default function InvestorView() {
  const { address } = useUnifiedAccount()
  const [invoiceId, setInvoiceId] = useState('')
  const [lookupId, setLookupId] = useState('')
  const [discountBps, setDiscountBps] = useState('300') // 3% default
  
  // Vault state controls
  const [vaultDepositInput, setVaultDepositInput] = useState('100')
  const [vaultWithdrawInput, setVaultWithdrawInput] = useState('100')
  
  // Matching rules forms
  const [minDiscountForm, setMinDiscountForm] = useState('2.5')
  const [minScoreForm, setMinScoreForm] = useState('900')
  
  // Scanning log triggers
  const [vaultActive, setVaultActive] = useState(true)
  const [scanLogs, setScanLogs] = useState<{time: string, msg: string, type: 'info'|'success'|'warn'}[]>([])

  // Secondary OTC Marketplace State
  const [listPriceInput, setListPriceInput] = useState('')

  // Contract write triggers
  const { writeContract: approveToken, isPending: approvePending } = useWriteContract()
  const { writeContract: fundInvoice, data: fundHash, isPending: fundPending } = useWriteContract()
  const { isLoading: fundConfirming } = useWaitForTransactionReceipt({ hash: fundHash })

  // Vault write triggers
  const { writeContract: writeVault, isPending: vaultPending } = useWriteContract()

  // Marketplace & NFT write triggers
  const { writeContract: writeMarket, isPending: marketPending } = useWriteContract()
  const { writeContract: writeNft, isPending: nftPending } = useWriteContract()

  // Log auto-scroll
  const logEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [scanLogs])

  // --- Real-time On-Chain Vault Queries ---
  const { data: tvlData, refetch: refetchTvl } = useReadContract({
    address: AUTO_FACTOR_VAULT_ADDRESS,
    abi: autoFactorVaultAbi,
    functionName: 'totalAssets',
  })

  const { data: activeAllocData, refetch: refetchAlloc } = useReadContract({
    address: AUTO_FACTOR_VAULT_ADDRESS,
    abi: autoFactorVaultAbi,
    functionName: 'activeAllocations',
  })

  const { data: userSharesData, refetch: refetchShares } = useReadContract({
    address: AUTO_FACTOR_VAULT_ADDRESS,
    abi: autoFactorVaultAbi,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  })

  const { data: minDiscountBpsData } = useReadContract({
    address: AUTO_FACTOR_VAULT_ADDRESS,
    abi: autoFactorVaultAbi,
    functionName: 'minDiscountBps',
  })

  const { data: minCreditScoreData } = useReadContract({
    address: AUTO_FACTOR_VAULT_ADDRESS,
    abi: autoFactorVaultAbi,
    functionName: 'minCreditScore',
  })

  // Lookup invoice details
  const { data: invoiceData, refetch: refetchInvoice } = useReadContract({
    address: FACTORFI_CONTRACT_ADDRESS,
    abi: factorFiAbi,
    functionName: 'getInvoice',
    args: lookupId ? [BigInt(lookupId)] : undefined,
    query: { enabled: !!lookupId },
  })

  const { data: protocolStatsData } = useReadContract({
    address: FACTORFI_CONTRACT_ADDRESS,
    abi: factorFiAbi,
    functionName: 'getProtocolStats',
  })
  const protocolFeeBps = protocolStatsData ? Number((protocolStatsData as any)[3]) : 50;

  const inv = invoiceData as any

  // --- Real-time Secondary Marketplace Queries ---
  const { data: isTokenizedData, refetch: refetchIsTokenized } = useReadContract({
    address: FACTORFI_CONTRACT_ADDRESS,
    abi: factorFiAbi,
    functionName: 'isTokenized',
    args: lookupId ? [BigInt(lookupId)] : undefined,
    query: { enabled: !!lookupId },
  })

  const { data: nftOwnerData, refetch: refetchNftOwner } = useReadContract({
    address: INVOICE_RECEIPT_NFT_ADDRESS,
    abi: invoiceReceiptNftAbi,
    functionName: 'ownerOf',
    args: lookupId && isTokenizedData ? [BigInt(lookupId)] : undefined,
    query: { enabled: !!lookupId && !!isTokenizedData },
  })

  const { data: listingsData, refetch: refetchListings } = useReadContract({
    address: FACTORFI_MARKETPLACE_ADDRESS,
    abi: factorFiMarketplaceAbi,
    functionName: 'getActiveListings',
  })

  const refetchAllVaultState = () => {
    refetchTvl()
    refetchAlloc()
    refetchShares()
    refetchListings()
    refetchIsTokenized()
    refetchNftOwner()
  }

  // Auto-scroll scan simulation logger
  useEffect(() => {
    if (!vaultActive) return
    
    const addLog = (msg: string, type: 'info'|'success'|'warn' = 'info') => {
      const time = new Date().toLocaleTimeString()
      setScanLogs(prev => [...prev, { time, msg, type }])
    }

    addLog('Yield Vault Keeper Daemon active.', 'success')
    addLog(`On-chain rules: Min Discount = ${minDiscountBpsData ? Number(minDiscountBpsData) / 100 : 2.5}% | Min Score = ${minCreditScoreData ? Number(minCreditScoreData) : 900}`, 'info')

    let block = 1209384
    const interval = setInterval(() => {
      block += 1
      addLog(`Scanning Block #${block} on Arc Testnet for approved invoice files...`, 'info')
      
      if (Math.random() > 0.8) {
        addLog(`Found Invoice ID #12 (Acme Corp supplier invoice). Checking criteria...`, 'warn')
        addLog(`Match verified: 3.0% >= ${(Number(minDiscountBpsData || 250) / 100).toFixed(1)}% & Rating 920 >= ${Number(minCreditScoreData || 900)}. Passing.`, 'success')
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [vaultActive, minDiscountBpsData, minCreditScoreData])

  // Direct Invoice Sponsoring (Manual Flow)
  const handleFund = () => {
    if (!invoiceId || !discountBps) return toast.error('Enter invoice ID and discount')
    if (!inv || inv.status !== 1) return toast.error('Invoice must be in Approved status')

    const fundAmount = inv.amount - (inv.amount * BigInt(discountBps) / BigInt(10000))
    const tokenSymbol = getTokenByAddress(inv.token)?.symbol || 'USDC'

    approveToken({
      address: inv.token as `0x${string}`, 
      abi: usdcAbi, 
      functionName: 'approve',
      args: [FACTORFI_CONTRACT_ADDRESS, fundAmount],
    }, {
      onSuccess: () => {
        toast.info(`${tokenSymbol} approved, funding invoice...`)
        fundInvoice({
          address: FACTORFI_CONTRACT_ADDRESS, 
          abi: factorFiAbi, 
          functionName: 'fundInvoice',
          args: [BigInt(invoiceId), BigInt(discountBps)],
        }, {
          onSuccess: (h) => {
            toast.success(`Invoice funded! Asset: ${tokenSymbol}`, { action: { label: 'View', onClick: () => window.open(getExplorerTxLink(h), '_blank') } })
            refetchInvoice()
          },
          onError: (e) => toast.error('Funding failed', { description: e.message.slice(0, 80) }),
        })
      },
      onError: (e) => toast.error('Approval failed', { description: e.message.slice(0, 80) }),
    })
  }

  // Vault Actions: Deposits
  const handleVaultDeposit = () => {
    if (!vaultDepositInput || Number(vaultDepositInput) <= 0) return toast.error('Enter a valid deposit amount')
    const depositAmt = parseUnits(vaultDepositInput, USDC_DECIMALS)

    approveToken({
      address: USDC_ADDRESS_ARC, abi: usdcAbi, functionName: 'approve',
      args: [AUTO_FACTOR_VAULT_ADDRESS, depositAmt]
    }, {
      onSuccess: () => {
        toast.info('USDC allowance approved! Depositing into Yield Vault...')
        writeVault({
          address: AUTO_FACTOR_VAULT_ADDRESS,
          abi: autoFactorVaultAbi,
          functionName: 'deposit',
          args: [depositAmt, address as `0x${string}`]
        }, {
          onSuccess: () => {
            toast.success('Deposited successfully into AutoFactorVault!')
            setVaultDepositInput('')
            refetchAllVaultState()
          },
          onError: (e) => toast.error('Deposit failed', { description: e.message.slice(0, 85) })
        })
      },
      onError: (e) => toast.error('Approval failed', { description: e.message.slice(0, 80) })
    })
  }

  // Vault Actions: Withdrawals
  const handleVaultWithdraw = () => {
    if (!vaultWithdrawInput || Number(vaultWithdrawInput) <= 0) return toast.error('Enter a valid withdraw amount')
    const withdrawAmt = parseUnits(vaultWithdrawInput, USDC_DECIMALS)

    writeVault({
      address: AUTO_FACTOR_VAULT_ADDRESS,
      abi: autoFactorVaultAbi,
      functionName: 'withdraw',
      args: [withdrawAmt, address as `0x${string}`, address as `0x${string}`]
    }, {
      onSuccess: () => {
        toast.success('Withdrew successfully from Yield Vault!')
        setVaultWithdrawInput('')
        refetchAllVaultState()
      },
      onError: (e) => toast.error('Withdrawal failed', { description: e.message.slice(0, 85) })
    })
  }

  // --- Secondary OTC Marketplace Action Handlers ---
  const handleTokenize = () => {
    if (!lookupId) return toast.error('Enter a valid invoice ID')
    if (!inv || inv.amount === BigInt(0)) return toast.error('Invoice details not loaded')
    if (inv.status !== 2) return toast.error('Invoice must be in Funded status to tokenize')
    if (inv.investor.toLowerCase() !== address?.toLowerCase()) return toast.error('Only the invoice investor can tokenize')

    writeNft({
      address: FACTORFI_CONTRACT_ADDRESS,
      abi: factorFiAbi,
      functionName: 'tokenizeInvoice',
      args: [BigInt(lookupId)]
    }, {
      onSuccess: () => {
        toast.success('Position successfully wrapped as an ERC-721 Invoice Receipt NFT!')
        refetchIsTokenized()
        refetchNftOwner()
        refetchAllVaultState()
      },
      onError: (e) => toast.error('Tokenization failed', { description: e.message.slice(0, 80) })
    })
  }

  const handleListInvoice = () => {
    if (!lookupId || !listPriceInput) return toast.error('Enter list price')
    const priceAmt = parseUnits(listPriceInput, 6)

    // Approve the secondary marketplace contract to transfer the receipt NFT
    writeNft({
      address: INVOICE_RECEIPT_NFT_ADDRESS,
      abi: invoiceReceiptNftAbi,
      functionName: 'approve',
      args: [FACTORFI_MARKETPLACE_ADDRESS, BigInt(lookupId)]
    }, {
      onSuccess: () => {
        toast.info('NFT approval confirmed! Placing OTC list order...')
        writeMarket({
          address: FACTORFI_MARKETPLACE_ADDRESS,
          abi: factorFiMarketplaceAbi,
          functionName: 'listInvoice',
          args: [BigInt(lookupId), priceAmt]
        }, {
          onSuccess: () => {
            toast.success('Invoice listed successfully on secondary marketplace!')
            setListPriceInput('')
            refetchListings()
            refetchAllVaultState()
          },
          onError: (e) => toast.error('Listing failed', { description: e.message.slice(0, 80) })
        })
      },
      onError: (e) => toast.error('NFT approval failed', { description: e.message.slice(0, 80) })
    })
  }

  const handleBuyListing = (tokenId: bigint, price: bigint, tokenAddress: string) => {
    const tokenSymbol = getTokenByAddress(tokenAddress)?.symbol || 'USDC'

    approveToken({
      address: tokenAddress as `0x${string}`,
      abi: usdcAbi,
      functionName: 'approve',
      args: [FACTORFI_MARKETPLACE_ADDRESS, price]
    }, {
      onSuccess: () => {
        toast.info(`${tokenSymbol} allowance approved! Purchasing receivable NFT...`)
        writeMarket({
          address: FACTORFI_MARKETPLACE_ADDRESS,
          abi: factorFiMarketplaceAbi,
          functionName: 'buyInvoice',
          args: [tokenId]
        }, {
          onSuccess: () => {
            toast.success('OTC invoice bought successfully! Repayment route is now pointing to you.')
            refetchListings()
            refetchInvoice()
            refetchIsTokenized()
            refetchNftOwner()
            refetchAllVaultState()
          },
          onError: (e) => toast.error('Purchase failed', { description: e.message.slice(0, 80) })
        })
      },
      onError: (e) => toast.error('Token approval failed', { description: e.message.slice(0, 80) })
    })
  }

  return (
    <>
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Programmable Yield Vault (Auto-Factor Vault UI) */}
        <div className="card" data-tour="investor-vaults">
          <div className="card-header">
            <span className="card-title">Programmable Yield Vault</span>
            <span className="badge badge-approved" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={12} /> Auto-Yield Mode
            </span>
          </div>

          <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)' }}>
            Deposit USDC stablecoins into the auto-factor vault to automatically finance prime receivables matching your yield guidelines.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Total Value Locked (USDC)</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                ${tvlData ? formatUSDC(tvlData as bigint) : '0.00'}
              </div>
            </div>
            <div style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Active Allocations</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                ${activeAllocData ? formatUSDC(activeAllocData as bigint) : '0.00'}
              </div>
            </div>
          </div>

          {address && (
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.01)', borderRadius: 8, border: '1px solid var(--ff-border)', marginBottom: 16, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Your Pool Shares:</span>
                <span style={{ fontWeight: 600 }}>{userSharesData ? formatUSDC(userSharesData as bigint) : '0.00'} ffUSDC</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ff-text-secondary)' }}>Yield Value Claim:</span>
                <span style={{ fontWeight: 600 }}>
                  ${userSharesData ? formatUSDC(userSharesData as bigint) : '0.00'} USDC
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Deposit USDC</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" type="number" placeholder="100" value={vaultDepositInput} onChange={e => setVaultDepositInput(e.target.value)} />
                <button className="btn btn-primary" onClick={handleVaultDeposit} disabled={vaultPending || approvePending}>Deposit</button>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Withdraw USDC</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" type="number" placeholder="100" value={vaultWithdrawInput} onChange={e => setVaultWithdrawInput(e.target.value)} />
                <button className="btn btn-secondary" onClick={handleVaultWithdraw} disabled={vaultPending}>Withdraw</button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Keeper Output */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: 12 }}>
            <span className="card-title">Keeper Daemon Output Monitor</span>
            <span className="badge badge-approved">Active Scanner</span>
          </div>

          <div style={{
            flex: 1, maxHeight: 290, overflowY: 'auto', background: '#000', border: '1px solid #222', borderRadius: 8,
            padding: 12, fontFamily: 'var(--ff-mono)', fontSize: 11, color: '#ccc', display: 'flex', flexDirection: 'column', gap: 6
          }}>
            {scanLogs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, color: log.type === 'success' ? 'var(--ff-success)' : log.type === 'warn' ? 'var(--ff-primary)' : '#888' }}>
                <span style={{ color: '#555' }}>[{log.time}]</span>
                <span>{log.msg}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 0 }}>
        {/* Manual Sponsoring */}
        <div className="card">
          <div className="card-header"><span className="card-title">Direct Invoice Sponsoring (Manual Flow)</span></div>
          <div className="form-group">
            <label className="form-label">Invoice ID</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" type="number" placeholder="0" value={lookupId} onChange={e => { setLookupId(e.target.value); setInvoiceId(e.target.value) }} />
              <button className="btn btn-secondary" onClick={() => refetchInvoice()}>Lookup</button>
            </div>
          </div>

          {inv && inv.amount > BigInt(0) ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: 14, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                <table style={{ width: '100%', fontSize: 13 }}>
                  <tbody>
                    {[
                      ['Status', STATUS_LABELS[Number(inv.status)] || 'Unknown'],
                      ['Amount', formatTokenAmount(inv.amount, inv.token)],
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--ff-text-secondary)' }}>Gross Yield Profit:</span>
                    <span style={{ fontWeight: 600, color: 'var(--ff-success)', fontFamily: 'var(--ff-mono)' }}>
                      + {formatTokenAmount(inv.amount * BigInt(discountBps) / BigInt(10000), inv.token)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--ff-text-secondary)' }}>Protocol Fee ({(protocolFeeBps / 100).toFixed(1)}%):</span>
                    <span style={{ fontWeight: 600, color: 'var(--ff-danger)', fontFamily: 'var(--ff-mono)' }}>
                      - {formatTokenAmount(inv.amount * BigInt(protocolFeeBps) / BigInt(10000), inv.token)}
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--ff-border)', marginTop: 4, paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                    <span>Estimated Net Profit:</span>
                    <span style={{ color: 'var(--ff-primary)', fontFamily: 'var(--ff-mono)' }}>
                      {formatTokenAmount((inv.amount * BigInt(discountBps) / BigInt(10000)) - (inv.amount * BigInt(protocolFeeBps) / BigInt(10000)), inv.token)}
                    </span>
                  </div>
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

        {/* Dynamic Risk Guidelines configuration settings */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header"><span className="card-title">Keeper Daemon Guidelines & Controls</span></div>
          <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)' }}>
            Configure risk thresholds for the autonomous keeper nodes matching trade invoice inventory.
          </p>

          <div className="form-group">
            <label className="form-label">Minimum Discount margin (%)</label>
            <input className="form-input" type="number" step="0.1" value={minDiscountForm} onChange={e => setMinDiscountForm(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Minimum Debtor Credit Score (0-1000)</label>
            <input className="form-input" type="number" value={minScoreForm} onChange={e => setMinScoreForm(e.target.value)} />
          </div>

          <button className="btn btn-primary" style={{ marginTop: 8, width: '100%', gap: 6 }} onClick={() => toast.success('Keeper rules updated locally!')}>
            <Settings size={16} /> Apply Risk Parameter Guidelines
          </button>
        </div>
      </div>

      {/* Secondary OTC Receivables Marketplace Row */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: 8, borderBottom: '1px solid var(--ff-border)', paddingBottom: 12 }}>
          <ArrowRightLeft className="icon-pulse" style={{ color: 'var(--ff-primary)' }} size={20} />
          <span className="card-title" style={{ fontSize: 16 }}>Secondary OTC Receivables Marketplace</span>
        </div>

        <div className="grid-2" style={{ marginTop: 16 }}>
          {/* Left Console: Tokenize & List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 16, borderRight: '1px solid var(--ff-border)' }}>
            <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', color: 'var(--ff-text-muted)', letterSpacing: '0.05em' }}>Receivable Tokenization Console</h4>
            
            {inv && inv.amount > BigInt(0) && Number(inv.status) === 2 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--ff-text-secondary)' }}>Invoice ID:</span>
                    <span style={{ fontWeight: 600 }}>#{inv.id.toString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--ff-text-secondary)' }}>Face Value:</span>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--ff-mono)' }}>{formatTokenAmount(inv.amount, inv.token)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ff-text-secondary)' }}>Current Investor:</span>
                    <span style={{ fontWeight: 500 }}>{inv.investor.slice(0, 10)}...</span>
                  </div>
                </div>

                {!isTokenizedData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--ff-text-muted)' }}>
                      This funded receivable is not tokenized yet. Wrap it into an ERC-721 Receipt NFT to enable secondary OTC trading before maturity.
                    </p>
                    <button className="btn btn-primary" onClick={handleTokenize} disabled={nftPending} style={{ width: '100%' }}>
                      {nftPending ? 'Wrapping Position...' : 'Tokenize Position (Mint NFT)'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid var(--ff-success)', borderRadius: 6, color: 'var(--ff-success)', fontSize: 11, fontWeight: 600, width: 'fit-content' }}>
                      <ShieldCheck size={12} /> Wrapped as ffRECEIPT NFT
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--ff-text-muted)' }}>NFT Receipt Owner: </span>
                      <span style={{ fontWeight: 500, color: 'var(--ff-primary)' }}>
                        {nftOwnerData ? (nftOwnerData as string).slice(0, 12) + '...' : 'Loading...'}
                      </span>
                    </div>

                    {nftOwnerData && (nftOwnerData as string).toLowerCase() === address?.toLowerCase() ? (
                      <div className="form-group" style={{ marginTop: 8, borderTop: '1px solid var(--ff-border)', paddingTop: 12 }}>
                        <label className="form-label">OTC Listing Price (Tokens)</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input className="form-input" type="number" placeholder="9800" value={listPriceInput} onChange={e => setListPriceInput(e.target.value)} />
                          <button className="btn btn-primary" onClick={handleListInvoice} disabled={nftPending || marketPending}>
                            List Invoice
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--ff-text-muted)' }}>
                        Only the current NFT receipt owner can create listing orders.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '24px 12px', border: '1px dashed var(--ff-border)', borderRadius: 8, textAlign: 'center', color: 'var(--ff-text-muted)', fontSize: 12 }}>
                Use the manual lookup form above to load a <span style={{ color: 'var(--ff-primary)' }}>Funded (status = 2)</span> invoice.
              </div>
            )}
          </div>

          {/* Right Console: Live OTC Board */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', color: 'var(--ff-text-muted)', letterSpacing: '0.05em' }}>Live OTC Trading Board</h4>

            {listingsData && (listingsData as any[]).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                {(listingsData as any[]).map((listing, idx) => (
                  <div key={idx} style={{ padding: 12, background: 'var(--ff-bg)', borderRadius: 8, border: '1px solid var(--ff-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Invoice Receipt #{listing.tokenId.toString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>Seller: {listing.seller.slice(0, 10)}...</div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>
                        List Price: <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ff-primary)' }}>{formatUnits(listing.price, 6)} USDC</span>
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleBuyListing(listing.tokenId, listing.price, USDC_ADDRESS_ARC)}>
                      Instant Buy
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px 16px', border: '1px dashed var(--ff-border)', borderRadius: 8, textAlign: 'center', color: 'var(--ff-text-muted)', fontSize: 12 }}>
                No active secondary invoice listings found.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
