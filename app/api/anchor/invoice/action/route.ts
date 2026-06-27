import { NextRequest, NextResponse } from 'next/server'
import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets'
import { FACTORFI_CONTRACT_ADDRESS, factorFiAbi, USDC_ADDRESS_ARC, usdcAbi } from '@/lib/contracts'
import { createPublicClient, http } from 'viem'
import { arcTestnet } from '@/lib/arc-config'

export const dynamic = 'force-dynamic'

const circleClient = initiateUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    const { action, invoiceId, encryptedKey, apiKey, userToken } = await req.json()

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
      console.log(`[API Auth] Authenticated: ${companyName} (${address})`)
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
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const walletId = encryptedKey
    if (!walletId || !userToken) {
      return NextResponse.json(
        { error: 'Circle wallet ID and userToken are required' },
        { status: 400 }
      )
    }

    console.log(`=== UCW Action: ${action.toUpperCase()} Invoice #${invoiceId} ===`)

    const functionName = action === 'approve' ? 'approveInvoice' : 'settleInvoice'
    const challenges: string[] = []

    // If settling, create USDC approval challenge first
    if (action === 'settle') {
      const publicClient = createPublicClient({ chain: arcTestnet, transport: http() })
      const invoiceData = await publicClient.readContract({
        address: FACTORFI_CONTRACT_ADDRESS,
        abi: factorFiAbi,
        functionName: 'getInvoice',
        args: [BigInt(invoiceId)]
      }) as any

      const amount = invoiceData.amount
      console.log(`Creating USDC approval challenge for amount: ${amount.toString()}`)

      const approveRes = await circleClient.createUserTransactionContractExecutionChallenge({
        userToken,
        walletId,
        contractAddress: USDC_ADDRESS_ARC,
        abiFunctionSignature: 'approve(address,uint256)',
        abiParameters: [FACTORFI_CONTRACT_ADDRESS, amount.toString()],
        fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
      })
      const approveChallengeId = (approveRes.data as any)?.challengeId
      if (approveChallengeId) challenges.push(approveChallengeId)
    }

    // Create the main action challenge (approve/settle invoice)
    const execRes = await circleClient.createUserTransactionContractExecutionChallenge({
      userToken,
      walletId,
      contractAddress: FACTORFI_CONTRACT_ADDRESS,
      abiFunctionSignature: functionName === 'approveInvoice'
        ? 'approveInvoice(uint256)'
        : 'settleInvoice(uint256)',
      abiParameters: [invoiceId.toString()],
      fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
    })
    const mainChallengeId = (execRes.data as any)?.challengeId
    if (mainChallengeId) challenges.push(mainChallengeId)

    console.log(`Created ${challenges.length} challenge(s) for ${action}`)

    return NextResponse.json({
      success: true,
      action,
      invoiceId: Number(invoiceId),
      challenges,
      message: `${challenges.length} challenge(s) created. Execute via W3S SDK to complete.`
    })

  } catch (err: any) {
    console.error('Invoice action failed:', err.response?.data || err)
    return NextResponse.json(
      { error: 'Invoice action failed', details: err.response?.data?.message || err.message },
      { status: 500 }
    )
  }
}
