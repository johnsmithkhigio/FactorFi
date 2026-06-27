import { NextRequest, NextResponse } from 'next/server'
import { initiateUserControlledWalletsClient, Blockchain } from '@circle-fin/user-controlled-wallets'

export const dynamic = 'force-dynamic'

const circleClient = initiateUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { email, contractAddress, abiFunctionSignature, abiParameters } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
    }

    if (!contractAddress || !abiFunctionSignature || !abiParameters) {
      return NextResponse.json({ error: 'contractAddress, abiFunctionSignature, and abiParameters are required' }, { status: 400 })
    }

    const userId = email.toLowerCase().trim()
    console.log(`=== Initiating On-Chain Circle Contract Execution Challenge ===`)
    console.log(`User: ${userId}, Contract: ${contractAddress}, Func: ${abiFunctionSignature}, Params:`, abiParameters)

    // 1. Generate User Token & Encryption Key (valid for 60 mins)
    const tokenRes = await circleClient.createUserToken({ userId })
    const { userToken, encryptionKey } = (tokenRes.data as any) || {}

    // 2. Fetch User Wallets
    const walletsRes = await circleClient.listWallets({ userToken })
    const wallets = walletsRes.data?.wallets || []

    const arcWallet = wallets.find((w: any) => w.blockchain === Blockchain.ArcTestnet) || wallets[0]
    if (!arcWallet) {
      return NextResponse.json({ error: 'No wallets found for this user account' }, { status: 404 })
    }

    console.log(`[Circle Exec API] Found wallet: ${arcWallet.address} (ID: ${arcWallet.id})`)

    // 3. Create the contract execution challenge
    const execRes = await circleClient.createUserTransactionContractExecutionChallenge({
      userToken,
      walletId: arcWallet.id,
      contractAddress,
      abiFunctionSignature,
      abiParameters,
      fee: { type: 'level', config: { feeLevel: 'HIGH' } },
    })

    const challengeId = (execRes.data as any)?.challengeId
    if (!challengeId) {
      throw new Error('No challengeId returned from createUserTransactionContractExecutionChallenge')
    }

    console.log(`[Circle Exec API] Challenge created: ${challengeId}`)

    return NextResponse.json({
      success: true,
      challengeId,
      userToken,
      encryptionKey
    })

  } catch (err: any) {
    console.error('Failed to create Circle contract execution challenge:', err.response?.data || err)
    return NextResponse.json(
      { error: 'Circle contract execution initiation failed', details: err.response?.data?.message || err.message },
      { status: 500 }
    )
  }
}
