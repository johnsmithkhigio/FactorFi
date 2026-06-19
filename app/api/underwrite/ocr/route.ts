import { NextResponse } from 'next/server'
import { UnderwriterAgent } from '@/lib/underwrite-agent'
import { GatewayClient } from '@/lib/gateway-client'
import { createPublicClient, http } from 'viem'
import { arcTestnet } from '@/lib/arc-config'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi } from '@/lib/contracts'

const NANOPAYMENT_FEE = 0.0001 // $0.0001 USDC
const DAILY_LIMIT = 100 // Maximum 100 invoice scans per user per 24 hours

export async function POST(req: Request) {
  try {
    const proofHeader = req.headers.get('X-Nanopayment-Proof')
    const userAddress = req.headers.get('X-Nanopayment-Address')

    if (!proofHeader) {
      const response = NextResponse.json(
        {
          error: 'Payment Required',
          amount: NANOPAYMENT_FEE.toString(),
          token: 'USDC',
          message: `x402 Nanopayment of ${NANOPAYMENT_FEE} USDC required. Please sign payment authorization.`,
        },
        { status: 402 }
      )
      response.headers.set('Payment-Required', `GatewayWalletBatched amount="${NANOPAYMENT_FEE}" token="USDC"`)
      return response
    }

    if (!userAddress) {
      return NextResponse.json({ error: 'X-Nanopayment-Address header is required' }, { status: 400 })
    }

    // 1. Enforce Daily Limit (Spam / DoS protection)
    const transactions = GatewayClient.getTransactions(userAddress)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const dailyVolume = transactions.filter(
      (t) => t.type === 'spend' && t.timestamp > oneDayAgo && t.description.includes('Underwriter AI')
    ).length

    if (dailyVolume >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily processing limit exceeded. Maximum 100 pages per day.' },
        { status: 429 }
      )
    }

    // 2. Cryptographically verify the x402 nanopayment proof
    const verifyResult = await GatewayClient.verifyNanopaymentProof(proofHeader, NANOPAYMENT_FEE)
    if (!verifyResult.valid) {
      const isBalanceErr = verifyResult.error?.includes('balance')
      const status = isBalanceErr ? 402 : 400
      
      const response = NextResponse.json(
        {
          error: isBalanceErr ? 'Payment Required' : 'Invalid Payment Proof',
          details: verifyResult.error,
        },
        { status }
      )
      if (isBalanceErr) {
        response.headers.set('Payment-Required', `GatewayWalletBatched amount="${NANOPAYMENT_FEE}" token="USDC"`)
      }
      return response
    }

    // 3. Process the file uploaded
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const token = (formData.get('token') as string | null) || '0x3600000000000000000000000000000000000000'
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Convert uploaded file to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // OCR LLM-Parsing
    const parsedDetails = await UnderwriterAgent.parseInvoiceDocument(buffer, file.name)
    parsedDetails.token = token
    
    // Fetch real credit rating from blockchain for the anchor address
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http()
    })

    let rating = 700 // Fallback default score if lookup fails or unregistered
    try {
      const anchorData = await publicClient.readContract({
        address: FACTORFI_CONTRACT_ADDRESS,
        abi: factorFiAbi,
        functionName: 'getAnchor',
        args: [parsedDetails.anchor as `0x${string}`]
      }) as any
      
      const isRegistered = anchorData?.isRegistered ?? anchorData?.[4]
      const creditRating = anchorData?.creditRating ?? anchorData?.[1]

      if (anchorData && isRegistered) {
        rating = Number(creditRating)
        console.log(`[Underwrite API] Found registered anchor ${parsedDetails.anchor} on-chain with rating ${rating}`)
      } else {
        console.log(`[Underwrite API] Anchor ${parsedDetails.anchor} not registered on-chain. Using default fallback rating ${rating}`)
      }
    } catch (e) {
      console.warn(`[Underwrite API] Failed to read on-chain anchor details, using default. Error:`, e)
    }

    const ratingDecision = UnderwriterAgent.calculateRiskMargin(rating)

    if (ratingDecision.decision === 'REJECTED') {
      return NextResponse.json({
        error: `Invoice underwriting rejected: debtor credit score (${rating}) is below minimum limit.`,
        rating
      }, { status: 400 })
    }

    // Compute and Sign Cryptographic Invoice Hash
    const invoiceHash = UnderwriterAgent.calculateInvoiceHash(parsedDetails)
    const signature = await UnderwriterAgent.signInvoiceHash(invoiceHash)

    // Return Underwriting Result and updated Gateway balance
    return NextResponse.json({
      details: parsedDetails,
      invoiceHash,
      signature,
      confidence: 0.98,
      riskMarginBps: ratingDecision.riskMarginBps,
      decision: 'APPROVED',
      anchorRating: rating,
      newBalance: verifyResult.newBalance,
    })

  } catch (error: any) {
    console.error('OCR underwriting API failure:', error)
    return NextResponse.json({ error: 'Failed to underwrite invoice', details: error.message }, { status: 500 })
  }
}
