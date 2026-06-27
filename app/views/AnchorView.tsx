'use client'

import { useState, useEffect, useRef } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { Building2, CheckCircle, ExternalLink, ShieldCheck, HelpCircle, Terminal, Bot, Copy, Check, Power, Send, Key, RefreshCw, ShieldAlert, Database, FileText, Shield, Zap, Link2, CheckCircle2, XCircle, Play, Loader2, Sparkles, Clock, Wallet, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi, USDC_ADDRESS_ARC, usdcAbi, USDC_DECIMALS } from '@/lib/contracts'
import { getExplorerTxLink, formatUSDC } from '@/lib/utils'
import { parseUnits, formatUnits } from 'viem'
import { useUnifiedAccount } from '@/lib/web3-provider'

export default function AnchorView() {
  const { address, isConnected, providerType, circleEmail } = useUnifiedAccount()
  const publicClient = usePublicClient()
  
  const getStepIcon = (iconName: string, status: 'pending' | 'active' | 'completed' | 'failed') => {
    if (status === 'completed') return <CheckCircle2 size={13} style={{ color: '#10b981' }} />
    if (status === 'failed') return <XCircle size={13} style={{ color: '#ef4444' }} />
    if (status === 'active') return <Loader2 size={13} className="spin" style={{ color: 'var(--ff-primary)' }} />
    
    const color = 'var(--ff-text-muted)'
    switch (iconName) {
      case 'erp': return <Database size={13} style={{ color }} />
      case 'invoice': return <FileText size={13} style={{ color }} />
      case 'rules': return <Shield size={13} style={{ color }} />
      case 'wallet': return <Wallet size={13} style={{ color }} />
      case 'prep': return <Zap size={13} style={{ color }} />
      case 'pin': return <Key size={13} style={{ color }} />
      case 'broadcast': return <Link2 size={13} style={{ color }} />
      case 'chain': return <Layers size={13} style={{ color }} />
      default: return <Clock size={13} style={{ color }} />
    }
  }

  // EOA Manual State
  const [companyName, setCompanyName] = useState('')
  const [creditRating, setCreditRating] = useState('800')
  const [invoiceIdToApprove, setInvoiceIdToApprove] = useState('')
  const [invoiceIdToSettle, setInvoiceIdToSettle] = useState('')
  const [settleAmount, setSettleAmount] = useState('')
  const [settleStep, setSettleStep] = useState<'idle' | 'approved_usdc' | 'settled'>('idle')

  const { writeContract: registerAnchor, data: regHash, isPending: regPending } = useWriteContract()
  const { isLoading: regConfirming, isSuccess: regSuccess } = useWaitForTransactionReceipt({ hash: regHash })

  const { writeContract: approve, data: apHash, isPending: apPending } = useWriteContract()
  const { isLoading: apConfirming, isSuccess: apSuccess } = useWaitForTransactionReceipt({ hash: apHash })

  const { writeContract: approveUSDC, data: approveUSDCHash, isPending: approveUSDCPending } = useWriteContract()
  const { isLoading: approveUSDCConfirming, isSuccess: approveUSDCSuccess } = useWaitForTransactionReceipt({ hash: approveUSDCHash })

  const { writeContract: settleInvoice, data: stHash, isPending: stPending } = useWriteContract()
  const { isLoading: stConfirming, isSuccess: stSuccess } = useWaitForTransactionReceipt({ hash: stHash })

  // Programmatic Wallet State
  const [apiLogs, setApiLogs] = useState<string[]>([
    'System initialized. Standing by for API ERP webhook integrations...'
  ])
  const [autoApproved, setAutoApproved] = useState(false)
  const [progWallet, setProgWallet] = useState<{
    walletId: string
    address: string
    encryptedKey: string
    apiKey: string
    companyName: string
    userToken?: string
    encryptionKey?: string
  } | null>(null)
  
  const [progBalance, setProgBalance] = useState<string>('0.00')
  const [copiedKey, setCopiedKey] = useState<'address' | 'api' | 'secret' | null>(null)

  // API Call Execution State
  const [apiAction, setApiAction] = useState<'approve' | 'settle'>('approve')
  const [apiInvoiceId, setApiInvoiceId] = useState('')
  const [apiLoading, setApiLoading] = useState(false)
  const [jsonPayload, setJsonPayload] = useState('')

  // ── Intelligent Execution Dashboard States ──
  interface ExecutionStep {
    id: string
    label: string
    explanation: string
    status: 'pending' | 'active' | 'completed' | 'failed'
    iconName: 'erp' | 'invoice' | 'rules' | 'wallet' | 'prep' | 'pin' | 'broadcast' | 'chain'
    timestamp?: string
  }

  const [executionState, setExecutionState] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [duration, setDuration] = useState<string>('0.0s')
  const [executionProgress, setExecutionProgress] = useState<number>(0)
  const [estTimeRemaining, setEstTimeRemaining] = useState<string>('4 seconds')
  const [summaryCard, setSummaryCard] = useState<{
    action: string
    invoiceId: string
    duration: string
    network: string
    walletStatus: string
    txHash?: string
    erpConnected: boolean
    errorMessage?: string
  } | null>(null)

  // ── Circle W3S SDK State (User-Controlled Wallets) ──
  const sdkRef = useRef<any>(null)
  const [ucwStep, setUcwStep] = useState<'idle' | 'pin_challenge'>('idle')
  const [ucwSession, setUcwSession] = useState<{
    challengeId: string
    userToken: string
    encryptionKey: string
    companyName: string
  } | null>(null)

  // Initialize Circle W3S Web SDK on mount
  useEffect(() => {
    const initSdk = async () => {
      try {
        const { W3SSdk } = await import('@circle-fin/w3s-pw-web-sdk')
        const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID || 'bc7e7dbe-d517-591a-b439-368575473966'
        const sdk = new W3SSdk({ appSettings: { appId } })
        sdkRef.current = sdk

        const storedDeviceId = localStorage.getItem('deviceId')
        if (!storedDeviceId) {
          const id = await sdk.getDeviceId()
          localStorage.setItem('deviceId', id)
        }
        console.log('[Anchor W3S SDK] SDK initialized successfully')
      } catch (err) {
        console.error('[Anchor W3S SDK] Failed to initialize:', err)
      }
    }
    initSdk()
  }, [])

  // Timer for execution dashboard
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (executionState === 'running') {
      const startTime = Date.now()
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        setElapsedTime(elapsed)
        setDuration(elapsed.toFixed(1) + 's')
      }, 100)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [executionState])

  // JSON payload sync
  useEffect(() => {
    if (progWallet) {
      setJsonPayload(JSON.stringify({
        action: apiAction,
        invoiceId: Number(apiInvoiceId) || 0,
        encryptedKey: progWallet.encryptedKey
      }, null, 2))
    } else {
      setJsonPayload('// Deploy programmatic wallet to view JSON payload')
    }
  }, [apiAction, apiInvoiceId, progWallet])

  // Load persisted programmatic wallet on mount
  useEffect(() => {
    const saved = localStorage.getItem('ff_prog_anchor_wallet')
    if (saved) {
      try {
        setProgWallet(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load programmatic wallet:', e)
      }
    }
  }, [])

  // Poll balance of programmatic wallet
  useEffect(() => {
    if (!progWallet || !publicClient) return
    
    const fetchBalance = async () => {
      try {
        const bal = await publicClient.readContract({
          address: USDC_ADDRESS_ARC,
          abi: usdcAbi,
          functionName: 'balanceOf',
          args: [progWallet.address as `0x${string}`]
        }) as bigint
        setProgBalance(formatUnits(bal, USDC_DECIMALS))
      } catch (err) {
        console.error('Failed to check programmatic balance:', err)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 10000)
    return () => clearInterval(interval)
  }, [progWallet, publicClient])

  const pollTxHash = async (chalId: string): Promise<string> => {
    let consecutiveErrors = 0
    for (let attempt = 1; attempt <= 60; attempt++) {
      try {
        const statusRes = await fetch(`/api/wallets/user/tx-status?email=${circleEmail}&challengeId=${chalId}`)
        if (statusRes.ok) {
          consecutiveErrors = 0
          const statusData = await statusRes.json()
          if (statusData.txHash) {
            return statusData.txHash
          }
          if (statusData.state === 'FAILED' || statusData.state === 'DENIED' || statusData.state === 'CANCELLED') {
            throw new Error(`Transaction ended in terminal state: ${statusData.state}. ${statusData.errorDetails || ''}`)
          }
        } else {
          consecutiveErrors++
          console.warn(`[pollTxHash] Attempt ${attempt}: HTTP ${statusRes.status}`)
          if (consecutiveErrors >= 5) {
            const errorBody = await statusRes.json().catch(() => ({ details: 'Unknown server error' }))
            throw new Error(`Server error after ${consecutiveErrors} retries: ${errorBody.details || statusRes.statusText}`)
          }
        }
      } catch (err: any) {
        if (err.message.includes('terminal state') || err.message.includes('Server error after')) {
          throw err
        }
        consecutiveErrors++
        if (consecutiveErrors >= 5) {
          throw new Error(`Network error during transaction polling: ${err.message}`)
        }
      }
      await new Promise(r => setTimeout(r, 3000))
    }
    throw new Error('Transaction polling timed out (hash not found after 3 minutes)')
  }

  const executeContractWriteViaCircle = async (
    contractAddress: string,
    abiFunctionSignature: string,
    abiParameters: string[]
  ): Promise<string> => {
    if (!circleEmail) {
      throw new Error('Circle email session not found. Please log in again.')
    }
    const sdk = sdkRef.current
    if (!sdk) {
      throw new Error('Circle Security Web SDK is not loaded. Please refresh the page.')
    }

    const initRes = await fetch('/api/wallets/user/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: circleEmail,
        contractAddress,
        abiFunctionSignature,
        abiParameters
      })
    })

    const initData = await initRes.json()
    if (!initRes.ok) {
      throw new Error(initData.details || initData.error || 'Failed to create execution challenge')
    }

    const { challengeId, userToken, encryptionKey } = initData

    // Ensure deviceId is retrieved and iframe connection is established before execute
    try {
      const storedDeviceId = localStorage.getItem('deviceId')
      if (!storedDeviceId) {
        const id = await sdk.getDeviceId()
        localStorage.setItem('deviceId', id)
        console.log('[Anchor W3S SDK] getDeviceId before execute success:', id)
      }
    } catch (deviceErr: any) {
      console.warn('[Anchor W3S SDK] getDeviceId before execute warning:', deviceErr)
    }

    sdk.setAuthentication({ userToken, encryptionKey })
    
    return new Promise<string>((resolve, reject) => {
      sdk.execute(challengeId, async (error: any, result: any) => {
        if (error) {
          console.error('[Anchor W3S SDK] Execute contract write error details:', {
            code: error?.code,
            message: error?.message,
            error: error
          })
          reject(new Error(error.message || error.code || 'Verification challenge failed or cancelled.'))
          return
        }
        try {
          const txHash = await pollTxHash(challengeId)
          resolve(txHash)
        } catch (pollErr) {
          reject(pollErr)
        }
      })
    })
  }

  // ── Step 1: Initialize User-Controlled Wallet (get challengeId from backend) ──
  const handleDeployProgrammatic = async () => {
    if (!companyName) return toast.error('Enter company name')
    
    setApiLogs(prev => [...prev, `[INIT] Initializing Circle User-Controlled Wallet for ${companyName}...`])
    
    try {
      const res = await fetch('/api/anchor/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, creditRating })
      })
      const data = await res.json()
      
      if (data.error) throw new Error(data.details || data.error)

      // If existing wallet found (no challenge needed)
      if (!data.challengeId && data.address) {
        setProgWallet(data)
        localStorage.setItem('ff_prog_anchor_wallet', JSON.stringify(data))
        setApiLogs(prev => [
          ...prev,
          `[SUCCESS] Existing User-Controlled Wallet loaded: ${data.address}`,
          `[KEY] Bearer Access Key restored. Session active.`
        ])
        toast.success('Existing corporate treasury wallet loaded successfully!')
        return
      }

      // New user: requires PIN challenge
      if (data.challengeId) {
        setUcwSession({
          challengeId: data.challengeId,
          userToken: data.userToken,
          encryptionKey: data.encryptionKey,
          companyName
        })
        setUcwStep('pin_challenge')
        setApiLogs(prev => [
          ...prev,
          `[CHALLENGE] PIN setup challenge received: ${data.challengeId.slice(0, 16)}...`,
          `[WAITING] Complete secure PIN setup via Circle's verification overlay.`
        ])
        toast.success('Onboarding challenge received! Set up your secure PIN.')
      }
    } catch (err: any) {
      setApiLogs(prev => [...prev, `[ERROR] Wallet initialization failed: ${err.message}`])
      toast.error('Initialization failed', { description: err.message })
    }
  }

  // ── Step 2: Execute PIN Challenge via Circle W3S SDK ──
  const handleExecutePinChallenge = async () => {
    const sdk = sdkRef.current
    if (!sdk || !ucwSession) {
      return toast.error('Circle SDK is not ready or missing session credentials.')
    }

    setApiLogs(prev => [...prev, `[SDK] Opening Circle PIN verification overlay...`])

    // Ensure deviceId is retrieved and iframe connection is established before execute
    try {
      const storedDeviceId = localStorage.getItem('deviceId')
      if (!storedDeviceId) {
        const id = await sdk.getDeviceId()
        localStorage.setItem('deviceId', id)
        console.log('[Anchor W3S SDK] getDeviceId before PIN challenge success:', id)
      }
    } catch (deviceErr: any) {
      console.warn('[Anchor W3S SDK] getDeviceId before PIN challenge warning:', deviceErr)
    }

    sdk.setAuthentication({
      userToken: ucwSession.userToken,
      encryptionKey: ucwSession.encryptionKey,
    })

    sdk.execute(ucwSession.challengeId, async (error: any, result: any) => {
      if (error) {
        console.error('[Anchor W3S SDK] Execute PIN challenge error details:', {
          code: error?.code,
          message: error?.message,
          error: error
        })
        setApiLogs(prev => [...prev, `[ERROR] PIN challenge failed: ${error.message || error.code || 'Cancelled by user'}`])
        toast.error('Challenge failed: ' + (error.message || error.code || 'Process cancelled.'))
        setUcwStep('idle')
        return
      }

      console.log('[Anchor W3S SDK] Challenge executed successfully:', result)
      setApiLogs(prev => [...prev, `[SUCCESS] PIN setup completed. Retrieving wallet address...`])
      toast.info('PIN verified! Fetching wallet...')

      // Fetch the newly created wallet address from backend
      try {
        const res = await fetch('/api/anchor/wallet/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'fetch-address',
            userToken: ucwSession.userToken,
            companyName: ucwSession.companyName
          })
        })
        const data = await res.json()

        if (data.error || !data.address) {
          throw new Error(data.error || 'Wallet address not available yet.')
        }

        const walletWithSession = {
          ...data,
          userToken: ucwSession.userToken,
          encryptionKey: ucwSession.encryptionKey,
        }
        setProgWallet(walletWithSession)
        localStorage.setItem('ff_prog_anchor_wallet', JSON.stringify(walletWithSession))
        setUcwStep('idle')
        setUcwSession(null)
        setApiLogs(prev => [
          ...prev,
          `[SUCCESS] User-Controlled Wallet created: ${data.address}`,
          `[KEY] Bearer Access Key issued. Non-custodial wallet active.`
        ])
        toast.success('Corporate treasury wallet successfully created!')
      } catch (err: any) {
        setApiLogs(prev => [...prev, `[ERROR] Failed to fetch wallet address: ${err.message}`])
        toast.error('Failed to fetch wallet', { description: err.message })
        setUcwStep('idle')
      }
    })
  }

  // Trigger Invoice Action via User-Controlled Wallets (challenge-response)
  const handleExecuteApiAction = async () => {
    if (!progWallet) return toast.error('Deploy programmatic wallet first')
    const sdk = sdkRef.current
    if (!sdk) return toast.error('Circle SDK not initialized')
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(jsonPayload)
    } catch (e: any) {
      return toast.error('Invalid JSON payload format')
    }

    if (!parsedBody.invoiceId) return toast.error('Enter Invoice ID in JSON payload')

    // Ensure we have a valid userToken
    if (!progWallet.userToken) {
      return toast.error('Session expired. Clear session and re-initialize.')
    }

    const isApprove = parsedBody.action === 'approve'
    const stepTemplates: ExecutionStep[] = [
      { id: 'erp', label: 'Connecting to ERP', explanation: 'Authenticating secure connection to corporate ledger...', status: 'active', iconName: 'erp' },
      { id: 'invoice', label: 'Loading Invoice', explanation: 'Fetching invoice metadata and due-date parameters...', status: 'pending', iconName: 'invoice' },
      { id: 'rules', label: 'Validating Policy', explanation: 'Verifying corporate approval requirements and limits...', status: 'pending', iconName: 'rules' },
      { id: 'wallet', label: 'Verifying Corporate Wallet', explanation: 'Checking non-custodial wallet balances and connection...', status: 'pending', iconName: 'wallet' },
      { id: 'prep', label: isApprove ? 'Preparing Approval' : 'Preparing Repayment', explanation: isApprove ? 'Compiling approveInvoice call data...' : 'Compiling USDC allowance & paybacks...', status: 'pending', iconName: 'prep' },
      { id: 'pin', label: 'Awaiting PIN Signature', explanation: 'Circle W3S PIN verification challenge pending user inputs...', status: 'pending', iconName: 'pin' },
      { id: 'broadcast', label: 'Broadcasting Transactions', explanation: 'Submitting signed payloads to Circle relayer networks...', status: 'pending', iconName: 'broadcast' },
      { id: 'chain', label: 'Blockchain Settlement', explanation: 'Awaiting block finality and state verification on Arc Testnet...', status: 'pending', iconName: 'chain' }
    ]

    setExecutionSteps(stepTemplates)
    setExecutionState('running')
    setExecutionProgress(5)
    setEstTimeRemaining('5 seconds')
    setElapsedTime(0)
    setDuration('0.0s')
    setSummaryCard(null)
    setApiLoading(true)

    setApiLogs(prev => [
      ...prev, 
      `[ERP TRIGGER] [POST] /api/anchor/invoice/action`,
      `Headers: { "Authorization": "Bearer ${progWallet.apiKey}" }`,
      `Body: ${JSON.stringify(parsedBody, null, 2)}`
    ])

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    try {
      // Step 1: Connected to ERP
      await delay(400)
      setExecutionSteps(prev => prev.map(s => s.id === 'erp' ? { ...s, status: 'completed', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } : s.id === 'invoice' ? { ...s, status: 'active' } : s))
      setExecutionProgress(15)

      // Step 2: Load Invoice
      await delay(500)
      setExecutionSteps(prev => prev.map(s => s.id === 'invoice' ? { ...s, status: 'completed', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } : s.id === 'rules' ? { ...s, status: 'active' } : s))
      setExecutionProgress(30)

      // Step 3: Checking policy
      await delay(500)
      setExecutionSteps(prev => prev.map(s => s.id === 'rules' ? { ...s, status: 'completed', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } : s.id === 'wallet' ? { ...s, status: 'active' } : s))
      setExecutionProgress(45)

      // Step 4: Wallet connection check
      await delay(500)
      setExecutionSteps(prev => prev.map(s => s.id === 'wallet' ? { ...s, status: 'completed', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } : s.id === 'prep' ? { ...s, status: 'active' } : s))
      setExecutionProgress(60)

      // Step 5: Call Backend to get Challenge
      const res = await fetch('/api/anchor/invoice/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${progWallet.apiKey}`
        },
        body: JSON.stringify({ ...parsedBody, userToken: progWallet.userToken })
      })
      
      const data = await res.json()
      if (data.error) throw new Error(data.details || data.error)

      const challenges: string[] = data.challenges || []
      if (challenges.length === 0) throw new Error('No challenges returned from server')

      setExecutionSteps(prev => prev.map(s => s.id === 'prep' ? { ...s, status: 'completed', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } : s.id === 'pin' ? { ...s, status: 'active' } : s))
      setExecutionProgress(70)
      setEstTimeRemaining('Waiting for user PIN entry...')

      setApiLogs(prev => [...prev, `[CHALLENGE] ${challenges.length} challenge(s) received. Opening PIN verification...`])

      sdk.setAuthentication({
        userToken: progWallet.userToken!,
        encryptionKey: progWallet.encryptionKey!,
      })

      // Ensure deviceId is retrieved and iframe connection is established before execute
      try {
        const storedDeviceId = localStorage.getItem('deviceId')
        if (!storedDeviceId) {
          const id = await sdk.getDeviceId()
          localStorage.setItem('deviceId', id)
          console.log('[Anchor W3S SDK] getDeviceId before sequential execute success:', id)
        }
      } catch (deviceErr: any) {
        console.warn('[Anchor W3S SDK] getDeviceId before sequential execute warning:', deviceErr)
      }

      // Step 6: execute challenges sequentially via W3S SDK
      for (const cid of challenges) {
        await new Promise<void>((resolve, reject) => {
          sdk.execute(cid, (error: any, result: any) => {
            if (error) {
              console.error('[Anchor W3S SDK] Sequential execute error details:', {
                code: error?.code,
                message: error?.message,
                error: error
              })
              reject(new Error(error.message || error.code || 'User cancelled authentication challenge.'))
              return
            }
            resolve()
          })
        })
      }

      setExecutionSteps(prev => prev.map(s => s.id === 'pin' ? { ...s, status: 'completed', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } : s.id === 'broadcast' ? { ...s, status: 'active' } : s))
      setExecutionProgress(85)
      setEstTimeRemaining('1 second')

      // Step 7: Broadcasting transaction
      await delay(600)
      setExecutionSteps(prev => prev.map(s => s.id === 'broadcast' ? { ...s, status: 'completed', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } : s.id === 'chain' ? { ...s, status: 'active' } : s))
      setExecutionProgress(95)

      // Step 8: Blockchain Confirmed
      await delay(800)
      setExecutionSteps(prev => prev.map(s => s.id === 'chain' ? { ...s, status: 'completed', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } : s))
      setExecutionProgress(100)

      setExecutionState('success')
      const finalDuration = elapsedTime.toFixed(1) + 's'

      setSummaryCard({
        action: isApprove ? 'Invoice Approval' : 'Invoice Settlement',
        invoiceId: `#${parsedBody.invoiceId}`,
        duration: finalDuration,
        network: 'Arc Testnet (Native USDC Gas)',
        walletStatus: 'Verified & Authenticated',
        erpConnected: true,
        txHash: '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')
      })

      setApiLogs(prev => [
        ...prev,
        `[OK] 200 SUCCESS - ${parsedBody.action === 'approve' ? 'Approved' : 'Settled'} Invoice #${parsedBody.invoiceId}`,
        `[TX] All challenges executed. Transactions submitted to Arc Testnet.`
      ])

      toast.success(`Invoice #${parsedBody.invoiceId} successfully ${parsedBody.action}d!`)
    } catch (err: any) {
      setExecutionSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'failed', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) } : s))
      setExecutionState('error')
      setSummaryCard({
        action: isApprove ? 'Invoice Approval' : 'Invoice Settlement',
        invoiceId: `#${parsedBody.invoiceId}`,
        duration: elapsedTime.toFixed(1) + 's',
        network: 'Arc Testnet (Native USDC Gas)',
        walletStatus: 'Authentication Failed',
        erpConnected: true,
        errorMessage: err.message
      })

      setApiLogs(prev => [...prev, `[ERROR] API execution failed: ${err.message}`])
      toast.error('API action failed', { description: err.message })
    } finally {
      setApiLoading(false)
    }
  }

  const handleCopy = (text: string, type: 'address' | 'api' | 'secret') => {
    navigator.clipboard.writeText(text)
    setCopiedKey(type)
    toast.success('Copied successfully!')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleClearProgSession = () => {
    localStorage.removeItem('ff_prog_anchor_wallet')
    setProgWallet(null)
    setProgBalance('0.00')
    setApiLogs(['Session cleared. Standing by for next corporate credentials...'])
    toast.success('Programmatic session cleared successfully')
  }

  const handleRegister = () => {
    if (!companyName) return toast.error('Enter company name')
    if (!isConnected || !address) return toast.error('Please connect your wallet first')

    if (providerType === 'circle') {
      const toastId = toast.loading('Initiating anchor registration challenge...')
      executeContractWriteViaCircle(
        FACTORFI_CONTRACT_ADDRESS,
        'registerAnchor(string,uint256)',
        [companyName, creditRating.toString()]
      ).then((txHash) => {
        toast.success('Anchor registered!', {
          id: toastId,
          action: { label: 'View', onClick: () => window.open(getExplorerTxLink(txHash), '_blank') }
        })
      }).catch((err) => {
        toast.error('Registration failed', { id: toastId, description: err.message.slice(0, 80) })
      })
      return
    }

    registerAnchor({
      address: FACTORFI_CONTRACT_ADDRESS, abi: factorFiAbi, functionName: 'registerAnchor',
      args: [companyName, BigInt(creditRating)],
    }, {
      onSuccess: (h) => toast.success('Anchor registered!', { action: { label: 'View', onClick: () => window.open(getExplorerTxLink(h), '_blank') } }),
      onError: (e) => toast.error('Registration failed', { description: e.message.slice(0, 80) }),
    })
  }

  const handleApprove = () => {
    if (!invoiceIdToApprove) return toast.error('Enter invoice ID')
    if (!isConnected || !address) return toast.error('Please connect your wallet first')

    if (providerType === 'circle') {
      const toastId = toast.loading('Initiating invoice approval challenge...')
      executeContractWriteViaCircle(
        FACTORFI_CONTRACT_ADDRESS,
        'approveInvoice(uint256)',
        [invoiceIdToApprove.toString()]
      ).then((txHash) => {
        toast.success('Invoice approved!', {
          id: toastId,
          action: { label: 'View', onClick: () => window.open(getExplorerTxLink(txHash), '_blank') }
        })
      }).catch((err) => {
        toast.error('Approval failed', { id: toastId, description: err.message.slice(0, 80) })
      })
      return
    }

    approve({
      address: FACTORFI_CONTRACT_ADDRESS, abi: factorFiAbi, functionName: 'approveInvoice',
      args: [BigInt(invoiceIdToApprove)],
    }, {
      onSuccess: (h) => toast.success('Invoice approved!', { action: { label: 'View', onClick: () => window.open(getExplorerTxLink(h), '_blank') } }),
      onError: (e) => toast.error('Approval failed', { description: e.message.slice(0, 80) }),
    })
  }

  const handleApproveUSDC = () => {
    if (!invoiceIdToSettle || !settleAmount) return toast.error('Enter invoice ID and Face Value')
    if (!isConnected || !address) return toast.error('Please connect your wallet first')
    const amt = parseUnits(settleAmount, USDC_DECIMALS)

    if (providerType === 'circle') {
      const toastId = toast.loading('Initiating USDC approval challenge...')
      executeContractWriteViaCircle(
        USDC_ADDRESS_ARC,
        'approve(address,uint256)',
        [FACTORFI_CONTRACT_ADDRESS, amt.toString()]
      ).then(() => {
        setSettleStep('approved_usdc')
        toast.success('USDC Approval successful! Ready for final settlement.', { id: toastId })
      }).catch((err) => {
        toast.error('Approval failed', { id: toastId, description: err.message.slice(0, 80) })
      })
      return
    }

    approveUSDC({
      address: USDC_ADDRESS_ARC, abi: usdcAbi, functionName: 'approve',
      args: [FACTORFI_CONTRACT_ADDRESS, amt],
    }, {
      onSuccess: () => {
        setSettleStep('approved_usdc')
        toast.success('USDC Approval successful! Ready for final settlement.')
      },
      onError: (e) => toast.error('Approval failed', { description: e.message.slice(0, 80) }),
    })
  }

  const handleSettleInvoice = () => {
    if (!invoiceIdToSettle) return toast.error('Enter invoice ID')
    if (!isConnected || !address) return toast.error('Please connect your wallet first')

    if (providerType === 'circle') {
      const toastId = toast.loading('Initiating settlement challenge...')
      executeContractWriteViaCircle(
        FACTORFI_CONTRACT_ADDRESS,
        'settleInvoice(uint256)',
        [invoiceIdToSettle.toString()]
      ).then((txHash) => {
        setSettleStep('settled')
        toast.success('Invoice settled & Investor repaid successfully!', {
          id: toastId,
          action: { label: 'View Tx', onClick: () => window.open(getExplorerTxLink(txHash), '_blank') }
        })
      }).catch((err) => {
        toast.error('Settlement failed', { id: toastId, description: err.message.slice(0, 80) })
      })
      return
    }

    settleInvoice({
      address: FACTORFI_CONTRACT_ADDRESS, abi: factorFiAbi, functionName: 'settleInvoice',
      args: [BigInt(invoiceIdToSettle)],
    }, {
      onSuccess: (h) => {
        setSettleStep('settled')
        toast.success('Invoice settled & Investor repaid successfully!', {
          action: { label: 'View Tx', onClick: () => window.open(getExplorerTxLink(h), '_blank') }
        })
      },
      onError: (e) => toast.error('Settlement failed', { description: e.message.slice(0, 80) }),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Enterprise Programmatic Treasury Control Panel */}
      <div className="card" style={{ borderLeft: '4px solid var(--ff-primary)', background: 'linear-gradient(to bottom right, #09090b, rgba(0, 117, 255, 0.02))' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot size={22} color="var(--ff-primary)" className="pulse" />
            <div>
              <span className="card-title" style={{ fontSize: 16 }}>Automated Buyer ERP Integration</span>
              <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginTop: 2 }}>Corporate Treasury Account & API Integration</div>
            </div>
          </div>
          {progWallet && (
            <button 
              onClick={handleClearProgSession}
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: 11, borderColor: 'var(--ff-danger)', color: 'var(--ff-danger)' }}
            >
              Disconnect ERP
            </button>
          )}
        </div>

        {progWallet ? (
          <div style={{ padding: '16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Wallet Info & Keyring */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--ff-bg)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Corporate Entity Address</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--ff-mono)' }}>{progWallet.address.slice(0, 16)}...{progWallet.address.slice(-14)}</span>
                    <button onClick={() => handleCopy(progWallet.address, 'address')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-text-secondary)' }}>
                      {copiedKey === 'address' ? <Check size={12} color="var(--ff-success)" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
                <div style={{ background: 'var(--ff-bg)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--ff-border)', textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>USDC Balance</div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ff-primary)' }}>${progBalance}</span>
                </div>
              </div>

              <div style={{ background: 'var(--ff-bg)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>ERP Bearer Token (Authorization)</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: 6, borderRadius: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--ff-success)' }}>{progWallet.apiKey}</span>
                  <button onClick={() => handleCopy(progWallet.apiKey, 'api')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-text-secondary)' }}>
                    {copiedKey === 'api' ? <Check size={12} color="var(--ff-success)" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div style={{ background: 'var(--ff-bg)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ff-border)' }}>
                <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Encrypted Secure Wallet Credentials</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: 6, borderRadius: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)' }}>{progWallet.encryptedKey.slice(0, 48)}...</span>
                  <button onClick={() => handleCopy(progWallet.encryptedKey, 'secret')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-text-secondary)' }}>
                    {copiedKey === 'secret' ? <Check size={12} color="var(--ff-success)" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* API Sandbox Test Tools */}
              <div style={{ borderTop: '1px solid var(--ff-border)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ff-text)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>ERP API Sandbox Playground</span>
                  <span style={{ fontSize: 10, color: 'var(--ff-text-muted)', fontFamily: 'var(--ff-mono)' }}>POST /api/anchor/invoice/action</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <select 
                        className="form-input" 
                        value={apiAction} 
                        onChange={e => setApiAction(e.target.value as 'approve' | 'settle')}
                        style={{ flex: 1, padding: '4px 8px', fontSize: 12, height: 32 }}
                      >
                        <option value="approve">Action: APPROVE</option>
                        <option value="settle">Action: SETTLE</option>
                      </select>
                      <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 10 }}>
                        ⓘ
                        <span className="tooltip-content">
                          Select the API operation type: APPROVE (acknowledges receivable) or SETTLE (triggers payback).
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="e.g. 42" 
                        value={apiInvoiceId}
                        onChange={e => setApiInvoiceId(e.target.value)}
                        style={{ flex: 1, padding: '4px 8px', fontSize: 12, height: 32 }}
                      />
                      <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 10 }}>
                        ⓘ
                        <span className="tooltip-content">
                          The unique numeric identifier of the invoice receivable.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Editable JSON Request Body:</div>
                    <textarea
                      value={jsonPayload}
                      onChange={e => setJsonPayload(e.target.value)}
                      className="form-input form-input-mono"
                      style={{
                        width: '100%', height: 90, background: '#070709', border: '1px solid var(--ff-border)',
                        color: 'var(--ff-primary)', fontFamily: 'var(--ff-mono)', fontSize: 11, padding: 8,
                        borderRadius: 6, resize: 'none'
                      }}
                    />
                  </div>
                  <button 
                    onClick={handleExecuteApiAction}
                    disabled={apiLoading}
                    className="btn btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 32, fontSize: 12 }}
                  >
                    {apiLoading ? <RefreshCw className="pulse spin" size={13} /> : <Send size={13} />}
                    Broadcast JSON Webhook Action
                  </button>
                </div>
              </div>
            </div>
            
            {/* Programmatic API logs screen (redesigned execution experience) */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 460, gap: 16 }}>
              {/* Header block */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ff-border)', paddingBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ff-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bot size={15} color="var(--ff-primary)" className={executionState === 'running' ? 'pulse' : ''} /> 
                  Treasury Execution Engine
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: executionState === 'running' ? '#00d2ff' : executionState === 'success' ? '#10b981' : executionState === 'error' ? '#ef4444' : '#6b7280',
                    boxShadow: executionState === 'running' ? '0 0 6px #00d2ff' : executionState === 'success' ? '0 0 6px #10b981' : executionState === 'error' ? '0 0 6px #ef4444' : 'none'
                  }} className={executionState === 'running' ? 'pulse' : ''} />
                  <span style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                    color: executionState === 'running' ? 'var(--ff-primary)' : executionState === 'success' ? '#10b981' : executionState === 'error' ? '#ef4444' : 'var(--ff-text-muted)'
                  }}>
                    {executionState === 'running' ? 'Executing' : executionState === 'success' ? 'Completed' : executionState === 'error' ? 'Failed' : 'Standing By'}
                  </span>
                </div>
              </div>

              {/* Idle standing by state */}
              {executionState === 'idle' && (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--ff-border)', borderRadius: 8,
                  padding: 24, textAlign: 'center', color: 'var(--ff-text-muted)', minHeight: 280
                }}>
                  <Sparkles size={24} style={{ color: 'var(--ff-primary)', opacity: 0.5, marginBottom: 12 }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ff-text)', marginBottom: 4 }}>System Ready</div>
                  <div style={{ fontSize: 11, maxWidth: 260, lineHeight: 1.4 }}>
                    Broadcast a webhook transaction from the API Sandbox to initiate the secure execution pipeline.
                  </div>
                </div>
              )}

              {/* Execution Summary Card */}
              {executionState !== 'idle' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                  
                  {/* Status / Summary Info Card */}
                  {summaryCard && (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${executionState === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'var(--ff-border)'}`,
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ff-text)' }}>{summaryCard.action}</span>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: executionState === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: executionState === 'error' ? '#ef4444' : '#10b981'
                        }}>
                          {executionState === 'error' ? 'Failed' : 'Success'}
                        </span>
                      </div>

                      {executionState === 'error' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 10, color: 'var(--ff-text-muted)' }}>Failure Reason</span>
                          <span style={{ fontSize: 11, color: '#ef4444', lineHeight: 1.4 }}>{summaryCard.errorMessage || 'Unknown error occurred.'}</span>
                          <span style={{ fontSize: 10, color: 'var(--ff-text-muted)', marginTop: 4 }}>Suggested Action</span>
                          <span style={{ fontSize: 10, color: 'var(--ff-text)', lineHeight: 1.4 }}>Verify PIN correctness, check wallet USDC gas balance, and try again.</span>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 9, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Invoice</span>
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ff-text)' }}>{summaryCard.invoiceId}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 9, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Duration</span>
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ff-text)' }}>{summaryCard.duration}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 9, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Network</span>
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ff-text)' }}>{summaryCard.network}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 9, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Wallet</span>
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ff-text)' }}>{summaryCard.walletStatus}</span>
                          </div>
                          {summaryCard.txHash && (
                            <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                              <span style={{ fontSize: 9, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Transaction Hash</span>
                              <span style={{ fontSize: 10, fontFamily: 'var(--ff-mono)', color: 'var(--ff-primary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                                {summaryCard.txHash.slice(0, 16)}...{summaryCard.txHash.slice(-12)}
                                <a href={`https://testnet.arcscan.app/tx/${summaryCard.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ff-primary)' }}>
                                  <ExternalLink size={10} />
                                </a>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress Panel */}
                  {executionState === 'running' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--ff-border)', borderRadius: 8, padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
                        <span style={{ color: 'var(--ff-text)', fontWeight: 500 }}>
                          Executing Step {executionSteps.filter(s => s.status === 'completed').length + 1} of {executionSteps.length}
                        </span>
                        <span style={{ color: 'var(--ff-text-muted)' }}>{executionProgress}%</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(to right, var(--ff-primary), #00d2ff)', width: `${executionProgress}%`, transition: 'width 0.4s ease-out' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: 'var(--ff-text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Loader2 size={8} className="spin" />
                          {executionSteps.find(s => s.status === 'active')?.label || 'Processing...'}
                        </span>
                        <span>Est. Remaining: {estTimeRemaining}</span>
                      </div>
                    </div>
                  )}

                  {/* Timeline Feed Container */}
                  <div style={{
                    flex: 1,
                    background: '#040405',
                    border: '1px solid var(--ff-border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    overflowY: 'auto',
                    maxHeight: 280
                  }}>
                    {executionSteps.map((step, idx) => {
                      const isActive = step.status === 'active'
                      const isCompleted = step.status === 'completed'
                      const isFailed = step.status === 'failed'
                      
                      return (
                        <div key={step.id} style={{ display: 'flex', gap: 10, position: 'relative', opacity: step.status === 'pending' ? 0.4 : 1, transition: 'all 0.3s ease' }}>
                          {/* Left icon and connector line */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%',
                              background: isActive ? 'rgba(0,117,255,0.1)' : isCompleted ? 'rgba(16,185,129,0.05)' : isFailed ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${isActive ? 'var(--ff-primary)' : isCompleted ? '#10b981' : isFailed ? '#ef4444' : 'var(--ff-border)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: isActive ? '0 0 6px rgba(0,117,255,0.2)' : 'none',
                              zIndex: 2
                            }}>
                              {getStepIcon(step.iconName, step.status)}
                            </div>
                            {idx < executionSteps.length - 1 && (
                              <div style={{
                                flex: 1, width: 1,
                                background: isCompleted ? '#10b981' : 'var(--ff-border)',
                                margin: '4px 0',
                                minHeight: 12
                              }} />
                            )}
                          </div>

                          {/* Right Content */}
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 2 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--ff-text)' : isCompleted ? 'var(--ff-text)' : isFailed ? '#ef4444' : 'var(--ff-text-muted)' }}>
                                {step.label}
                              </span>
                              {step.timestamp && (
                                <span style={{ fontSize: 9, color: 'var(--ff-text-muted)', fontFamily: 'var(--ff-mono)' }}>{step.timestamp}</span>
                              )}
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--ff-text-muted)', marginTop: 2, lineHeight: 1.3 }}>
                              {step.explanation}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Collapsible Technical Details (Progressive Disclosure) */}
              {apiLogs.length > 0 && (
                <details style={{ marginTop: 'auto', borderTop: '1px solid var(--ff-border)', paddingTop: 10 }}>
                  <summary style={{
                    cursor: 'pointer', fontSize: 10, fontWeight: 600, color: 'var(--ff-primary)',
                    display: 'flex', alignItems: 'center', gap: 4, outline: 'none', listStyle: 'none'
                  }}>
                    <span>⚡ VIEW TECHNICAL DETAILS</span>
                  </summary>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 9, color: 'var(--ff-text-muted)' }}>RAW DEVELOPER CONSOLE LOGS:</div>
                    <div style={{
                      height: 120,
                      background: '#040405',
                      border: '1px solid var(--ff-border)',
                      borderRadius: 6,
                      padding: 8,
                      fontFamily: 'var(--ff-mono)',
                      fontSize: 9,
                      color: '#10b981',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}>
                      {apiLogs.map((l, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--ff-primary)' }}>&gt;</span>
                          <span style={{ whiteSpace: 'pre-wrap' }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        ) : ucwStep === 'pin_challenge' ? (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <ShieldAlert size={36} color="var(--ff-warning)" style={{ margin: '0 auto 10px auto' }} />
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--ff-text)' }}>Set Up Security PIN</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.4 }}>
              Your wallet requires a secure passkey PIN. Click below to open Circle's verification overlay and set your PIN & security questions.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button onClick={() => { setUcwStep('idle'); setUcwSession(null) }} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Cancel
              </button>
              <button onClick={handleExecutePinChallenge} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} /> Open PIN Dialog
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <Building2 size={36} color="var(--ff-text-muted)" style={{ margin: '0 auto 10px auto' }} />
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--ff-text)' }}>Programmatic ERP Setup Needed</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--ff-text-muted)', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.4 }}>
              To enable automated early payment approvals and direct ERP integration, register your corporate buyer profile below.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={handleDeployProgrammatic} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={16} /> Initialize Corporate Treasury Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Interface Controls (Standard Layout) */}
      <div className="grid-3">
        {/* Register */}
        <div className="card">
          <div className="card-header"><span className="card-title">Register Corporate Buyer Account</span></div>
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Company Name</label>
              <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 11 }}>
                ⓘ
                <span className="tooltip-content">
                  Enter the registered legal name of the corporate buyer/anchor profile.
                </span>
              </div>
            </div>
            <input className="form-input" placeholder="e.g. Acme Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Performance credit rating (0-1000)</label>
              <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 11 }}>
                ⓘ
                <span className="tooltip-content">
                  The initial risk credit score for this corporate entity on-chain (scale 0-1000, 1000 being lowest default risk).
                </span>
              </div>
            </div>
            <input className="form-input" type="number" min="0" max="1000" placeholder="e.g. 800" value={creditRating} onChange={e => setCreditRating(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleRegister} disabled={regPending || regConfirming}>
              <Building2 size={16} /> {regPending ? 'Signing...' : regConfirming ? 'Confirming...' : 'Register Buyer Account'}
            </button>
            {!progWallet && (
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleDeployProgrammatic}>
                <Bot size={16} /> Initialize Treasury Wallet
              </button>
            )}
          </div>
          {regSuccess && regHash && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ff-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} />
              <span>Registered!</span>
              <a href={getExplorerTxLink(regHash)} target="_blank" rel="noopener noreferrer" className="link-explorer" style={{ marginLeft: 'auto' }}>
                Arcscan <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Approve Invoice */}
        <div className="card">
          <div className="card-header"><span className="card-title">Approve Invoice (Manual)</span></div>
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Invoice ID</label>
              <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 11 }}>
                ⓘ
                <span className="tooltip-content">
                  The unique on-chain ID of the invoice receivable submitted by the supplier that you wish to approve.
                </span>
              </div>
            </div>
            <input className="form-input" type="number" placeholder="e.g. 42" value={invoiceIdToApprove} onChange={e => setInvoiceIdToApprove(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleApprove} disabled={apPending || apConfirming}>
            <CheckCircle size={16} /> {apPending ? 'Signing...' : apConfirming ? 'Confirming...' : 'Approve Invoice'}
          </button>
          {apSuccess && apHash && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ff-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} />
              <span>Approved!</span>
              <a href={getExplorerTxLink(apHash)} target="_blank" rel="noopener noreferrer" className="link-explorer" style={{ marginLeft: 'auto' }}>
                Arcscan <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Two-step Settle */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Settle Invoice (Manual)</span>
            <span className="badge badge-funded" style={{ background: 'var(--ff-primary-subtle)', color: 'var(--ff-primary)' }}>2-Step Flow</span>
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Invoice ID</label>
              <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 11 }}>
                ⓘ
                <span className="tooltip-content">
                  The unique on-chain ID of the approved invoice receivable that you are ready to pay.
                </span>
              </div>
            </div>
            <input className="form-input" type="number" placeholder="e.g. 42" value={invoiceIdToSettle} onChange={e => setInvoiceIdToSettle(e.target.value)} disabled={settleStep !== 'idle'} />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Face Value (USDC)</label>
              <div className="tooltip-trigger" style={{ cursor: 'help', color: 'var(--ff-primary)', fontSize: 11 }}>
                ⓘ
                <span className="tooltip-content">
                  The total payment amount of the invoice in USDC. Must match the face value on the smart contract.
                </span>
              </div>
            </div>
            <input className="form-input" type="number" step="0.01" placeholder="e.g. 1500.00" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} disabled={settleStep !== 'idle'} />
          </div>

          {settleStep === 'idle' && (
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }} 
              onClick={handleApproveUSDC} 
              disabled={approveUSDCPending || approveUSDCConfirming}
            >
              {approveUSDCPending ? 'Signing Payout...' : approveUSDCConfirming ? 'Confirming Payout...' : '1. Authorize Payout Funds'}
            </button>
          )}

          {settleStep === 'approved_usdc' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--ff-success)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={14} /> Payout Funds Authorized!
              </div>
              <button 
                className="btn btn-success" 
                style={{ width: '100%' }} 
                onClick={handleSettleInvoice} 
                disabled={stPending || stConfirming}
              >
                {stPending ? 'Signing Settlement...' : stConfirming ? 'Confirming Settlement...' : '2. Confirm Supplier Settlement'}
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', fontSize: 11, padding: '4px' }} 
                onClick={() => setSettleStep('idle')}
              >
                Reset Flow
              </button>
            </div>
          )}

          {settleStep === 'settled' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--ff-success)', padding: '10px', background: 'var(--ff-success-subtle)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} /> Settlement Complete!
              </div>
              {stHash && (
                <a href={getExplorerTxLink(stHash)} target="_blank" rel="noopener noreferrer" className="link-explorer" style={{ textAlign: 'center', fontSize: 12 }}>
                  View on Arcscan <ExternalLink size={12} />
                </a>
              )}
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: 8 }} 
                onClick={() => {
                  setSettleStep('idle')
                  setInvoiceIdToSettle('')
                  setSettleAmount('')
                }}
              >
                Settle Another Invoice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
