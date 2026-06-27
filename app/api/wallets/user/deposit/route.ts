import { NextRequest, NextResponse } from 'next/server'
import { initiateUserControlledWalletsClient, Blockchain } from '@circle-fin/user-controlled-wallets'
import { FACTORFI_CONTRACT_ADDRESS, USDC_ADDRESS_ARC } from '@/lib/contracts'

export const dynamic = 'force-dynamic'

const circleClient = initiateUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { email, amount } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
    }

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 })
    }

    const userId = email.toLowerCase().trim()
    console.log(`=== Initiating On-Chain Circle Wallet Deposit challenge ===`)
    console.log(`User: ${userId}, Amount: ${amount} USDC`)

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

    console.log(`[Circle Deposit API] Found wallet: ${arcWallet.address} (ID: ${arcWallet.id})`)

    // 3. Initiate transfer transaction challenge
    // In User-Controlled Wallets, createTransaction only returns { challengeId }.
    // The transactionId is NOT available until the user signs the challenge via PIN.
    const txRes = await circleClient.createTransaction({
      userToken,
      walletId: arcWallet.id,
      destinationAddress: FACTORFI_CONTRACT_ADDRESS,
      amounts: [amount.toString()],
      blockchain: Blockchain.ArcTestnet,
      tokenAddress: USDC_ADDRESS_ARC,
      fee: { type: 'level', config: { feeLevel: 'HIGH' } }
    })

    const challengeId = txRes.data?.challengeId
    if (!challengeId) {
      throw new Error('No challengeId returned from createTransaction')
    }

    console.log(`[Circle Deposit API] Challenge created: ${challengeId}`)

    // Return challengeId to frontend. The frontend will:
    // 1. Execute the challenge (user enters PIN)
    // 2. After PIN success, poll tx-status using challengeId
    //    (tx-status resolves the transactionId from correlationIds)
    return NextResponse.json({
      success: true,
      challengeId,
      userToken,
      encryptionKey
    })

  } catch (err: any) {
    console.error('Failed to create Circle wallet deposit transaction:', err.response?.data || err)
    return NextResponse.json(
      { error: 'Circle transaction initiation failed', details: err.response?.data?.message || err.message },
      { status: 500 }
    )
  }
}
