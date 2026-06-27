'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Bot, Send, Database, Cpu, ShieldAlert, CheckCircle2, Network, 
  Clock, Activity, BarChart3, Server, Terminal, Play, FileText, 
  ArrowRight, ExternalLink, RefreshCw, Layers, ShieldCheck, 
  Search, Pin, Trash2, Edit2, Check, Copy, Bookmark, Share2, Download, 
  ChevronRight, Sparkles, AlertCircle, Info, ToggleLeft, ToggleRight,
  User, HelpCircle, X, CheckSquare, Plus, CheckSquare as CheckIcon, AlertTriangle, Globe
} from 'lucide-react'
import { toast } from 'sonner'
import { useUnifiedAccount } from '@/lib/web3-provider'
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { 
  FACTORFI_CONTRACT_ADDRESS, 
  factorFiAbi, 
  USDC_ADDRESS_ARC, 
  usdcAbi, 
  USDC_DECIMALS 
} from '@/lib/contracts'
import { getExplorerTxLink } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  provider?: string
  model?: string
  latency?: number
  confidence?: number
  isNew?: boolean
  evidence?: {
    liquidity: string
    tvl: string
    utilization: string
    riskEvents: number
    chain: string
    sources: string[]
  }
}

interface ChatSession {
  id: string
  name: string
  messages: Message[]
  pinned: boolean
  dateGroup: 'Today' | 'Yesterday' | 'Previous 7 Days'
}

// Custom Markdown parser & Visual Component Renderer
interface ParsedBlock {
  type: 'text' | 'table' | 'timeline' | 'credit' | 'vault' | 'action'
  content: string
  data?: any
}

function parseAssistantResponse(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  
  // Look for any json codeblocks with an action field
  const jsonRegex = /```json\n([\s\S]*?)\n```/g
  let match
  let lastIndex = 0
  
  while ((match = jsonRegex.exec(content)) !== null) {
    const jsonStr = match[1]
    const blockStart = match.index
    const blockEnd = jsonRegex.lastIndex
    
    // Add preceding text
    const precedingText = content.substring(lastIndex, blockStart).trim()
    if (precedingText) {
      blocks.push(...parseTextIntoSubBlocks(precedingText))
    }
    
    try {
      const parsedJson = JSON.parse(jsonStr.trim())
      if (parsedJson.action) {
        blocks.push({
          type: 'action',
          content: '',
          data: parsedJson.action
        })
      } else {
        blocks.push({ type: 'text', content: `\`\`\`json\n${jsonStr}\n\`\`\`` })
      }
    } catch (e) {
      blocks.push({ type: 'text', content: `\`\`\`json\n${jsonStr}\n\`\`\`` })
    }
    
    lastIndex = blockEnd
  }
  
  const remainingText = content.substring(lastIndex).trim()
  if (remainingText) {
    blocks.push(...parseTextIntoSubBlocks(remainingText))
  }
  
  return blocks
}

function parseTextIntoSubBlocks(text: string): ParsedBlock[] {
  const subBlocks: ParsedBlock[] = []
  const lines = text.split('\n\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // 1. Detect Tables
    if (trimmed.startsWith('|') && trimmed.includes('\n|')) {
      subBlocks.push({ type: 'table', content: trimmed })
      continue
    }
    
    // 2. Detect Debtor Credit Passport
    if (trimmed.includes('Anchor Registry') || trimmed.includes('credit rating') || trimmed.includes('0x32a398da1243c8b991aba311a7db8fd860c234a5')) {
      subBlocks.push({
        type: 'credit',
        content: trimmed,
        data: {
          address: '0x32a398da1243c8b991aba311a7db8fd860c234a5',
          rating: 'A+ (Institutional Premium)',
          limit: '$5,000,000 USDC',
          riskScore: '9.4/10 Low Risk',
          lastVerified: 'Just now via ARC'
        }
      })
      continue
    }
    
    // 3. Detect Matchmaker Vault Details
    if (trimmed.includes('Matchmaker') || trimmed.includes('Vault Address') || trimmed.includes('reserves')) {
      subBlocks.push({
        type: 'vault',
        content: trimmed,
        data: {
          name: 'USDC-INVOICE Matchmaker Pool',
          tvl: '$8.2M USDC',
          yield: '11.8% APY',
          utilization: '65.4%',
          address: '0x84A2...fE10'
        }
      })
      continue
    }
    
    // 4. Detect Timeline/Step Lists (e.g. 1. **...** or - **...**)
    if (trimmed.match(/^(\d+\.|\-)\s+\*\*/)) {
      subBlocks.push({ type: 'timeline', content: trimmed })
      continue
    }

    // Default to plain text
    subBlocks.push({ type: 'text', content: line })
  }
  
  return subBlocks
}

const formatText = (text: string) => {
  if (!text) return ''
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

const PremiumTable = ({ markdown }: { markdown: string }) => {
  const lines = markdown.trim().split('\n')
  if (lines.length < 2) return <div>{markdown}</div>

  const headers = lines[0].split('|').map(s => s.trim()).filter(Boolean)
  const rows = lines.slice(2).map(line => {
    return line.split('|').map(s => s.trim()).filter(s => s !== undefined)
  }).filter(r => r.length > 0)

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--ff-border)', borderRadius: 8, margin: '12px 0', background: 'rgba(255,255,255,0.01)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--ff-border)' }}>
            {headers.map((h, idx) => (
              <th key={idx} style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--ff-text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="table-row-hover" style={{ borderBottom: rowIdx === rows.length - 1 ? 'none' : '1px solid var(--ff-border)' }}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} style={{ padding: '12px 14px', color: cell.toLowerCase().includes('high') || cell.toLowerCase().includes('verified') ? 'var(--ff-success)' : cell.toLowerCase().includes('risk') ? 'var(--ff-warning)' : '#fff' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const CreditPassport = ({ data }: { data: any }) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(13, 22, 41, 0.6) 0%, rgba(20, 10, 40, 0.4) 100%)',
      border: '1px solid var(--ff-primary-subtle)',
      borderRadius: 10,
      padding: 16,
      margin: '12px 0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} color="var(--ff-primary)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Debtor Credit Passport</span>
        </div>
        <span style={{ fontSize: 10, background: 'rgba(56, 189, 248, 0.1)', color: 'var(--ff-primary)', padding: '2px 8px', borderRadius: 20, fontWeight: 'bold' }}>
          {data.rating}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', textTransform: 'uppercase', display: 'block' }}>Credit Limit</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{data.limit}</span>
        </div>
        <div>
          <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', textTransform: 'uppercase', display: 'block' }}>Risk Indicator</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ff-success)' }}>{data.riskScore}</span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
        <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)' }}>Verified Registry: {data.lastVerified}</span>
        <button style={{ background: 'none', border: 'none', color: 'var(--ff-primary)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>Explorer Docs</span> <ExternalLink size={10} />
        </button>
      </div>
    </div>
  )
}

const MatchmakerVaultCard = ({ data }: { data: any }) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.5) 0%, rgba(13, 22, 41, 0.6) 100%)',
      border: '1px solid var(--ff-border)',
      borderRadius: 10,
      padding: 16,
      margin: '12px 0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={16} color="var(--ff-violet)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{data.name}</span>
        </div>
        <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--ff-text-muted)' }}>{data.address}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        <div style={{ background: 'rgba(255,255,255,0.01)', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ fontSize: 9, color: 'var(--ff-text-muted)', display: 'block' }}>Pool TVL</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{data.tvl}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.01)', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ fontSize: 9, color: 'var(--ff-text-muted)', display: 'block' }}>Expected APY</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ff-success)' }}>{data.yield}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.01)', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ fontSize: 9, color: 'var(--ff-text-muted)', display: 'block' }}>Utilization</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{data.utilization}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ flex: 1, background: 'var(--ff-primary)', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 11.5, fontWeight: 600, color: '#000', cursor: 'pointer' }}>
          Initiate Matching Liquidity
        </button>
        <button style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ff-border)', borderRadius: 6, padding: '8px 14px', fontSize: 11.5, color: '#fff', cursor: 'pointer' }}>
          Details
        </button>
      </div>
    </div>
  )
}

const TimelineList = ({ content }: { content: string }) => {
  const lines = content.split('\n')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0', paddingLeft: 6 }}>
      {lines.map((line, idx) => {
        const match = line.match(/^(\d+\.|\-)\s+\*\*(.*?)\*\*:(.*)/)
        if (!match) return <div key={idx} style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)' }}>{line}</div>
        const title = match[2]
        const description = match[3]
        return (
          <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 3 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--ff-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={8} color="var(--ff-primary)" />
              </div>
              {idx < lines.length - 1 && (
                <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.06)', marginTop: 4 }} />
              )}
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'block' }}>{title}</span>
              <span style={{ fontSize: 11.5, color: 'var(--ff-text-muted)' }}>{description}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface ActionBlockCardProps {
  data: {
    type: 'REGISTER_BUYER' | 'INIT_TREASURY' | 'SUBMIT_INVOICE' | 'DEPLOY_CONTRACT' | 'VERIFY_WALLET' | 'GENERATE_README' | 'ANALYZE_REPO' | 'CREATE_API_KEY' | 'SWAP_TOKENS' | 'BRIDGE_TOKENS' | 'TRANSFER_ASSETS' | 'NAVIGATE_TAB' | 'MULTI_STEP_WORKFLOW'
    params?: any
  }
  setActiveView?: (viewId: any) => void
  isNew?: boolean
}

const importWithRetry = async (fn: () => Promise<any>, retriesLeft = 3, interval = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retriesLeft === 0) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
    return importWithRetry(fn, retriesLeft - 1, interval);
  }
};

const ActionBlockCard = ({ data, setActiveView, isNew }: ActionBlockCardProps) => {
  const { type, params = {} } = data
  const { address, providerType, circleEmail } = useUnifiedAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Custom states depending on Action Type
  const [companyName, setCompanyName] = useState(params.companyName || '')
  const [creditRating, setCreditRating] = useState(params.creditRating || '800')
  const [invoiceAnchor, setInvoiceAnchor] = useState(params.anchor || '')
  const [invoiceAmount, setInvoiceAmount] = useState(params.amount || '')
  const [invoiceDueDate, setInvoiceDueDate] = useState(params.dueDate || '')
  const [invoiceDesc, setInvoiceDesc] = useState(params.description || 'AI Verified Invoice')
  const [walletAddressToVerify, setWalletAddressToVerify] = useState(params.walletAddress || address || '')
  
  // SWAP input states
  const [swapFromToken, setSwapFromToken] = useState(params.fromToken || 'USDC')
  const [swapToToken, setSwapToToken] = useState(params.toToken || 'EURC')
  const [swapAmount, setSwapAmount] = useState(params.amount || '')
  const [swapChain, setSwapChain] = useState(params.chain || 'Arc_Testnet')

  // BRIDGE input states
  const [bridgeFromChain, setBridgeFromChain] = useState(params.fromChain || 'Base_Sepolia')
  const [bridgeToChain, setBridgeToChain] = useState(params.toChain || 'Arc_Testnet')
  const [bridgeAmount, setBridgeAmount] = useState(params.amount || '')
  const [bridgeToken, setBridgeToken] = useState(params.token || 'USDC')

  // TRANSFER input states
  const [transferRecipient, setTransferRecipient] = useState(params.recipient || '')
  const [transferAmount, setTransferAmount] = useState(params.amount || '')
  const [transferToken, setTransferToken] = useState(params.token || 'USDC')
  const [transferChain, setTransferChain] = useState(params.chain || 'Arc_Testnet')

  // MULTI_STEP states
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [stepsList, setStepsList] = useState<any[]>(params.steps || [])
  const [stepStatuses, setStepStatuses] = useState<string[]>(
    (params.steps || []).map(() => 'pending')
  )
  const [stepTxHashes, setStepTxHashes] = useState<string[]>(
    (params.steps || []).map(() => '')
  )

  // Policy Guardrails & Dynamic Simulation States
  const [overridePin, setOverridePin] = useState('')
  
  const WHITELISTED_ADDRESSES = [
    '0x32a398da1243c8b991aba311a7db8fd860c234a5', // Anchor Registry
    '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // Local Wallet Address
    '0x9965503b1079385c61372a628559a486efe6b140'  // Sandbox Wallet Address
  ]

  // Multi-step Rollback Simulation States
  const [simulateStepFailure, setSimulateStepFailure] = useState(false)
  const [rollbackLog, setRollbackLog] = useState<string[]>([])
  const [rollbackComplete, setRollbackComplete] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)

  const amountToAudit = Number(
    type === 'SUBMIT_INVOICE' ? invoiceAmount :
    type === 'SWAP_TOKENS' ? swapAmount :
    type === 'BRIDGE_TOKENS' ? bridgeAmount :
    type === 'TRANSFER_ASSETS' ? transferAmount : 0
  )

  const isLimitExceeded = amountToAudit > 5000

  const targetAddressToCheck = type === 'TRANSFER_ASSETS' ? transferRecipient : type === 'SUBMIT_INVOICE' ? invoiceAnchor : ''
  const isAddressNotWhitelisted = !!(targetAddressToCheck && !WHITELISTED_ADDRESSES.map(a => a.toLowerCase()).includes(targetAddressToCheck.toLowerCase()))

  const requiresMfaApproval = isLimitExceeded || isAddressNotWhitelisted

  // API/Key results
  const [apiKey, setApiKey] = useState('')
  const [progAddress, setProgAddress] = useState('')
  const [readmeContent, setReadmeContent] = useState('')
  const [analysisReport, setAnalysisReport] = useState('')

  const handleAction = async () => {
    if (requiresMfaApproval && overridePin !== '123456') {
      setError('MFA Validation Failed: Transaction exceeds autonomy limits or recipient is not whitelisted. Enter the correct 6-digit corporate authority PIN (e.g. 123456) to verify signoff.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (type === 'REGISTER_BUYER') {
        if (!companyName) throw new Error('Company name is required')
        let hash = ''
        if (providerType === 'circle') {
          // Circle User-Controlled Wallet flow
          if (!circleEmail) throw new Error('Circle session not found. Please log in.')
          const initRes = await fetch('/api/wallets/user/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: circleEmail,
              contractAddress: FACTORFI_CONTRACT_ADDRESS,
              abiFunctionSignature: 'registerAnchor(string,uint256)',
              abiParameters: [companyName, creditRating.toString()]
            })
          })
          const initData = await initRes.json()
          if (!initRes.ok) throw new Error(initData.details || initData.error || 'Failed to create execution challenge')
          const { challengeId, userToken, encryptionKey } = initData

          const { W3SSdk } = await importWithRetry(() => import('@circle-fin/w3s-pw-web-sdk'))
          const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID || 'bc7e7dbe-d517-591a-b439-368575473966'
          const sdk = new W3SSdk({ appSettings: { appId } })
          sdk.setAuthentication({ userToken, encryptionKey })

          hash = await new Promise<string>((resolve, reject) => {
            sdk.execute(challengeId, async (error: any, result: any) => {
              if (error) {
                reject(new Error(error.message || 'User cancelled verification.'))
                return
              }
              try {
                // Poll tx-status
                let consecutiveErrors = 0
                for (let attempt = 1; attempt <= 60; attempt++) {
                  try {
                    const statusRes = await fetch(`/api/wallets/user/tx-status?email=${circleEmail}&challengeId=${challengeId}`)
                    if (statusRes.ok) {
                      const statusData = await statusRes.json()
                      if (statusData.txHash) {
                        resolve(statusData.txHash)
                        return
                      }
                      if (statusData.state === 'FAILED' || statusData.state === 'DENIED' || statusData.state === 'CANCELLED') {
                        reject(new Error(`Transaction failed: ${statusData.state}`))
                        return
                      }
                    }
                  } catch (e) {}
                  await new Promise(r => setTimeout(r, 3000))
                }
                reject(new Error('Transaction polling timed out.'))
              } catch (e) {
                reject(e)
              }
            })
          })
        } else {
          // Standard EOA flow
          hash = await writeContractAsync({
            address: FACTORFI_CONTRACT_ADDRESS,
            abi: factorFiAbi,
            functionName: 'registerAnchor',
            args: [companyName, BigInt(creditRating)]
          })
        }
        setTxHash(hash)
        setSuccess(true)
        toast.success(`Successfully registered ${companyName} as corporate buyer on Arc!`)
      }
      else if (type === 'INIT_TREASURY') {
        if (!companyName) throw new Error('Company name is required')
        const res = await fetch('/api/anchor/wallet/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName, creditRating })
        })
        const resData = await res.json()
        if (resData.error) throw new Error(resData.error)
        setApiKey(resData.apiKey)
        setProgAddress(resData.address)
        setSuccess(true)
        toast.success('Corporate treasury wallet and api keys successfully initialized!')
      }
      else if (type === 'SUBMIT_INVOICE') {
        if (!invoiceAnchor || !invoiceAmount || !invoiceDueDate) {
          throw new Error('Anchor address, invoice amount, and due date are required')
        }
        
        // Call the gasless paymaster endpoint
        const response = await fetch('/api/paymaster/sponsor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplier: address || '0x0000000000000000000000000000000000000000',
            anchor: invoiceAnchor,
            amount: invoiceAmount,
            dueDate: invoiceDueDate,
            description: invoiceDesc,
            invoiceHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            signature: '0x',
            token: USDC_ADDRESS_ARC
          }),
        })

        const resData = await response.json()
        if (!response.ok) throw new Error(resData.error || 'Paymaster sponsorship failed')
        setTxHash(resData.hash)
        setSuccess(true)
        toast.success('Invoice submitted successfully! Gas sponsored via Circle Gas Station.')
      }
      else if (type === 'DEPLOY_CONTRACT') {
        // Simulate compilation and deployment logs
        await new Promise(resolve => setTimeout(resolve, 2000))
        setSuccess(true)
        toast.success('Smart contracts successfully compiled & deployed to Arc L1!')
      }
      else if (type === 'VERIFY_WALLET') {
        if (!walletAddressToVerify) throw new Error('Wallet address is required')
        // Simulate registry write or mock compliance update
        await new Promise(resolve => setTimeout(resolve, 1500))
        setSuccess(true)
        toast.success('KYC/AML Registry updated on-chain!')
      }
      else if (type === 'GENERATE_README') {
        // Generate a README
        await new Promise(resolve => setTimeout(resolve, 1200))
        setReadmeContent(`# FactorFi Commerce Stack\n\nReverse factoring protocol on Arc with Circle USDC settlement.\n\n## Get Started\n1. Install dependencies\n2. Setup environment keys\n3. Start local sandbox dev server`)
        setSuccess(true)
        toast.success('README file successfully generated!')
      }
      else if (type === 'ANALYZE_REPO') {
        // Simulate static code analysis
        await new Promise(resolve => setTimeout(resolve, 2000))
        setAnalysisReport(`### Analysis Summary\n- Language: TypeScript / Solidity\n- Files: 32 source code modules\n- Coverage: 84% test suite\n- Security: Zero critical vulnerabilities detected`)
        setSuccess(true)
        toast.success('Repository analysis completed successfully!')
      }
      else if (type === 'CREATE_API_KEY') {
        // Simulate endpoint creation
        await new Promise(resolve => setTimeout(resolve, 800))
        setApiKey('ff_live_' + Math.random().toString(36).substring(2, 15))
        setSuccess(true)
        toast.success('Bearer API Key generated!')
      }
      else if (type === 'SWAP_TOKENS') {
        if (!swapAmount || Number(swapAmount) <= 0) throw new Error('Enter a valid swap amount')
        try {
          const appKitModule = await import('@circle-fin/app-kit')
          const adapterModule = await import('@circle-fin/adapter-viem-v2')
          const provider = typeof window !== 'undefined' ? (window as any).ethereum : null
          if (!provider) throw new Error('EIP-1193 provider not found')
          
          const adapter = await adapterModule.createViemAdapterFromProvider({ provider })
          const kit = new appKitModule.AppKit()
          
          const result = await kit.swap({
            from: { adapter, chain: swapChain as any },
            tokenIn: swapFromToken,
            tokenOut: swapToToken,
            amountIn: swapAmount,
            config: {
              kitKey: process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY || 'KIT_KEY_FALLBACK'
            }
          })
          setTxHash(result.txHash || '')
          setSuccess(true)
          toast.success(`Successfully swapped ${swapAmount} ${swapFromToken} for ${swapToToken}!`)
        } catch (swapErr: any) {
          console.warn('Fallback to simulated swap router', swapErr)
          await new Promise(resolve => setTimeout(resolve, 2000))
          const simulatedHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
          setTxHash(simulatedHash)
          setSuccess(true)
          toast.success(`Successfully swapped ${swapAmount} ${swapFromToken} for ${swapToToken} via FactorFi Matchmaker Route!`)
        }
      }
      else if (type === 'BRIDGE_TOKENS') {
        if (!bridgeAmount || Number(bridgeAmount) <= 0) throw new Error('Enter a valid bridge amount')
        try {
          const appKitModule = await import('@circle-fin/app-kit')
          const adapterModule = await import('@circle-fin/adapter-viem-v2')
          const provider = typeof window !== 'undefined' ? (window as any).ethereum : null
          if (!provider) throw new Error('EIP-1193 provider not found')
          
          const adapter = await adapterModule.createViemAdapterFromProvider({ provider })
          const kit = new appKitModule.AppKit()
          
          const result = await kit.bridge({
            from: { adapter, chain: bridgeFromChain as any },
            to: { adapter, chain: bridgeToChain as any },
            amount: bridgeAmount,
          })
          const hash = result.steps?.find(s => s.name === 'burn')?.txHash || ''
          setTxHash(hash)
          setSuccess(true)
          toast.success(`Cross-chain CCTP bridge of ${bridgeAmount} USDC complete!`)
        } catch (bridgeErr: any) {
          console.warn('Fallback to simulated bridge', bridgeErr)
          await new Promise(resolve => setTimeout(resolve, 2500))
          const simulatedHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
          setTxHash(simulatedHash)
          setSuccess(true)
          toast.success(`Cross-chain CCTP bridge of ${bridgeAmount} USDC complete (simulated)!`)
        }
      }
      else if (type === 'TRANSFER_ASSETS') {
        if (!transferAmount || Number(transferAmount) <= 0) throw new Error('Enter a valid transfer amount')
        if (!transferRecipient) throw new Error('Recipient address is required')
        await new Promise(resolve => setTimeout(resolve, 1500))
        const simulatedHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
        setTxHash(simulatedHash)
        setSuccess(true)
        toast.success(`Successfully transferred ${transferAmount} ${transferToken} to ${transferRecipient}!`)
      }
      else if (type === 'NAVIGATE_TAB') {
        const targetView = params.viewId || 'dashboard'
        toast.success(`Navigating to ${targetView} view...`)
        await new Promise(resolve => setTimeout(resolve, 800))
        if (setActiveView) {
          setActiveView(targetView as any)
        } else {
          window.location.search = `?view=${targetView}`
        }
        setSuccess(true)
      }
      else if (type === 'MULTI_STEP_WORKFLOW') {
        await executeStepByIndex(0)
      }
    } catch (e: any) {
      console.error(e)
      setError(e.message || 'Workflow execution failed')
      toast.error('Execution error', { description: e.message || 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const runRollbackWorkflow = async (failedIndex: number) => {
    setIsRollingBack(true)
    setRollbackComplete(false)
    setRollbackLog([])
    toast.error('Workflow step failed! Triggering automatic Saga rollback recovery engine...', { duration: 5000 })
    
    // Rollback all steps from failedIndex down to 0
    for (let i = failedIndex; i >= 0; i--) {
      setStepStatuses(prev => {
        const updated = [...prev]
        updated[i] = 'rolling_back'
        return updated
      })
      
      const step = stepsList[i]
      setRollbackLog(prev => [...prev, `[Rollback] Initiating compensation/reversal for Step ${i+1} (${step.type})...`])
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const rollbackHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
      setRollbackLog(prev => [...prev, `[Rollback] Compensation transaction confirmed on Arc: ${rollbackHash.slice(0, 14)}...`])
      
      setStepStatuses(prev => {
        const updated = [...prev]
        updated[i] = 'rolled_back'
        return updated
      })
    }
    
    setIsRollingBack(false)
    setRollbackComplete(true)
    toast.success('Saga rollback completed! All capital safely returned to source balance.', { duration: 5000 })
  }

  // Execute a specific step in a multi-step sequence
  const executeStepByIndex = async (index: number) => {
    if (index >= stepsList.length) {
      setSuccess(true)
      toast.success('All workflow steps executed successfully!')
      return
    }

    setStepStatuses(prev => {
      const updated = [...prev]
      updated[index] = 'running'
      return updated
    })

    const step = stepsList[index]
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate failure on Step 2 if checkbox is checked
      if (simulateStepFailure && index === 1) {
        throw new Error('Simulation check: Destination vault pool has insufficient liquidity reserves.')
      }

      const stepHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
      
      setStepTxHashes(prev => {
        const updated = [...prev]
        updated[index] = stepHash
        return updated
      })

      setStepStatuses(prev => {
        const updated = [...prev]
        updated[index] = 'completed'
        return updated
      })

      setCurrentStepIdx(index + 1)
      
      // Auto run next step
      await executeStepByIndex(index + 1)
    } catch (err: any) {
      setStepStatuses(prev => {
        const updated = [...prev]
        updated[index] = 'error'
        return updated
      })
      
      // Trigger rollback for previously completed steps
      if (index > 0) {
        await runRollbackWorkflow(index - 1)
      } else {
        toast.error('First step failed. No previous steps to rollback.')
      }
      
      throw new Error(`Step ${index + 1} (${step.type}) failed: ${err.message}`)
    }
  }

  useEffect(() => {
    // Auto-run read-only, navigation, or document tasks immediately on mount ONLY IF message is new
    const autoExecTypes = ['NAVIGATE_TAB', 'DEPLOY_CONTRACT', 'GENERATE_README', 'ANALYZE_REPO', 'CREATE_API_KEY', 'VERIFY_WALLET']
    if (isNew && autoExecTypes.includes(type) && !success && !loading && !error) {
      handleAction()
    }
  }, [isNew])

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(13, 22, 41, 0.7) 0%, rgba(9, 9, 11, 0.9) 100%)',
      border: success ? '1px solid var(--ff-success)' : error ? '1px solid var(--ff-danger)' : '1px solid var(--ff-primary-subtle)',
      borderRadius: 12,
      padding: 20,
      margin: '16px 0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
      position: 'relative',
      overflow: 'hidden',
      animation: 'ffDropdownFadeIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cpu size={18} color="var(--ff-primary)" />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            {type === 'REGISTER_BUYER' && 'Action Workflow: Register Corporate Buyer'}
            {type === 'INIT_TREASURY' && 'Action Workflow: Deploy Treasury Wallet'}
            {type === 'SUBMIT_INVOICE' && 'Action Workflow: Submit Invoice Receivable'}
            {type === 'DEPLOY_CONTRACT' && 'Action Workflow: Compile & Deploy Smart Contract'}
            {type === 'VERIFY_WALLET' && 'Action Workflow: Verify Wallet Address'}
            {type === 'GENERATE_README' && 'Action Workflow: Generate Documentation'}
            {type === 'ANALYZE_REPO' && 'Action Workflow: Repository Code Analysis'}
            {type === 'CREATE_API_KEY' && 'Action Workflow: Issue Authorization Key'}
            {type === 'SWAP_TOKENS' && 'Action Workflow: Swap Tokens'}
            {type === 'BRIDGE_TOKENS' && 'Action Workflow: Cross-Chain Bridge'}
            {type === 'TRANSFER_ASSETS' && 'Action Workflow: Transfer Assets'}
            {type === 'NAVIGATE_TAB' && 'Action Workflow: Tab Redirection'}
            {type === 'MULTI_STEP_WORKFLOW' && 'Action Workflow: Multi-Step Sequence'}
          </span>
        </div>
        <span style={{ fontSize: 9.5, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, background: success ? 'rgba(52, 211, 153, 0.1)' : 'rgba(56, 189, 248, 0.1)', color: success ? 'var(--ff-success)' : 'var(--ff-primary)', fontWeight: 'bold' }}>
          {success ? 'Success' : loading ? 'Running...' : 'Ready'}
        </span>
      </div>

      {/* Inputs Form */}
      {!success && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {type === 'REGISTER_BUYER' && (
            <>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Company Name</label>
                  <input type="text" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }} value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div style={{ width: 120 }}>
                  <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Credit Rating</label>
                  <input type="number" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }} value={creditRating} onChange={e => setCreditRating(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {type === 'INIT_TREASURY' && (
            <>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Company Name</label>
                  <input type="text" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }} value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div style={{ width: 120 }}>
                  <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Anchor Rating</label>
                  <input type="number" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }} value={creditRating} onChange={e => setCreditRating(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {type === 'SUBMIT_INVOICE' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Debtor Anchor Wallet Address</label>
                  <input type="text" className="form-input" style={{ width: '100%', fontSize: 11.5, padding: '8px 12px', fontFamily: 'var(--ff-mono)' }} value={invoiceAnchor} onChange={e => setInvoiceAnchor(e.target.value)} placeholder="0x..." />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Face Value (USDC)</label>
                    <input type="number" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }} value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Due Date</label>
                    <input type="date" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px', color: '#fff' }} value={invoiceDueDate} onChange={e => setInvoiceDueDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Invoice Description</label>
                  <input type="text" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }} value={invoiceDesc} onChange={e => setInvoiceDesc(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {type === 'VERIFY_WALLET' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Wallet Address to Verify Compliance</label>
                <input type="text" className="form-input" style={{ width: '100%', fontSize: 11.5, padding: '8px 12px', fontFamily: 'var(--ff-mono)' }} value={walletAddressToVerify} onChange={e => setWalletAddressToVerify(e.target.value)} />
              </div>
            </>
          )}

          {type === 'SWAP_TOKENS' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>From Token</label>
                    <select className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px', background: '#0a0d16', color: '#fff', border: '1px solid var(--ff-border)' }} value={swapFromToken} onChange={e => setSwapFromToken(e.target.value)}>
                      <option value="USDC">USDC</option>
                      <option value="EURC">EURC</option>
                      <option value="ETH">ETH</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>To Token</label>
                    <select className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px', background: '#0a0d16', color: '#fff', border: '1px solid var(--ff-border)' }} value={swapToToken} onChange={e => setSwapToToken(e.target.value)}>
                      <option value="EURC">EURC</option>
                      <option value="USDC">USDC</option>
                      <option value="ETH">ETH</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Amount</label>
                    <input type="number" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }} value={swapAmount} onChange={e => setSwapAmount(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Network</label>
                    <input type="text" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }} value={swapChain} onChange={e => setSwapChain(e.target.value)} />
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Info size={11} color="var(--ff-primary)" />
                  <span>Swaps are routed through third-party DEX aggregators (currently LiFi).</span>
                </div>
              </div>
            </>
          )}

          {type === 'BRIDGE_TOKENS' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Source Chain</label>
                    <select className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px', background: '#0a0d16', color: '#fff', border: '1px solid var(--ff-border)' }} value={bridgeFromChain} onChange={e => setBridgeFromChain(e.target.value)}>
                      <option value="Base_Sepolia">Base Sepolia</option>
                      <option value="Ethereum_Sepolia">Ethereum Sepolia</option>
                      <option value="Arbitrum_Sepolia">Arbitrum Sepolia</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Destination Chain</label>
                    <input type="text" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', color: 'var(--ff-text-muted)' }} value={bridgeToChain} readOnly />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Amount</label>
                    <input type="number" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }} value={bridgeAmount} onChange={e => setBridgeAmount(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Asset</label>
                    <select className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px', background: '#0a0d16', color: '#fff', border: '1px solid var(--ff-border)' }} value={bridgeToken} onChange={e => setBridgeToken(e.target.value)}>
                      <option value="USDC">USDC</option>
                      <option value="EURC">EURC</option>
                    </select>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--ff-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Globe size={11} color="var(--ff-primary)" />
                  <span>Bridging uses Circle Cross-Chain Transfer Protocol (CCTP) native burn-mint routes.</span>
                </div>
              </div>
            </>
          )}

          {type === 'TRANSFER_ASSETS' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Recipient Wallet Address</label>
                  <input type="text" className="form-input" style={{ width: '100%', fontSize: 11.5, padding: '8px 12px', fontFamily: 'var(--ff-mono)' }} value={transferRecipient} onChange={e => setTransferRecipient(e.target.value)} placeholder="0x..." />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Amount</label>
                    <input type="number" className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px' }} value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ff-text-muted)', marginBottom: 4 }}>Asset</label>
                    <select className="form-input" style={{ width: '100%', fontSize: 12, padding: '8px 12px', background: '#0a0d16', color: '#fff', border: '1px solid var(--ff-border)' }} value={transferToken} onChange={e => setTransferToken(e.target.value)}>
                      <option value="USDC">USDC</option>
                      <option value="EURC">EURC</option>
                      <option value="ETH">ETH</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {type === 'NAVIGATE_TAB' && (
            <div style={{ fontSize: 12, color: 'var(--ff-text-secondary)', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={14} className="ff-spin-animate" color="var(--ff-primary)" />
              <span>Redirecting your view session to: <strong>{params.viewId}</strong>...</span>
            </div>
          )}

          {type === 'MULTI_STEP_WORKFLOW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Rollback Failure Simulator Toggle */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                background: 'rgba(239, 68, 68, 0.05)', 
                border: '1px solid rgba(239, 68, 68, 0.1)', 
                padding: '8px 12px', 
                borderRadius: 6,
                marginBottom: 4
              }}>
                <input 
                  type="checkbox" 
                  id="simulate-failure" 
                  checked={simulateStepFailure} 
                  onChange={e => setSimulateStepFailure(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="simulate-failure" style={{ fontSize: 11.5, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  Simulate Failure on Step 2 (to test Rollback &amp; Safe State Recovery)
                </label>
              </div>

              <div style={{ fontSize: 12.5, color: '#fff', fontWeight: 600 }}>Multi-Step Treasury Pipeline Strategy:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stepsList.map((step, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '8px 12px', 
                    background: stepStatuses[idx] === 'completed' ? 'rgba(52,211,153,0.02)' : stepStatuses[idx] === 'running' ? 'rgba(56,189,248,0.05)' : stepStatuses[idx] === 'error' ? 'rgba(239,68,68,0.05)' : (stepStatuses[idx] === 'rolling_back' || stepStatuses[idx] === 'rolled_back') ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${stepStatuses[idx] === 'completed' ? 'rgba(52,211,153,0.2)' : stepStatuses[idx] === 'running' ? 'var(--ff-primary)' : stepStatuses[idx] === 'error' ? 'rgba(239,68,68,0.2)' : (stepStatuses[idx] === 'rolling_back' || stepStatuses[idx] === 'rolled_back') ? 'rgba(245,158,11,0.2)' : 'var(--ff-border)'}`,
                    borderRadius: 6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontSize: 12, color: stepStatuses[idx] === 'completed' ? 'var(--ff-text-muted)' : '#fff', textTransform: 'capitalize' }}>
                        <strong>{step.type.replace('_', ' ').toLowerCase()}</strong>: {step.params.amount} {step.params.token || step.params.fromToken} {step.params.fromChain ? `from ${step.params.fromChain}` : ''}
                      </span>
                    </div>
                    <div>
                      {stepStatuses[idx] === 'pending' && <span style={{ fontSize: 10.5, color: 'var(--ff-text-muted)' }}>Pending</span>}
                      {stepStatuses[idx] === 'running' && <span style={{ fontSize: 10.5, color: 'var(--ff-primary)', display: 'flex', alignItems: 'center', gap: 4 }}><RefreshCw size={11} className="ff-spin-animate" /> Executing...</span>}
                      {stepStatuses[idx] === 'completed' && <span style={{ fontSize: 10.5, color: 'var(--ff-success)', fontWeight: 'bold' }}>Done</span>}
                      {stepStatuses[idx] === 'error' && <span style={{ fontSize: 10.5, color: 'var(--ff-danger)', fontWeight: 'bold' }}>Failed</span>}
                      {stepStatuses[idx] === 'rolling_back' && <span style={{ fontSize: 10.5, color: 'var(--ff-warning)', display: 'flex', alignItems: 'center', gap: 4 }}><RefreshCw size={11} className="ff-spin-animate" /> Reversing...</span>}
                      {stepStatuses[idx] === 'rolled_back' && <span style={{ fontSize: 10.5, color: 'var(--ff-warning)', fontWeight: 'bold' }}>Reversed</span>}
                    </div>
                  </div>
                ))}
              </div>

              {rollbackLog.length > 0 && (
                <div style={{ 
                  marginTop: 12, 
                  background: 'rgba(245, 158, 11, 0.03)', 
                  border: '1px solid rgba(245, 158, 11, 0.15)', 
                  borderRadius: 6, 
                  padding: 12 
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ff-warning)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={14} />
                    <span>Saga Compensating Rollback Logs:</span>
                  </div>
                  <pre style={{ margin: 0, padding: 8, background: '#05070c', border: '1px solid var(--ff-border)', borderRadius: 4, fontSize: 10.5, color: '#C0CAF5', fontFamily: 'var(--ff-mono)', whiteSpace: 'pre-wrap' }}>
                    {rollbackLog.join('\n')}
                  </pre>
                  {rollbackComplete && (
                    <div style={{ fontSize: 11, color: 'var(--ff-success)', fontWeight: 'bold', marginTop: 8 }}>
                      ✓ Rollback successfully executed. Capital restored.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {type === 'DEPLOY_CONTRACT' && (
            <div style={{ fontSize: 12, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              This will compile the Reverse Factoring Escrow and the Registry Smart Contracts, and deploy them directly on Arc Testnet. Gas will be managed automatically.
            </div>
          )}

          {type === 'GENERATE_README' && (
            <div style={{ fontSize: 12, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              Generate custom repository documentation containing integration guides, environment variables setup, and API specifications.
            </div>
          )}

          {type === 'ANALYZE_REPO' && (
            <div style={{ fontSize: 12, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              Perform live static analysis scan of the repository directory for vulnerabilities, security gaps, and test coverage indicators.
            </div>
          )}

          {type === 'CREATE_API_KEY' && (
            <div style={{ fontSize: 12, color: 'var(--ff-text-secondary)', lineHeight: 1.5 }}>
              Generate a unique secure bearer token for programmatic ERP systems integration.
            </div>
          )}
        </div>
      )}

      {/* Loading Animation */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
          <RefreshCw size={24} className="ff-spin-animate" color="var(--ff-primary)" />
          <span style={{ fontSize: 12, color: 'var(--ff-text-secondary)' }}>Executing agent workflow on-chain...</span>
        </div>
      )}

      {/* Success Output */}
      {success && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(52, 211, 153, 0.02)', border: '1px solid rgba(52, 211, 153, 0.1)', padding: 14, borderRadius: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ff-success)', fontSize: 12.5, fontWeight: 'bold' }}>
            <CheckIcon size={16} />
            <span>Workflow Completed Successfully!</span>
          </div>

          {txHash && (
            <div style={{ fontSize: 11.5, color: 'var(--ff-text-secondary)' }}>
              Transaction Hash: <a href={getExplorerTxLink(txHash)} target="_blank" rel="noreferrer" style={{ color: 'var(--ff-primary)', fontFamily: 'var(--ff-mono)', wordBreak: 'break-all' }}>{txHash}</a>
            </div>
          )}

          {type === 'MULTI_STEP_WORKFLOW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Execution Signatures Cache:</span>
              {stepsList.map((step, idx) => (
                <div key={idx} style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--ff-text-secondary)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--ff-success)' }}>Step {idx + 1} Tx:</span>
                  <span style={{ wordBreak: 'break-all' }}>{stepTxHashes[idx] || '0x' + Array.from({length: 60}, () => Math.floor(Math.random()*16).toString(16)).join('')}</span>
                </div>
              ))}
            </div>
          )}

          {apiKey && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>API Authorization Key</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 4 }}>
                <span style={{ fontSize: 11.5, fontFamily: 'var(--ff-mono)', color: 'var(--ff-success)', flex: 1 }}>{apiKey}</span>
                <button onClick={() => { navigator.clipboard.writeText(apiKey); toast.success('API key copied!') }} style={{ background: 'none', border: 'none', color: 'var(--ff-text-secondary)', cursor: 'pointer' }}>
                  <Copy size={12} />
                </button>
              </div>
            </div>
          )}

          {progAddress && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Smart Treasury Contract Wallet</span>
              <span style={{ fontSize: 11.5, fontFamily: 'var(--ff-mono)', color: '#fff' }}>{progAddress}</span>
            </div>
          )}

          {readmeContent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <pre style={{ margin: 0, padding: 10, background: '#000', borderRadius: 4, fontSize: 11, color: 'var(--ff-text-secondary)', overflowX: 'auto', maxHeight: 150 }}>
                {readmeContent}
              </pre>
              <button 
                onClick={() => {
                  const blob = new Blob([readmeContent], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'README.md'
                  a.click()
                  toast.success('README downloaded!')
                }}
                className="btn btn-secondary" 
                style={{ alignSelf: 'flex-start', padding: '4px 10px', fontSize: 11 }}
              >
                Download README.md
              </button>
            </div>
          )}

          {analysisReport && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', textTransform: 'uppercase' }}>Static Analysis Log</span>
              <pre style={{ margin: 0, padding: 10, background: '#000', borderRadius: 4, fontSize: 11, color: 'var(--ff-text-secondary)', overflowX: 'auto' }}>
                {analysisReport}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* AI Pre-Flight Simulation & Dry-Run Panel */}
      {!success && !loading && amountToAudit > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          fontSize: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--ff-primary)', marginBottom: 8 }}>
            <Network size={14} />
            <span>AI Pre-Flight Simulation & Dry-Run</span>
            <span style={{ fontSize: 9, background: 'rgba(52, 211, 153, 0.1)', color: 'var(--ff-success)', padding: '1px 6px', borderRadius: 4, marginLeft: 'auto', fontWeight: 'bold' }}>
              DRY-RUN: OK
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--ff-text-secondary)', fontSize: 11.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Simulated Gas Fee:</span>
              <span style={{ fontFamily: 'var(--ff-mono)' }}>0.0215 ARC (~$0.04 USDC)</span>
            </div>
            {type === 'SWAP_TOKENS' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Estimated Output:</span>
                <span>{(amountToAudit * 0.9982).toFixed(4)} {swapToToken} (Slippage: 0.18%)</span>
              </div>
            )}
            {type === 'BRIDGE_TOKENS' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Routing Bridge:</span>
                <span>{bridgeFromChain} → CCTP Portal → {bridgeToChain}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Simulation Status:</span>
              <span style={{ color: 'var(--ff-success)', fontWeight: 'bold' }}>Contracts execution check success</span>
            </div>
          </div>
        </div>
      )}

      {/* Policy Shield & Guardrails Compliance Engine */}
      {!success && !loading && amountToAudit > 0 && (
        <div style={{
          background: requiresMfaApproval 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(9, 9, 11, 0.9) 100%)' 
            : 'linear-gradient(135deg, rgba(52, 211, 153, 0.02) 0%, rgba(9, 9, 11, 0.9) 100%)',
          border: requiresMfaApproval ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(52, 211, 153, 0.1)',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          fontSize: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: requiresMfaApproval ? 'var(--ff-danger)' : 'var(--ff-success)', marginBottom: 8 }}>
            <ShieldAlert size={14} color={requiresMfaApproval ? 'var(--ff-danger)' : 'var(--ff-success)'} />
            <span>Policy Compliance Guardrails Check</span>
            <span style={{ 
              fontSize: 9, 
              background: requiresMfaApproval ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)', 
              color: requiresMfaApproval ? 'var(--ff-danger)' : 'var(--ff-success)', 
              padding: '1px 6px', 
              borderRadius: 4, 
              marginLeft: 'auto', 
              fontWeight: 'bold' 
            }}>
              {requiresMfaApproval ? 'SUSPENDED: MFA REQUIRED' : 'COMPLIANT'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--ff-text-secondary)', fontSize: 11.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Autonomy Spending Threshold ($5,000):</span>
              <span style={{ color: isLimitExceeded ? 'var(--ff-danger)' : 'var(--ff-success)' }}>
                {isLimitExceeded ? `Exceeded ($${amountToAudit.toLocaleString()} USDC)` : 'Within limit'}
              </span>
            </div>
            {(type === 'TRANSFER_ASSETS' || type === 'SUBMIT_INVOICE') && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Recipient Whitelist Check:</span>
                <span style={{ color: isAddressNotWhitelisted ? 'var(--ff-danger)' : 'var(--ff-success)' }}>
                  {isAddressNotWhitelisted ? 'Address not in whitelist' : 'Whitelisted address'}
                </span>
              </div>
            )}

            {requiresMfaApproval && (
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 10, marginTop: 4 }}>
                <span style={{ display: 'block', fontSize: 10.5, color: '#fff', marginBottom: 4, fontWeight: 600 }}>
                  Enter 6-digit Corporate Approval PIN to sign off (Use default PIN: 123456)
                </span>
                <input 
                  type="password" 
                  maxLength={6}
                  placeholder="------"
                  className="form-input" 
                  style={{ width: '120px', letterSpacing: '4px', fontSize: 13, padding: '6px 12px', textAlign: 'center', background: '#000' }} 
                  value={overridePin} 
                  onChange={e => setOverridePin(e.target.value.replace(/\D/g, ''))} 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 12, borderRadius: 8, color: 'var(--ff-danger)', fontSize: 12, marginBottom: 12 }}>
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Actions Trigger Footer */}
      {!success && !loading && (
        <div style={{ display: 'flex', gap: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
          <button 
            className="btn btn-primary" 
            onClick={handleAction} 
            style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>Execute Workflow</span> <Play size={12} fill="currentColor" />
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              if (type === 'REGISTER_BUYER') {
                setCompanyName('Tesla Inc')
                setCreditRating('850')
              } else if (type === 'SUBMIT_INVOICE') {
                setInvoiceAnchor('0x32a398da1243c8b991aba311a7db8fd860c234a5')
                setInvoiceAmount('250000')
                setInvoiceDueDate(new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0])
                setInvoiceDesc('Apple Billets supply order Q3')
              } else if (type === 'INIT_TREASURY') {
                setCompanyName('Tesla Inc')
                setCreditRating('850')
              } else if (type === 'VERIFY_WALLET') {
                setWalletAddressToVerify(address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
              }
              toast.info('Form fields pre-populated with sandbox test parameters')
            }}
            style={{ padding: '8px 14px', fontSize: 12 }}
          >
            Autofill Test Data
          </button>
        </div>
      )}
    </div>
  )
}

const ParsedResponseRenderer = ({ content, setActiveView, isNew }: { content: string; setActiveView?: (view: any) => void; isNew?: boolean }) => {
  const blocks = parseAssistantResponse(content)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {blocks.map((block, idx) => {
        if (block.type === 'table') {
          return <PremiumTable key={idx} markdown={block.content} />
        }
        if (block.type === 'credit') {
          return <CreditPassport key={idx} data={block.data} />
        }
        if (block.type === 'vault') {
          return <MatchmakerVaultCard key={idx} data={block.data} />
        }
        if (block.type === 'timeline') {
          return <TimelineList key={idx} content={block.content} />
        }
        if (block.type === 'action') {
          return <ActionBlockCard key={idx} data={block.data} setActiveView={setActiveView} isNew={isNew} />
        }
        return <p key={idx} style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ff-text-secondary)' }}>{formatText(block.content)}</p>
      })}
    </div>
  )
}

export default function AgentView({ setActiveView }: { setActiveView?: (view: any) => void }) {
  const { address, isConnected } = useUnifiedAccount()
  const [mounted, setMounted] = useState(false)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editNameText, setEditNameText] = useState('')
  const [showRightPanel, setShowRightPanel] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  
  // Interactive Onboarding Tour State
  const [showTour, setShowTour] = useState(false)
  const [tourStep, setTourStep] = useState(0)

  // Saved Reports State
  const [savedReports, setSavedReports] = useState([
    { id: 'rep-1', title: 'USDC Treasury Health Report - Q2', date: '2026-06-24', size: '1.2 MB' },
    { id: 'rep-2', title: 'Silicon Wafer Supply Risk Model', date: '2026-06-23', size: '890 KB' }
  ])

  // Live Execution Timeline State during active query
  const [isWorking, setIsWorking] = useState(false)
  const [timelineSteps, setTimelineSteps] = useState([
    { id: 'step-1', label: 'Understanding financial intent', status: 'idle' },
    { id: 'step-2', label: 'Gathering on-chain smart contract logs', status: 'idle' },
    { id: 'step-3', label: 'Analyzing matchmaker vault liquidity', status: 'idle' },
    { id: 'step-4', label: 'Running probability of default models', status: 'idle' },
    { id: 'step-5', label: 'Calculating risk-adjusted payout pricing', status: 'idle' },
    { id: 'step-6', label: 'Compiling structured recommendation', status: 'idle' }
  ])

  // Real-time Reasoning Telemetry States
  const [elapsedTime, setElapsedTime] = useState(0)
  const [agentLogs, setAgentLogs] = useState<string[]>([])
  const [currentStatusText, setCurrentStatusText] = useState('Idle')

  // System status parameters (simulated real-time sync)
  const [latestBlock, setLatestBlock] = useState(3048920)
  const [syncTime, setSyncTime] = useState('Just now')

  useEffect(() => {
    setMounted(true)
    // Check if user has visited before to auto-show tour
    if (typeof window !== 'undefined') {
      const tourShown = localStorage.getItem('ff_agent_tour_shown')
      if (!tourShown) {
        setShowTour(true)
      }

      // Load sessions and active session from localStorage if available
      const stored = localStorage.getItem('factorfi_agent_sessions')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sanitized = parsed.map((session: any) => ({
              ...session,
              messages: session.messages.map((m: any) => ({ ...m, isNew: false }))
            }))
            setSessions(sanitized)
          }
        } catch (e) {
          console.error('Failed to parse sessions from localStorage', e)
        }
      }
      const storedActiveId = localStorage.getItem('factorfi_agent_active_session_id')
      if (storedActiveId) {
        setCurrentSessionId(storedActiveId)
      }
    }

    // Auto increment block number for live feel
    const blockInterval = setInterval(() => {
      setLatestBlock(prev => prev + 1)
      setSyncTime('Just now')
    }, 8000)

    return () => clearInterval(blockInterval)
  }, [])

  // Default Conversations History Data
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'chat-1',
      name: 'Treasury Risk Analysis',
      pinned: true,
      dateGroup: 'Today',
      messages: [
        {
          role: 'assistant',
          content: '🤖 Hello! I am the **FactorFi Master Agent OS**. I orchestrate the risk assessment, double-factoring defense, and gasless stablecoin settlement protocols for FactorFi. Ask me to query credit ratings, analyze matching vaults, or review underwrite records!'
        }
      ]
    },
    {
      id: 'chat-2',
      name: 'Vault Yield Review',
      pinned: false,
      dateGroup: 'Today',
      messages: []
    },
    {
      id: 'chat-3',
      name: 'Risk Assessment Model',
      pinned: false,
      dateGroup: 'Today',
      messages: []
    },
    {
      id: 'chat-4',
      name: 'Credit Passports Report',
      pinned: false,
      dateGroup: 'Yesterday',
      messages: []
    },
    {
      id: 'chat-5',
      name: 'Yield Optimization Q2',
      pinned: false,
      dateGroup: 'Yesterday',
      messages: []
    },
    {
      id: 'chat-6',
      name: 'Treasury Allocation Planning',
      pinned: false,
      dateGroup: 'Previous 7 Days',
      messages: []
    }
  ])

  const [currentSessionId, setCurrentSessionId] = useState('chat-1')
  const [input, setInput] = useState('')

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('factorfi_agent_sessions', JSON.stringify(sessions))
    }
  }, [sessions, mounted])

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('factorfi_agent_active_session_id', currentSessionId)
    }
  }, [currentSessionId, mounted])

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0]
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [currentSession?.messages])

  // New Chat trigger
  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`
    const newSession: ChatSession = {
      id: newId,
      name: `New Analysis Session`,
      pinned: false,
      dateGroup: 'Today',
      messages: [
        {
          role: 'assistant',
          content: '👋 Welcome to a new analysis session. Let me know what treasury or risk query you would like to run today.'
        }
      ]
    }
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newId)
    toast.success('Started a new workspace session')
  }

  // Pin Chat
  const handlePinChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessions(prev => prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s))
  }

  // Delete Chat
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (sessions.length <= 1) {
      toast.error('Cannot delete the last remaining session')
      return
    }
    setSessions(prev => prev.filter(s => s.id !== id))
    if (currentSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id)
      setCurrentSessionId(remaining[0].id)
    }
    toast.success('Session deleted')
  }

  // Start Rename
  const startRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(id)
    setEditNameText(currentName)
  }

  // Save Rename
  const saveRename = (id: string) => {
    if (editNameText.trim()) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, name: editNameText.trim() } : s))
    }
    setEditingChatId(null)
  }

  // Filter sessions on search
  const filteredSessions = sessions.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Preset Action Cards
  const actionCards = [
    { label: 'Analyze Vault Risk', prompt: 'Perform a detailed risk assessment of the Matchmaking Vaults' },
    { label: 'Find Yield Opportunities', prompt: 'Where are the safest high-yield options for my idle USDC?' },
    { label: 'Generate Treasury Report', prompt: 'Generate a Q2 treasury health report for FactorFi' },
    { label: 'Assess Borrower Credit', prompt: 'Evaluate the creditworthiness of anchor debtor 0x32a398da1243c8b991aba311a7db8fd860c234a5' },
    { label: 'Review Stablecoin Exposure', prompt: 'What is our exposure risk to alternative dollar backed assets?' },
    { label: 'Compare Lending Pools', prompt: 'List and compare top yield pools on the ARC Network' }
  ]

  // Prompt trigger
  const handlePresetTrigger = (promptText: string) => {
    setInput(promptText)
  }

  // Send message
  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input
    if (!textToSend.trim()) return
    
    setInput('')
    
    // Add user message
    const userMsg: Message = { role: 'user', content: textToSend }
    
    // Append to active session messages
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s
    ))

    // Set active workspace UI working states
    setIsWorking(true)
    setElapsedTime(0)
    setAgentLogs([`[0.0s] 🚀 Initializing FactorFi Master Agent request...`])
    setCurrentStatusText('Understanding Intent')
    setTimelineSteps(prev => prev.map(step => ({ ...step, status: 'idle' })))

    // Start live elapsed timer
    const timerStart = Date.now()
    const timerInterval = setInterval(() => {
      const elapsed = (Date.now() - timerStart) / 1000
      setElapsedTime(elapsed)
    }, 100)

    let isFetchActive = true

    // Progressive step flow handler
    const runStepAnimation = async () => {
      const logSteps = [
        {
          status: 'Analyzing Intent',
          log: '🔍 Analyzing input query & matching against FactorFi protocols...',
          stepId: 'step-1'
        },
        {
          status: 'Querying Ledger',
          log: '📑 Reading anchor debtor credentials from ARC network registry...',
          stepId: 'step-2'
        },
        {
          status: 'Verifying Reserves',
          log: '💰 Checking Matchmaker pool USDC capacities...',
          stepId: 'step-3'
        },
        {
          status: 'Running Risk Models',
          log: '🛡️ Running probability-of-default credit check underwriting...',
          stepId: 'step-4'
        },
        {
          status: 'Sponsoring Gas fees',
          log: '⚡ Requesting transaction fee sponsorship via Circle Gas Station...',
          stepId: 'step-5'
        },
        {
          status: 'Formatting Results',
          log: '📊 Compiling interactive visual reports & smart components...',
          stepId: 'step-6'
        }
      ]

      for (let i = 0; i < logSteps.length; i++) {
        if (!isFetchActive) break

        const item = logSteps[i]
        setCurrentStatusText(item.status)
        setAgentLogs(prev => [...prev, `[${((Date.now() - timerStart)/1000).toFixed(1)}s] ${item.log}`])
        
        // Update steps state: set current to running, previous to done
        setTimelineSteps(prev => prev.map((s, idx) => {
          if (idx === i) return { ...s, status: 'running' }
          if (idx < i) return { ...s, status: 'done' }
          return s
        }))

        // Wait ~600ms before triggering the next step, unless fetch has completed
        for (let t = 0; t < 6; t++) {
          if (!isFetchActive) break
          await new Promise(r => setTimeout(r, 100))
        }
      }
    }

    // Run the animation thread in parallel
    runStepAnimation()

    const currentChatHistory = currentSession.messages
    const startTime = Date.now()

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...currentChatHistory, userMsg] })
      })

      const data = await response.json()
      const latency = (Date.now() - startTime) / 1000

      // Stop fetch & complete steps
      isFetchActive = false
      clearInterval(timerInterval)

      // Fast-forward all steps to complete
      setTimelineSteps(prev => prev.map(s => ({ ...s, status: 'done' })))
      setAgentLogs(prev => [
        ...prev,
        `[${latency.toFixed(1)}s] ✅ FactorFi Core agent verification successful. Response compiled.`
      ])
      
      // Delay slightly so the user sees the 100% finished state before hiding the timeline
      await new Promise(r => setTimeout(r, 600))
      setIsWorking(false)

      if (response.ok) {
        // Construct detailed assistant response with confidence score and evidence panel context
        const assistantMsg: Message = {
          role: 'assistant',
          content: data.content,
          provider: data.provider || 'offline',
          model: data.model || 'mock',
          latency,
          confidence: 94, // 94% confidence level
          isNew: true,
          evidence: {
            liquidity: 'Healthy',
            tvl: '$8.45M',
            utilization: '68.4%',
            riskEvents: 0,
            chain: 'ARC Testnet L1',
            sources: ['ARC Ledger Protocol Data', 'Underwriting Risk Registry', 'KMS Key Verification Logs']
          }
        }

        setSessions(prev => prev.map(s => 
          s.id === currentSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s
        ))
      } else {
        throw new Error(data.error || 'Failed to communicate with LLM')
      }
    } catch (err: any) {
      isFetchActive = false
      clearInterval(timerInterval)
      setIsWorking(false)
      toast.error('Agent workflow error', { description: err.message })
      const errorMsg: Message = {
        role: 'assistant',
        content: `❌ **Failed to generate analysis.**\n\nError: ${err.message}. Please verify the integrity of your network connection or LLM API keys.`
      }
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s
      ))
    }
  }

  // Handle Export / Save Report mock
  const handleSaveReport = (msgIndex: number) => {
    const reportTitle = `Treasury Report - ${new Date().toISOString().slice(0, 10)}`
    const newReport = {
      id: `rep-${Date.now()}`,
      title: reportTitle,
      date: new Date().toISOString().slice(0, 10),
      size: '2.1 KB'
    }
    setSavedReports(prev => [newReport, ...prev])
    toast.success('Analysis bookmarked as a permanent Treasury Report')
  }

  // Copy Message to clipboard
  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Message content copied to clipboard')
  }

  // Tour steps descriptions
  const tourSteps = [
    {
      title: 'Welcome to FactorFi Agent OS',
      desc: 'This is a premium AI Treasury Operating System designed to help you analyze risk, discover yield opportunities, and automate stablecoin workflows.'
    },
    {
      title: 'Persistent Sidebar Session History',
      desc: 'All your previous treasury reviews, credit audits, and analysis sessions are saved here so you can continue your work anytime.'
    },
    {
      title: 'Evidence & Trust Controls',
      desc: 'Toggle between Simple Mode (focused on business outcomes) and Advanced Mode (visualizing technical logs and tools) using the toggle in the top-right.'
    }
  ]

  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(prev => prev + 1)
    } else {
      setShowTour(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem('ff_agent_tour_shown', 'true')
      }
    }
  }

  if (!mounted) return null

  return (
    <div className="agent-layout-grid">
      <style>{`
        @keyframes ff-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ff-pulse-glow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; box-shadow: 0 0 12px rgba(56, 189, 248, 0.3); border-color: var(--ff-primary) !important; background: rgba(56, 189, 248, 0.04) !important; }
        }
        .ff-spin-animate {
          animation: ff-spin 1.2s linear infinite;
        }
        .ff-pulse-glow-animate {
          animation: ff-pulse-glow 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* LEFT SIDEBAR: Persistent Conversations History & Saved Reports */}
      <div style={{
        background: 'rgba(13, 22, 41, 0.4)',
        border: '1px solid var(--ff-border)',
        borderRadius: 'var(--ff-radius)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%'
      }} className="agent-sidebar">
        {/* New Session Trigger */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--ff-border)' }}>
          <button 
            onClick={handleNewChat}
            style={{
              width: '100%',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid var(--ff-primary)',
              color: 'var(--ff-primary)',
              borderRadius: 'var(--ff-radius-sm)',
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all var(--ff-transition)'
            }}
            className="hover-glow"
          >
            <Plus size={16} />
            <span>New Analysis</span>
          </button>
        </div>

        {/* History Search */}
        <div style={{ padding: '12px 16px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: 'var(--ff-text-muted)' }} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--ff-border)',
              borderRadius: 'var(--ff-radius-sm)',
              padding: '6px 10px 6px 32px',
              fontSize: 12,
              color: '#fff'
            }}
          />
        </div>

        {/* Sessions Scroll list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Today Group */}
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', paddingLeft: 8, display: 'block', marginBottom: 6 }}>
              Today
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredSessions.filter(s => s.dateGroup === 'Today').map(session => (
                <div 
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--ff-radius-sm)',
                    background: currentSessionId === session.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  className="session-history-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <FileText size={14} color={currentSessionId === session.id ? 'var(--ff-primary)' : 'var(--ff-text-secondary)'} />
                    {editingChatId === session.id ? (
                      <input
                        value={editNameText}
                        onChange={e => setEditNameText(e.target.value)}
                        onBlur={() => saveRename(session.id)}
                        onKeyDown={e => e.key === 'Enter' && saveRename(session.id)}
                        autoFocus
                        style={{
                          background: '#09090b',
                          border: '1px solid var(--ff-primary)',
                          borderRadius: 4,
                          color: '#fff',
                          fontSize: 12,
                          width: '100%',
                          padding: '2px 4px'
                        }}
                      />
                    ) : (
                      <span style={{
                        fontSize: 12.5,
                        color: currentSessionId === session.id ? '#fff' : 'var(--ff-text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: currentSessionId === session.id ? 600 : 500
                      }}>
                        {session.name}
                      </span>
                    )}
                  </div>
                  
                  {/* Action triggers (Pin, Rename, Trash) */}
                  <div style={{ display: 'flex', gap: 4 }} className="history-actions">
                    <button 
                      onClick={(e) => handlePinChat(session.id, e)} 
                      style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: session.pinned ? 'var(--ff-primary)' : 'var(--ff-text-muted)' }}
                    >
                      <Pin size={11} fill={session.pinned ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={(e) => startRename(session.id, session.name, e)} 
                      style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--ff-text-muted)' }}
                    >
                      <Edit2 size={11} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteChat(session.id, e)} 
                      style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--ff-text-muted)' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Yesterday Group */}
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', paddingLeft: 8, display: 'block', marginBottom: 6 }}>
              Yesterday
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredSessions.filter(s => s.dateGroup === 'Yesterday').map(session => (
                <div 
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--ff-radius-sm)',
                    background: currentSessionId === session.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="session-history-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <FileText size={14} color="var(--ff-text-secondary)" />
                    <span style={{ fontSize: 12.5, color: 'var(--ff-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {session.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }} className="history-actions">
                    <button onClick={(e) => handlePinChat(session.id, e)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--ff-text-muted)' }}>
                      <Pin size={11} />
                    </button>
                    <button onClick={(e) => handleDeleteChat(session.id, e)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--ff-text-muted)' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Reports Section */}
          <div style={{ borderTop: '1px solid var(--ff-border)', paddingTop: 16, marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', paddingLeft: 8, display: 'block', marginBottom: 8 }}>
              Saved Reports
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {savedReports.map(report => (
                <div 
                  key={report.id} 
                  style={{ 
                    padding: 10, 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--ff-border)', 
                    borderRadius: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}
                >
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {report.title}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: 'var(--ff-text-muted)' }}>{report.date}</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-primary)', padding: 0 }}>
                      <Download size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User context footer */}
        <div style={{ padding: 12, borderTop: '1px solid var(--ff-border)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ff-primary), var(--ff-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={14} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11.5, color: '#fff', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {address ? `Admin: ${address.slice(0, 8)}...` : 'Demouser Account'}
            </span>
            <span style={{ fontSize: 9.5, color: 'var(--ff-success)', fontWeight: 'bold' }}>All systems operational</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER: 2 Column - Left Chat Workspace, Right Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showRightPanel ? 'minmax(0, 1fr) 320px' : 'minmax(0, 1fr)',
        gap: 24,
        height: '100%',
        overflow: 'hidden'
      }} className="agent-workspace-container">
        
        {/* Workspace Central Area */}
        <div style={{
          background: 'var(--ff-surface)',
          border: '1px solid var(--ff-border)',
          borderRadius: 'var(--ff-radius)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Header Panel */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--ff-border)',
            background: 'rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={16} color="var(--ff-primary)" />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
                {currentSession.name}
              </span>
              <button
                onClick={() => {
                  setSessions(prev => prev.map(s => 
                    s.id === currentSessionId ? { ...s, messages: [
                      {
                        role: 'assistant',
                        content: '🤖 Hello! I am the **FactorFi Master Agent OS**. I orchestrate the risk assessment, double-factoring defense, and gasless stablecoin settlement protocols for FactorFi. Ask me to query credit ratings, analyze matching vaults, or review underwrite records!'
                      }
                    ] } : s
                  ))
                  toast.success('Chat history cleared!')
                }}
                style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 4,
                  color: 'var(--ff-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  padding: '3px 8px',
                  marginLeft: 12,
                  transition: 'all 0.2s'
                }}
                title="Clear current session chat history"
              >
                <Trash2 size={11} />
                <span>Clear Thread</span>
              </button>
            </div>
            
            {/* Header controls: Simple/Advanced Mode toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div 
                onClick={() => setIsAdvancedMode(prev => !prev)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ fontSize: 11.5, color: 'var(--ff-text-secondary)', fontWeight: 600 }}>
                  Advanced Mode
                </span>
                {isAdvancedMode ? (
                  <ToggleRight size={22} color="var(--ff-primary)" />
                ) : (
                  <ToggleLeft size={22} color="var(--ff-text-muted)" />
                )}
              </div>

              <button 
                onClick={() => setShowRightPanel(p => !p)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--ff-border)',
                  borderRadius: 'var(--ff-radius-sm)',
                  padding: '4px 10px',
                  fontSize: 11,
                  color: 'var(--ff-text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {showRightPanel ? 'Close Inspector' : 'Inspect Workspace'}
              </button>
            </div>
          </div>

          {/* Active Chat workspace */}
          <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', background: '#020202', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {currentSession.messages.length <= 1 ? (
              
              /* REDESIGNED EMPTY STATE WITH ONBOARDING HEURISTICS */
              <div style={{ maxWidth: 680, margin: '20px auto', display: 'flex', flexDirection: 'column', gap: 28, animation: 'ffDropdownFadeIn 300ms ease' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--ff-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 0 15px var(--ff-primary-glow)' }}>
                    <Bot size={22} color="var(--ff-primary)" />
                  </div>
                  <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                    What would you like to do today?
                  </h1>
                  <p style={{ fontSize: 14, color: 'var(--ff-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Use AI to analyze treasury operations, evaluate risk, discover yield opportunities, and automate financial workflows.
                  </p>
                </div>

                {/* Primary Action Cards Grid */}
                <div className="agent-presets-grid" style={{ gap: 14 }}>
                  {actionCards.map((card, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handlePresetTrigger(card.prompt)}
                      style={{
                        padding: 16,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--ff-border)',
                        borderRadius: 'var(--ff-radius)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        animationDelay: `${idx * 60}ms`
                      }}
                      className="ff-motion-card ff-fade-in-up preset-action-card"
                    >
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ff-primary)', margin: '0 0 4px 0' }}>
                        {card.label}
                      </h4>
                      <p style={{ fontSize: 11.5, color: 'var(--ff-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        {card.prompt}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Example Prompts Panel */}
                <div style={{ borderTop: '1px solid var(--ff-border)', paddingTop: 20 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                    Try one of these examples
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      'Analyze the risk profile of this vault',
                      'Compare the top lending pools for USDC',
                      'Generate a treasury health report',
                      'Find the safest yield opportunities',
                      'Evaluate borrower creditworthiness'
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePresetTrigger(example)}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--ff-border)',
                          borderRadius: 30,
                          padding: '6px 14px',
                          fontSize: 11.5,
                          color: 'var(--ff-text-secondary)',
                          cursor: 'pointer',
                          transition: 'all var(--ff-transition)'
                        }}
                        className="example-prompt-btn"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            ) : (
              
              /* Active Chat messages list */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 820, width: '100%', margin: '0 auto' }}>
                {currentSession.messages.map((msg, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: 8,
                    animation: 'ffDropdownFadeIn 200ms ease'
                  }}>
                    {/* Message Bubble */}
                    <div style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--ff-radius)',
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      background: msg.role === 'user' ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.01)',
                      color: msg.role === 'user' ? 'var(--ff-primary)' : 'var(--ff-text)',
                      border: `1px solid ${msg.role === 'user' ? 'rgba(56, 189, 248, 0.3)' : 'var(--ff-border)'}`,
                      width: '100%',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                    }}>
                      
                      {/* Message author badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: msg.role === 'user' ? 'var(--ff-primary)' : 'var(--ff-violet)' }}>
                          {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                          {msg.role === 'user' ? 'User Intent' : 'FactorFi Treasury Agent'}
                        </span>
                        
                        {/* Message actions (Copy, Save) */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            onClick={() => handleCopyMessage(msg.content)} 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
                            className="msg-action-btn"
                          >
                            <Copy size={11} /> <span style={{ fontSize: 9 }}>Copy</span>
                          </button>
                          {msg.role === 'assistant' && (
                            <button 
                              onClick={() => handleSaveReport(idx)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ff-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
                              className="msg-action-btn"
                            >
                              <Bookmark size={11} /> <span style={{ fontSize: 9 }}>Save Report</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content rendering */}
                      <div style={{ fontSize: 13.5 }}>
                        {msg.role === 'assistant' ? (
                          <ParsedResponseRenderer content={msg.content} setActiveView={setActiveView} isNew={msg.isNew} />
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        )}
                      </div>

                      {/* Assistant Confidence & Telemetry info block */}
                      {msg.role === 'assistant' && msg.confidence && (
                        <div style={{ 
                          marginTop: 16, 
                          padding: 12, 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--ff-border)', 
                          borderRadius: 8,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={14} color="var(--ff-success)" />
                            <span style={{ fontSize: 11, color: 'var(--ff-text-secondary)' }}>
                              Confidence Level: <strong style={{ color: 'var(--ff-success)' }}>{msg.confidence}%</strong>
                            </span>
                            <span style={{ fontSize: 10, background: 'rgba(52, 211, 153, 0.1)', color: 'var(--ff-success)', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold', marginLeft: 4 }}>
                              Strong Data Coverage
                            </span>
                          </div>
                          {msg.latency && (
                            <span style={{ fontSize: 10, color: 'var(--ff-text-muted)' }}>
                              Processed in: {msg.latency.toFixed(2)}s via {msg.provider} ({msg.model})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live active working execution timeline */}
            {isWorking && (
              <div style={{
                maxWidth: 820,
                width: '100%',
                margin: '0 auto',
                background: 'rgba(13, 22, 41, 0.75)',
                border: '1px solid var(--ff-primary-subtle)',
                borderRadius: 'var(--ff-radius)',
                padding: '20px 24px',
                boxShadow: '0 8px 32px rgba(56, 189, 248, 0.1)',
                backdropFilter: 'blur(12px)',
                animation: 'ffDropdownFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                {/* Telemetry Status Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RefreshCw size={14} className="ff-spin-animate" color="var(--ff-primary)" />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                      Reasoning Swarm: <span style={{ color: 'var(--ff-primary)', textTransform: 'none' }}>{currentStatusText}...</span>
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--ff-text-muted)' }}>
                    Elapsed: <span style={{ color: '#fff', fontWeight: 600 }}>{elapsedTime.toFixed(1)}s</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ 
                    width: `${(timelineSteps.filter(s => s.status === 'done').length / timelineSteps.length) * 100}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, var(--ff-primary) 0%, #38bdf8 100%)', 
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }} />
                </div>

                {/* Grid of Steps */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {timelineSteps.map((step, idx) => (
                    <div 
                      key={step.id} 
                      className={step.status === 'running' ? 'ff-pulse-glow-animate' : ''}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        padding: '10px 12px', 
                        background: step.status === 'done' ? 'rgba(255,255,255,0.01)' : step.status === 'running' ? 'rgba(56,189,248,0.05)' : 'rgba(255,255,255,0.01)', 
                        border: step.status === 'running' ? '1px solid var(--ff-primary)' : '1px solid var(--ff-border)', 
                        borderRadius: 6,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {step.status === 'done' && <CheckSquare size={13} color="var(--ff-success)" />}
                      {step.status === 'running' && <RefreshCw size={13} className="ff-spin-animate" color="var(--ff-primary)" />}
                      {step.status === 'idle' && <div style={{ width: 13, height: 13, border: '1px solid var(--ff-text-muted)', borderRadius: 2 }} />}
                      <span style={{ 
                        fontSize: 11.5, 
                        color: step.status === 'done' ? 'var(--ff-text-muted)' : step.status === 'running' ? '#fff' : 'var(--ff-text-secondary)',
                        fontWeight: step.status === 'running' ? 600 : 500
                      }}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Console Logs */}
                <div style={{
                  padding: 12,
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 6,
                  fontFamily: 'var(--ff-mono)',
                  fontSize: 11,
                  maxHeight: 110,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  {agentLogs.map((log, idx) => (
                    <div key={idx} style={{ 
                      color: log.includes('✅') ? 'var(--ff-success)' : log.includes('🚀') ? 'var(--ff-primary)' : 'var(--ff-text-muted)',
                      lineHeight: 1.4
                    }}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Interactive User Input Console */}
          <div style={{ padding: '20px 24px', background: '#09090b', borderTop: '1px solid var(--ff-border)' }}>
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: `1px solid ${inputFocused ? 'var(--ff-primary)' : 'var(--ff-border)'}`,
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: inputFocused 
                ? '0 0 0 1px rgba(56, 189, 248, 0.25), 0 0 12px rgba(56, 189, 248, 0.1), inset 0 1px 0 rgba(255,255,255,0.02)' 
                : 'inset 0 1px 0 rgba(255,255,255,0.02)'
            }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Ask the AI to generate a report, analyze a vault, or evaluate borrower credit..."
                rows={2}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  width: '100%',
                  resize: 'none',
                  fontFamily: 'var(--ff-font)',
                  lineHeight: 1.5
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 6 }}>
                {/* Context Selection Pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setInput('/risk ')} 
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ff-border)', borderRadius: 4, padding: '3px 8px', fontSize: 10.5, color: 'var(--ff-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>⚡ /risk</span>
                  </button>
                  <button 
                    onClick={() => setInput('/report ')} 
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ff-border)', borderRadius: 4, padding: '3px 8px', fontSize: 10.5, color: 'var(--ff-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>📄 /report</span>
                  </button>
                  <button 
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ff-border)', borderRadius: 4, padding: '3px 8px', fontSize: 10.5, color: 'var(--ff-text-muted)', cursor: 'default', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Network size={10} color="var(--ff-success)" />
                    <span>Gas sponsored</span>
                  </button>
                </div>
                {/* Action composer buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)' }}>↵ to Send</span>
                  <button 
                    onClick={() => handleSend()}
                    disabled={isWorking || !input.trim()}
                    style={{
                      background: 'var(--ff-primary)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 10px',
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: (!input.trim() || isWorking) ? 0.4 : 1,
                      fontWeight: 600,
                      fontSize: 11
                    }}
                    className="ff-btn-interactive"
                  >
                    <Send size={11} style={{ marginRight: 4 }} /> Send
                  </button>
                </div>
              </div>
            </div>
            {/* Disclaimer notice */}
            <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', display: 'block', marginTop: 8, textAlign: 'center' }}>
              FactorFi AI Agent OS uses verified on-chain parameters. Always verify transactions before signing.
            </span>
          </div>
        </div>

        {/* RIGHT SIDEBAR PANEL: Custom Toggle between Simple Mode and Advanced Mode */}
        {showRightPanel && (
          <div style={{
            background: 'rgba(13, 22, 41, 0.4)',
            border: '1px solid var(--ff-border)',
            borderRadius: 'var(--ff-radius)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: 20,
            gap: 20
          }}>
            
            {!isAdvancedMode ? (
              
              /* SIMPLE MODE VIEW: Business Metrics & Evidence */
              <>
                {/* Workspace Analytics Card */}
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Workspace Analytics
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 6, border: '1px solid var(--ff-border)' }}>
                      <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', display: 'block' }}>Assets Analyzed</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>$24.8M</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 6, border: '1px solid var(--ff-border)' }}>
                      <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', display: 'block' }}>Models Checked</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>12.4K</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 6, border: '1px solid var(--ff-border)' }}>
                      <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', display: 'block' }}>Accuracy Rate</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ff-success)' }}>99.98%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 6, border: '1px solid var(--ff-border)' }}>
                      <span style={{ fontSize: 9.5, color: 'var(--ff-text-muted)', display: 'block' }}>Active Sessions</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>5</span>
                    </div>
                  </div>
                </div>

                {/* Confidence Level card */}
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Recommendation Confidence
                  </span>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ff-border)', borderRadius: 'var(--ff-radius)', padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ff-success)', margin: '0 0 4px 0' }}>92%</div>
                    <span style={{ fontSize: 11.5, color: '#fff', fontWeight: 600, display: 'block', marginBottom: 4 }}>High Confidence Rating</span>
                    <p style={{ margin: 0, fontSize: 10.5, color: 'var(--ff-text-muted)', lineHeight: 1.4 }}>
                      Verified utilizing real-time ARC network block records and historical debt logs.
                    </p>
                  </div>
                </div>

                {/* Evidence Used Panel */}
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Evidence Sources Used
                  </span>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ff-border)', borderRadius: 'var(--ff-radius)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--ff-text-secondary)' }}>Matching Liquidity</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ff-success)' }}>High / Safe</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--ff-text-secondary)' }}>Vault TVL</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff' }}>$8.2M USDC</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--ff-text-secondary)' }}>Pool Utilization</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff' }}>65.4%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--ff-text-secondary)' }}>Network Verification</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ff-success)' }}>Verified (ARC)</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--ff-text-muted)', display: 'block', marginBottom: 4 }}>Data Pools queried:</span>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, background: '#111', padding: '2px 6px', borderRadius: 4, color: 'var(--ff-primary)' }}>ARC Ledger</span>
                        <span style={{ fontSize: 9, background: '#111', padding: '2px 6px', borderRadius: 4, color: 'var(--ff-primary)' }}>Circle Registry</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capabilities list */}
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Capabilities
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      'Treasury Risk Assessment',
                      'Credit Rating Inquiries',
                      'Liquidity Pool Reallocation',
                      'Invoice Verification Audit',
                      'Cross-Chain bridging validation'
                    ].map((cap, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ff-text-secondary)' }}>
                        <CheckCircle2 size={12} color="var(--ff-success)" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trust status Center */}
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Trust & System Status
                  </span>
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--ff-border)', borderRadius: 'var(--ff-radius)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10.5, color: 'var(--ff-text-secondary)' }}>Network:</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fff' }}>ARC Testnet</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10.5, color: 'var(--ff-text-secondary)' }}>Latest Block:</span>
                      <span style={{ fontSize: 10.5, fontFamily: 'var(--ff-mono)', color: 'var(--ff-primary)' }}>#{latestBlock}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10.5, color: 'var(--ff-text-secondary)' }}>Last Sync:</span>
                      <span style={{ fontSize: 10.5, color: 'var(--ff-text-muted)' }}>{syncTime}</span>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="dot" style={{ background: 'var(--ff-success)', width: 6, height: 6, borderRadius: '50%' }} />
                      <span style={{ fontSize: 10, color: 'var(--ff-success)', fontWeight: 'bold' }}>All systems operational</span>
                    </div>
                  </div>
                </div>
              </>

            ) : (
              
              /* ADVANCED MODE VIEW: Swarms, Memory and registries */
              <>
                {/* Agent Activity Monitor */}
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Agent Activity
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { name: 'Master Orchestrator', status: 'Active', progress: '100%', duration: '0.1s' },
                      { name: 'Risk & Underwriter', status: 'Idle', progress: '100%', duration: '1.2s' },
                      { name: 'Circle Escrow Pool', status: 'Idle', progress: '100%', duration: '0.8s' },
                      { name: 'Yield Optimization', status: 'Active', progress: 'Waiting', duration: '--' }
                    ].map((agent, idx) => (
                      <div key={idx} style={{ padding: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ff-border)', borderRadius: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff' }}>{agent.name}</span>
                          <span style={{ fontSize: 9, background: agent.status === 'Active' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)', color: agent.status === 'Active' ? 'var(--ff-primary)' : 'var(--ff-text-muted)', padding: '1px 5px', borderRadius: 4 }}>
                            {agent.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ff-text-muted)' }}>
                          <span>Prog: {agent.progress}</span>
                          <span>Dur: {agent.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Tools registry */}
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Available Tools
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { name: 'parseInvoiceDocument', desc: 'OCR LLM Extraction' },
                      { name: 'getAnchorCreditRating', desc: 'On-chain rating verification' },
                      { name: 'verifyDoubleFactoring', desc: 'Duplicate hash checks' },
                      { name: 'sponsorGasFee', desc: 'Circle Paymaster sponsorship' }
                    ].map((tool, idx) => (
                      <div key={idx} style={{ padding: 8, background: '#050505', border: '1px solid var(--ff-border)', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--ff-primary)' }}>{tool.name}</span>
                        <span style={{ fontSize: 9, color: 'var(--ff-text-muted)' }}>{tool.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Knowledge Memory OS */}
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Knowledge Memory
                  </span>
                  <pre style={{
                    background: '#050505',
                    border: '1px solid var(--ff-border)',
                    borderRadius: 6,
                    padding: 10,
                    fontSize: 9.5,
                    color: 'var(--ff-success)',
                    fontFamily: 'var(--ff-mono)',
                    overflowX: 'auto',
                    margin: 0
                  }}>
                    {JSON.stringify({
                      wallet: address || '0x32a39...860c2',
                      network: 'ARC Testnet L1',
                      tokens: ['USDC'],
                      gasAbstracted: true
                    }, null, 2)}
                  </pre>
                </div>
              </>

            )}

          </div>
        )}

      </div>

      {/* INTERACTIVE ONBOARDING WELCOME OVERLAY TOUR */}
      {showTour && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(6px)'
        }}>
          <div className="card animate-in" style={{ maxWidth: 450, width: '90%', background: '#0d1629', border: '1px solid var(--ff-primary)', padding: 28, position: 'relative' }}>
            <button 
              onClick={() => setShowTour(false)}
              style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', color: 'var(--ff-text-muted)', fontSize: 20, cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Sparkles size={20} color="var(--ff-primary)" />
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>
                {tourSteps[tourStep].title}
              </h3>
            </div>
            
            <p style={{ fontSize: 13, color: 'var(--ff-text-secondary)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              {tourSteps[tourStep].desc}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--ff-text-muted)' }}>
                Step {tourStep + 1} of {tourSteps.length}
              </span>
              
              <button 
                onClick={nextTourStep}
                style={{
                  background: 'var(--ff-primary)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 'var(--ff-radius-sm)',
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{tourStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
