import { NextRequest, NextResponse } from 'next/server'
import { initiateUserControlledWalletsClient, Blockchain } from '@circle-fin/user-controlled-wallets'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const circleClient = initiateUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { companyName, creditRating, action, userToken: inputUserToken, walletId, contractAddress, functionSignature, parameters } = await req.json()

    // ── Action: Fetch wallet address after PIN challenge completion ──
    if (action === 'fetch-address' && inputUserToken) {
      console.log(`[Anchor UCW] Fetching wallet address post-challenge...`)
      
      let wallets: any[] = []
      for (let attempt = 1; attempt <= 8; attempt++) {
        try {
          const walletsRes = await circleClient.listWallets({ userToken: inputUserToken })
          wallets = walletsRes.data?.wallets || []
          if (wallets.length > 0) {
            console.log(`[Anchor UCW] Found wallet on attempt ${attempt}:`, wallets.map((w: any) => `${w.blockchain}: ${w.address}`))
            break
          }
        } catch (e: any) {
          console.warn(`[Anchor UCW] listWallets attempt ${attempt}:`, e.message)
        }
        console.log(`[Anchor UCW] Attempt ${attempt}: Wallet not indexed yet. Retrying in 1.5s...`)
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      if (wallets.length > 0) {
        const arcWallet = wallets.find((w: any) => w.blockchain === Blockchain.ArcTestnet) || wallets[0]
        const bearerToken = `ff_api_${Buffer.from(`${companyName || 'Anchor'}:${arcWallet.address}`).toString('base64')}`
        return NextResponse.json({
          success: true,
          walletId: arcWallet.id,
          address: arcWallet.address,
          companyName: companyName || 'Anchor',
          encryptedKey: arcWallet.id,
          apiKey: bearerToken,
          registrationHash: '0x' + crypto.randomBytes(32).toString('hex'),
          message: 'User-controlled wallet retrieved successfully!'
        })
      }
      return NextResponse.json({ error: 'No wallets found after challenge. Retry.' }, { status: 404 })
    }

    // ── Action: Create contract execution challenge ──
    if (action === 'execute-contract' && inputUserToken) {
      console.log(`[Anchor UCW] Creating contract execution challenge...`)
      
      const execRes = await circleClient.createUserTransactionContractExecutionChallenge({
        userToken: inputUserToken,
        walletId,
        contractAddress,
        abiFunctionSignature: functionSignature,
        abiParameters: parameters || [],
        fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
      })
      const { challengeId } = (execRes.data as any) || {}
      return NextResponse.json({ success: true, challengeId })
    }

    // ── Default: Initialize user + create PIN/wallet challenge ──
    if (!companyName) {
      return NextResponse.json(
        { error: 'Company Name is required' },
        { status: 400 }
      )
    }

    // Generate a deterministic userId from companyName
    const userId = `anchor_${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${crypto.createHash('md5').update(companyName).digest('hex').slice(0, 8)}`
    console.log(`[Anchor UCW] Initializing user-controlled wallet for company: ${companyName}, userId: ${userId}`)

    // 1. Register user if not exists
    let userAlreadyExists = false
    try {
      await circleClient.createUser({ userId })
      console.log(`[Anchor UCW] Created new Circle user: ${userId}`)
    } catch (err: any) {
      const code = err.response?.data?.code
      if (code === 155106) {
        console.log(`[Anchor UCW] User already registered: ${userId}`)
        userAlreadyExists = true
      } else {
        console.warn(`[Anchor UCW] createUser warning:`, err.response?.data || err.message)
      }
    }

    // 2. Generate User Token & Encryption Key (valid for 60 mins)
    const tokenRes = await circleClient.createUserToken({ userId })
    const { userToken, encryptionKey } = (tokenRes.data as any) || {}
    console.log('[Anchor UCW] Session token generated successfully')

    // 3. Check if user already has wallets
    const walletsRes = await circleClient.listWallets({ userToken })
    const wallets = walletsRes.data?.wallets || []

    if (wallets.length > 0) {
      const arcWallet = wallets.find((w: any) => w.blockchain === Blockchain.ArcTestnet) || wallets[0]
      const bearerToken = `ff_api_${Buffer.from(`${companyName}:${arcWallet.address}`).toString('base64')}`
      console.log(`[Anchor UCW] Existing wallet found: ${arcWallet.address}`)
      return NextResponse.json({
        success: true,
        walletId: arcWallet.id,
        address: arcWallet.address,
        companyName,
        encryptedKey: arcWallet.id,
        registrationHash: '0x' + crypto.randomBytes(32).toString('hex'),
        apiKey: bearerToken,
        userToken,
        encryptionKey,
        challengeId: null,
        message: 'Existing user-controlled wallet loaded successfully!'
      })
    }

    // 4. Create PIN + Wallet challenge for new users
    console.log('[Anchor UCW] Creating user PIN with wallets challenge')
    const pinRes = await circleClient.createUserPinWithWallets({
      userToken,
      blockchains: [Blockchain.ArcTestnet],
      accountType: 'SCA',
      idempotencyKey: crypto.randomUUID(),
    })
    const { challengeId } = (pinRes.data as any) || {}

    return NextResponse.json({
      success: true,
      companyName,
      challengeId,
      userToken,
      encryptionKey,
      message: 'PIN challenge initiated. User must complete setup via Circle UI.'
    })

  } catch (err: any) {
    console.error('Failed to create anchor wallet session:', err.response?.data || err)
    return NextResponse.json(
      { error: 'Anchor wallet initialization failed', details: err.response?.data?.message || err.message },
      { status: 500 }
    )
  }
}
