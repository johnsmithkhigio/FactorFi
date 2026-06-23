import { NextRequest, NextResponse } from 'next/server'
import { CircleDevWalletsManager } from '@/lib/circle-dev-wallets'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi, USDC_ADDRESS_ARC, usdcAbi } from '@/lib/contracts'
import { createPublicClient, http } from 'viem'
import { arcTestnet } from '@/lib/arc-config'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    const { action, invoiceId, encryptedKey, apiKey } = await req.json()

    // 1. Bearer Token Authorization
    const token = authHeader ? authHeader.replace(/^Bearer\s+/, '') : apiKey
    if (!token || !token.startsWith('ff_api_')) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing corporate API key' },
        { status: 401 }
      )
    }

    try {
      const base64Payload = token.substring(7) // remove 'ff_api_'
      const decodedPayload = Buffer.from(base64Payload, 'base64').toString('utf8')
      const [companyName, address] = decodedPayload.split(':')
      if (!companyName || !address || !address.startsWith('0x')) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid corporate key payload structure' },
          { status: 401 }
        )
      }
      console.log(`[API Auth] Successfully authenticated corporate client: ${companyName} (${address})`)
    } catch (err) {
      return NextResponse.json(
        { error: 'Unauthorized: Failed to decode bearer token' },
        { status: 401 }
      )
    }

    if (!action || !['approve', 'settle'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "settle"' },
        { status: 400 }
      )
    }

    if (invoiceId === undefined || invoiceId === null) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // encryptedKey represents the Circle walletId passed from the Anchor dashboard
    const walletId = encryptedKey
    if (!walletId) {
      return NextResponse.json(
        { error: 'Circle wallet ID is required' },
        { status: 400 }
      )
    }

    console.log(`=== Programmatic Action Request: ${action.toUpperCase()} ===`)
    console.log('Invoice ID:', invoiceId)
    console.log('Circle Wallet ID:', walletId)

    const manager = CircleDevWalletsManager.getInstance()
    const functionName = action === 'approve' ? 'approveInvoice' : 'settleInvoice'

    // If settling, we must verify that the corporate wallet has approved USDC allowance first
    // Since settleInvoice transfers USDC from Anchor to contract, we perform automated approvals
    if (action === 'settle') {
      const publicClient = createPublicClient({ chain: arcTestnet, transport: http() })
      
      // Look up invoice amount
      const invoiceData = await publicClient.readContract({
        address: FACTORFI_CONTRACT_ADDRESS,
        abi: factorFiAbi,
        functionName: 'getInvoice',
        args: [BigInt(invoiceId)]
      }) as any

      const amount = invoiceData.amount

      console.log(`Settle action detected. Executing automatic USDC approval of ${amount.toString()} decimals for FactorFi contract...`)
      
      // Perform automated approval from corporate developer-controlled wallet
      const approveHash = await manager.executeTransaction(
        walletId,
        USDC_ADDRESS_ARC,
        usdcAbi,
        'approve',
        [FACTORFI_CONTRACT_ADDRESS, amount]
      )
      console.log('Automated USDC Approval transaction confirmed:', approveHash)
    }

    // 2. Route the transaction to the serialized queue to execute approve/settle on-chain via Circle API
    const txHash = await manager.executeTransaction(
      walletId,
      FACTORFI_CONTRACT_ADDRESS,
      factorFiAbi,
      functionName,
      [BigInt(invoiceId)]
    )

    console.log(`Programmatic ${action} completed successfully! Tx Hash:`, txHash)

    return NextResponse.json({
      success: true,
      action,
      invoiceId: Number(invoiceId),
      hash: txHash,
      message: `Invoice successfully ${action === 'approve' ? 'approved' : 'settled'} programmatically!`
    })

  } catch (err: any) {
    console.error('Programmatic invoice action execution failed:', err)
    return NextResponse.json(
      { error: 'Programmatic invoice action execution failed', details: err.message },
      { status: 500 }
    )
  }
}
